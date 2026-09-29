import { encodeWav } from './wav';

export const STANDARD_RATE = 16000;
export const HIGH_RATE = 44100;

// Architecture:
// - The microphone runs continuously while armed. `ring` is an in-memory circular
//   buffer that overwrites itself as new audio arrives. Advancing the buffer never
//   creates a recording — the rolling buffer is temporary memory, not a library.
// - A Saved Capture is produced ONLY by an explicit trigger (button, voice phrase,
//   or an auto spike when Auto Capture on Sound is enabled). `capture()` snapshots
//   the current pre-roll, then accumulates `postRollSeconds` of post-roll from the
//   SAME running mic stream — no second recorder is created.
// - Quality (sample rate) and input device are applied at start (arm) time.
// - Cooldowns prevent overlapping captures; sustained-duration gates spikes.
export default class PreRollEngine {
  constructor({ onLevel, onCapture, onCaptureStart }) {
    Object.assign(this, { onLevel, onCapture, onCaptureStart });
    this.post = null;
    this.lastDb = 0;
    this.autoCapture = false;
    this.postRollSeconds = 10;
    this.triggerCooldownMs = 2000;
    this.spikeCooldownMs = 2000;
    this.sustainedDurationMs = 0;
    this.sustainedSince = 0;
    this.floorDb = null;     // slow-moving estimate of the room's ambient level
    this.spikeArmed = true;  // re-arms once the level falls back down
    this.riseDb = 12;        // a spike must rise this far above the ambient floor
    this.rearmDropDb = 6;    // ...and settles back near that floor to re-arm
    this.extendOnSecondTrigger = false;
    this.lastCaptureAt = 0;
    this.sampleRate = STANDARD_RATE;
    this.inputDeviceId = '';
  }

  async start(rewindSeconds, threshold) {
    const audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    if (this.inputDeviceId) audio.deviceId = { exact: this.inputDeviceId };
    this.stream = await navigator.mediaDevices.getUserMedia({ audio });
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
    this.ring = new Int16Array(seconds * this.sampleRate);
    this.w = 0;
    this.filled = false;
  }
  setPostRoll(s) { this.postRollSeconds = s; }
  setAutoCapture(on) { this.autoCapture = !!on; }
  setSampleRate(sr) { this.sampleRate = sr; }
  setInputDeviceId(id) { this.inputDeviceId = id; }
  setExtendOnSecondTrigger(v) { this.extendOnSecondTrigger = !!v; }
  setTriggerCooldown(ms) { this.triggerCooldownMs = ms; }
  setSpikeCooldown(ms) { this.spikeCooldownMs = ms; }
  setSustainedDuration(ms) { this.sustainedDurationMs = ms; this.sustainedSince = 0; }

  process(input) {
    const ratio = this.ctx.sampleRate / this.sampleRate;
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

    const spike = this.detectSpike(db);
    if (this.post) {
      this.post.chunks.push(samples.slice());
      this.post.count += n;
      this.post.peak = Math.max(this.post.peak, db);
      if (this.post.count >= this.post.seconds * this.sampleRate) this.finishPost();
    } else if (this.autoCapture && spike) {
      if (this.sustainedDurationMs > 0) {
        if (!this.sustainedSince) this.sustainedSince = Date.now();
        if (Date.now() - this.sustainedSince >= this.sustainedDurationMs && this.offSpikeCooldown()) this.fireSpike();
      } else if (this.offSpikeCooldown()) {
        this.fireSpike();
      }
    } else {
      this.sustainedSince = 0;
    }
    this.onLevel(db);
  }

  offSpikeCooldown() {
    return Date.now() - this.lastCaptureAt >= this.spikeCooldownMs + this.postRollSeconds * 1000;
  }

  // A spike has to clear the threshold AND rise well above the level the room
  // has been sitting at, so steady loud noise (a fan, chatter, traffic) no
  // longer trips it. The latch re-arms only after the level falls back, so one
  // loud event produces one capture instead of a burst of them.
  detectSpike(db) {
    if (this.floorDb === null) this.floorDb = Math.min(db, this.threshold - this.riseDb);
    else if (db < this.threshold) this.floorDb = this.floorDb * 0.99 + db * 0.01;
    if (db - this.floorDb <= this.rearmDropDb) this.spikeArmed = true;
    return this.spikeArmed && db >= this.threshold && db - this.floorDb >= this.riseDb;
  }

  fireSpike() {
    this.spikeArmed = false;
    this.capture('spike');
  }

  capture(type) {
    if (!this.ctx) return;
    if (this.post) {
      // A capture is already running. Optionally extend it on a second non-spike trigger.
      if (type !== 'spike' && this.extendOnSecondTrigger) {
        this.post.seconds += this.postRollSeconds;
        this.lastCaptureAt = Date.now();
      }
      return;
    }
    if (type === 'voice' && Date.now() - this.lastCaptureAt < this.triggerCooldownMs) return;
    if (type === 'spike' && !this.offSpikeCooldown()) return;
    this.lastCaptureAt = Date.now();
    this.sustainedSince = 0;
    const triggerTimestamp = Date.now();
    this.post = {
      pre: this.snapshot(),
      triggerType: type,
      triggerTimestamp,
      chunks: [],
      count: 0,
      peak: this.lastDb,
      seconds: this.postRollSeconds,
    };
    this.onCaptureStart?.(type);
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

  saveNow() { this.capture('button'); }
  voiceCapture() { this.capture('voice'); }

  emit(samples, triggerType, peakDb, triggerTimestamp, preRollSamples) {
    if (!samples.length) return;
    const blob = encodeWav(samples, this.sampleRate);
    const triggerOffsetMs = Math.round((preRollSamples / this.sampleRate) * 1000);
    this.onCapture({
      blob,
      durationMs: (samples.length / this.sampleRate) * 1000,
      peakDb,
      triggerType,
      triggerTimestamp,
      triggerOffsetMs,
    });
  }
}