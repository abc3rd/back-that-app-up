import { encodeWav } from './wav';

export const SAMPLE_RATE = 16000;

// Paper dB scale: 20*log10(rms) over signed 16-bit samples. 0 dB = silence, ~90.3 dB = full scale.
//
// Architecture:
// - The microphone runs continuously while armed. `ring` is an in-memory circular
//   buffer that overwrites itself as new audio arrives. Advancing the buffer never
//   creates a recording.
// - A Saved Capture is produced ONLY by an explicit trigger (button, voice phrase,
//   or an auto spike when Auto Capture on Sound is enabled). `capture()` snapshots
//   the current pre-roll, then accumulates `postRollSeconds` of post-roll from the
//   SAME running mic stream — no second recorder is created.
export default class PreRollEngine {
  constructor({ onLevel, onCapture, onCaptureStart }) {
    Object.assign(this, { onLevel, onCapture, onCaptureStart });
    this.post = null;
    this.lastDb = 0;
    this.autoCapture = false;
    this.postRollSeconds = 10;
    this.cooldownMs = 2000;
    this.lastCaptureAt = 0;
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

  setPostRoll(seconds) { this.postRollSeconds = seconds; }
  setAutoCapture(on) { this.autoCapture = !!on; }

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
      // A capture is in progress: accumulate post-roll from the running stream.
      this.post.chunks.push(samples.slice());
      this.post.count += n;
      this.post.peak = Math.max(this.post.peak, db);
      if (this.post.count >= this.post.seconds * SAMPLE_RATE) this.finishPost();
    } else if (this.autoCapture && db >= this.threshold && this.offCooldown()) {
      // Auto spike capture — only when enabled and off cooldown.
      this.capture('spike');
    }
    this.onLevel(db);
  }

  offCooldown() {
    return Date.now() - this.lastCaptureAt >= this.cooldownMs + this.postRollSeconds * 1000;
  }

  // Begin a Saved Capture: snapshot the pre-roll, then collect post-roll.
  // The rolling mic buffer keeps running; no second recorder is created.
  capture(triggerType) {
    if (!this.ctx || this.post) return;
    this.lastCaptureAt = Date.now();
    const triggerTimestamp = Date.now();
    this.post = {
      pre: this.snapshot(),
      triggerType,
      triggerTimestamp,
      chunks: [],
      count: 0,
      peak: this.lastDb,
      seconds: this.postRollSeconds,
    };
    this.onCaptureStart?.(triggerType);
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
    const { pre, chunks, count, peak, triggerType, triggerTimestamp } = this.post;
    const all = new Int16Array(pre.length + count);
    all.set(pre);
    let o = pre.length;
    chunks.forEach((c) => { all.set(c, o); o += c.length; });
    this.post = null;
    this.emit(all, triggerType, peak, triggerTimestamp, pre.length);
  }

  // Manual button trigger → pre-roll + post-roll capture.
  saveNow() { this.capture('button'); }
  // Voice phrase trigger → pre-roll + post-roll capture.
  voiceCapture() { this.capture('voice'); }

  emit(samples, triggerType, peakDb, triggerTimestamp, preRollSamples) {
    if (!samples.length) return;
    const blob = encodeWav(samples, SAMPLE_RATE);
    const triggerOffsetMs = Math.round((preRollSamples / SAMPLE_RATE) * 1000);
    this.onCapture({
      blob,
      durationMs: (samples.length / SAMPLE_RATE) * 1000,
      peakDb,
      triggerType,
      triggerTimestamp,
      triggerOffsetMs,
    });
  }
}