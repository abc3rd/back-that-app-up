import { encodeWav } from './wav';

export const SAMPLE_RATE = 16000;
export const POST_ROLL_SECONDS = 10;

// Paper dB scale: 20*log10(rms) over signed 16-bit samples. 0 dB = silence, ~90.3 dB = full scale.
export default class PreRollEngine {
  constructor({ onLevel, onCapture, onCaptureStart }) {
    Object.assign(this, { onLevel, onCapture, onCaptureStart });
    this.post = null;
    this.lastDb = 0;
  }

  async start(rewindSeconds, threshold) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.resume();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (e) => this.process(e.inputBuffer.getChannelData(0));
    const sink = this.ctx.createGain();
    sink.gain.value = 0;
    this.source.connect(this.node);
    this.node.connect(sink);
    sink.connect(this.ctx.destination);
    this.pos = 0;
    this.threshold = threshold;
    this.setRewind(rewindSeconds);
  }

  stop() {
    if (this.post) this.finishPost();
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
    this.ctx = null;
  }

  setRewind(seconds) {
    this.ring = new Int16Array(seconds * SAMPLE_RATE);
    this.w = 0;
    this.filled = false;
  }

  process(input) {
    const ratio = this.ctx.sampleRate / SAMPLE_RATE;
    const out = new Int16Array(Math.ceil((input.length - this.pos) / ratio));
    let n = 0;
    let sum = 0;
    for (let p = this.pos; p < input.length; p += ratio) {
      const s = Math.max(-1, Math.min(1, input[p | 0]));
      const v = Math.round(s < 0 ? s * 32768 : s * 32767);
      out[n++] = v;
      sum += v * v;
    }
    this.pos = this.pos + n * ratio - input.length;
    const samples = out.subarray(0, n);
    const db = 20 * Math.log10(Math.max(Math.sqrt(sum / Math.max(n, 1)), 1));
    this.lastDb = db;
    this.write(samples);

    if (this.post) {
      this.post.chunks.push(samples.slice());
      this.post.count += n;
      this.post.peak = Math.max(this.post.peak, db);
      if (this.post.count >= POST_ROLL_SECONDS * SAMPLE_RATE) this.finishPost();
    } else if (db >= this.threshold) {
      this.post = { pre: this.snapshot(), chunks: [], count: 0, peak: db };
      this.onCaptureStart();
    }
    this.onLevel(db);
  }

  write(samples) {
    for (let i = 0; i < samples.length; i++) {
      this.ring[this.w++] = samples[i];
      if (this.w === this.ring.length) {
        this.w = 0;
        this.filled = true;
      }
    }
  }

  snapshot() {
    if (!this.filled) return this.ring.slice(0, this.w);
    const out = new Int16Array(this.ring.length);
    out.set(this.ring.subarray(this.w));
    out.set(this.ring.subarray(0, this.w), this.ring.length - this.w);
    return out;
  }

  finishPost() {
    const { pre, chunks, count, peak } = this.post;
    const all = new Int16Array(pre.length + count);
    all.set(pre);
    let o = pre.length;
    chunks.forEach((c) => { all.set(c, o); o += c.length; });
    this.post = null;
    this.emit(all, 'threshold', peak);
  }

  saveNow() {
    if (!this.ctx) return;
    this.emit(this.snapshot(), 'button', this.lastDb);
  }

  emit(samples, reason, peakDb) {
    if (!samples.length) return;
    const blob = encodeWav(samples, SAMPLE_RATE);
    this.onCapture({ blob, durationMs: (samples.length / SAMPLE_RATE) * 1000, peakDb, reason });
  }
}