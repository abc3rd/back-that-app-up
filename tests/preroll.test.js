import test from 'node:test';
import assert from 'node:assert/strict';
import PreRollEngine, { STANDARD_RATE, HIGH_RATE } from '../src/lib/preroll/PreRollEngine.js';

function setup(options = {}) {
  const captures = [];
  const e = new PreRollEngine({ onLevel: () => {}, onCapture: (clip) => captures.push(clip), ...options });
  e.ctx = { sampleRate: STANDARD_RATE, state: 'running' };
  e.pos = 0; e.threshold = 55; e.setRewind(1);
  return { e, captures };
}
const quiet = () => new Float32Array(STANDARD_RATE);
const loud = () => new Float32Array(STANDARD_RATE).fill(0.5);
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('bounded ring preserves chronological history on resize', () => {
  const { e } = setup();
  e.write(Int16Array.from({ length: STANDARD_RATE * 2 }, (_, i) => i));
  const history = e.snapshot();
  assert.equal(history.length, STANDARD_RATE); assert.equal(history[0], STANDARD_RATE);
  assert.equal(history.at(-1), STANDARD_RATE * 2 - 1);
  e.setRewind(2); assert.deepEqual(e.snapshot(), history);
  e.setRewind(0.5); assert.deepEqual(e.snapshot(), history.slice(STANDARD_RATE / 2));
  assert.throws(() => e.setRewind(0));
});

test('manual capture contains actual pre-roll and exact post-roll WAV samples', async () => {
  const { e, captures } = setup(); e.setPostRoll(0.25); e.process(loud()); e.saveNow(); e.process(quiet());
  assert.equal(captures.length, 1); assert.equal(captures[0].durationMs, 1250);
  assert.equal(captures[0].triggerType, 'button'); assert.equal(captures[0].triggerOffsetMs, 1000);
  const wav = new DataView(await captures[0].blob.arrayBuffer());
  assert.equal(wav.getUint32(40, true), STANDARD_RATE * 1.25 * 2);
  assert.equal(wav.getInt16(44, true), 16384); assert.equal(wav.getInt16(44 + STANDARD_RATE * 2, true), 0);
});

test('zero post-roll saves immediately without waiting for another audio callback', () => {
  const { e, captures } = setup(); e.setPostRoll(0); e.process(new Float32Array(1600).fill(0.1));
  e.voiceCapture(); assert.equal(captures.length, 1); assert.equal(captures[0].durationMs, 100);
  assert.equal(captures[0].triggerType, 'voice'); assert.equal(e.post, null);
});

test('steady loud audio creates one automatic capture until a quiet rearm', async () => {
  const { e, captures } = setup(); e.setAutoCapture(true); e.setPostRoll(0); e.setSpikeCooldown(0);
  e.process(loud()); await settle();
  for (let i = 0; i < 60; i++) e.process(loud());
  assert.equal(captures.length, 1);
  e.process(quiet()); e.process(loud()); assert.equal(captures.length, 2);
});

test('stopping preserves partial post-roll with original trigger metadata', () => {
  const { e, captures } = setup(); e.setPostRoll(3); e.process(loud()); e.saveNow(); e.process(quiet());
  e.ctx = { close: async () => {} }; e.stop();
  assert.equal(captures[0].durationMs, 2000); assert.equal(captures[0].interrupted, true);
  assert.equal(captures[0].triggerOffsetMs, 1000);
});

test('second trigger can extend an active capture when configured', () => {
  const { e, captures } = setup(); e.setPostRoll(1); e.setExtendOnSecondTrigger(true); e.process(loud()); e.saveNow(); e.saveNow();
  e.process(quiet()); assert.equal(captures.length, 0); e.process(quiet());
  assert.equal(captures[0].durationMs, 3000);
});

test('saving guards concurrent captures and reports async failure', async () => {
  let complete; let failure;
  const { e } = setup({ onCapture: () => new Promise((resolve, reject) => { complete = reject; }), onError: (err) => { failure = err; } });
  e.setPostRoll(0); e.process(quiet()); e.saveNow(); assert.equal(e.saving, true); assert.equal(e.saveNow(), false);
  complete(new Error('storage failed')); await settle(); assert.equal(failure.message, 'storage failed'); assert.equal(e.saving, false);
  e.persistenceBlocked = true; assert.equal(e.saveNow(), false);
});

test('empty buffer and interrupted context cannot produce fake captures', () => {
  let error; const { e, captures } = setup({ onError: (err) => { error = err; } });
  assert.equal(e.saveNow(), false); assert.match(error.message, /empty/);
  e.process(loud()); e.ctx.state = 'suspended'; assert.equal(e.saveNow(), false); assert.equal(captures.length, 0);
});

test('high-quality sample rate remains supported', async () => {
  const { e, captures } = setup(); e.setSampleRate(HIGH_RATE); e.ctx.sampleRate = HIGH_RATE; e.setRewind(1); e.setPostRoll(0);
  e.process(new Float32Array(HIGH_RATE).fill(0.5)); e.saveNow();
  const wav = new DataView(await captures[0].blob.arrayBuffer()); assert.equal(wav.getUint32(24, true), HIGH_RATE); assert.equal(captures[0].durationMs, 1000);
});

test('microphone is released when audio setup fails after permission grant', async () => {
  const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator'); const win = globalThis.window; let stopped = false;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => { stopped = true; } }] }) } } });
  globalThis.window = { AudioContext: class { constructor() { throw new Error('Audio setup failed'); } } };
  try { await assert.rejects(new PreRollEngine({}).start(30, 55), /Audio setup failed/); assert.equal(stopped, true); }
  finally { if (nav) Object.defineProperty(globalThis, 'navigator', nav); else delete globalThis.navigator; globalThis.window = win; }
});
