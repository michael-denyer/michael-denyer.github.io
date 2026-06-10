// Synthesized workshop sounds — no samples, gesture-gated WebAudio.
// Every public function is safe to call even if audio is unavailable.

let ctx = null;
let master = null;
let muted = false;

function ac() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.22;
}

export function isMuted() {
  return muted;
}

function env(a, gain, t0, attack, hold, release, peak) {
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.setValueAtTime(peak, t0 + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
}

function noiseBuffer(a, seconds) {
  const buf = a.createBuffer(1, a.sampleRate * seconds, a.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    // brown-ish noise: integrate white, keep bounded
    last = (last + (Math.random() * 2 - 1) * 0.18) * 0.985;
    d[i] = last * 2.4;
  }
  return buf;
}

export function purr() {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a, 2.6);
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;
  const vca = a.createGain();
  const lfo = a.createOscillator();
  lfo.frequency.value = 24;
  const lfoDepth = a.createGain();
  lfoDepth.gain.value = 0.32;
  lfo.connect(lfoDepth).connect(vca.gain);
  const out = a.createGain();
  env(a, out, t0, 0.25, 1.6, 0.7, 0.8);
  vca.gain.value = 0.45;
  src.connect(lp).connect(vca).connect(out).connect(master);
  const sub = a.createOscillator();
  sub.frequency.value = 27;
  const subGain = a.createGain();
  env(a, subGain, t0, 0.3, 1.5, 0.7, 0.18);
  sub.connect(subGain).connect(master);
  src.start(t0);
  sub.start(t0);
  src.stop(t0 + 2.6);
  sub.stop(t0 + 2.6);
}

export function mew() {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  const osc = a.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(560, t0);
  osc.frequency.linearRampToValueAtTime(940, t0 + 0.09);
  osc.frequency.linearRampToValueAtTime(440, t0 + 0.26);
  const g = a.createGain();
  env(a, g, t0, 0.02, 0.14, 0.14, 0.5);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.32);
}

export function clank() {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  for (const [f, p, d] of [[1244, 0.5, 0.16], [1867, 0.3, 0.1], [831, 0.35, 0.22]]) {
    const osc = a.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = f;
    const g = a.createGain();
    env(a, g, t0, 0.004, 0.01, d, p);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + d + 0.05);
  }
}

export function woof() {
  const a = ac();
  if (!a) return;
  for (const dt of [0, 0.22]) {
    const t0 = a.currentTime + dt;
    const osc = a.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, t0);
    osc.frequency.exponentialRampToValueAtTime(68, t0 + 0.13);
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    const g = a.createGain();
    env(a, g, t0, 0.012, 0.05, 0.1, 0.85);
    osc.connect(lp).connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.25);
  }
}

export function toot() {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  const vib = a.createOscillator();
  vib.frequency.value = 5.2;
  const vibDepth = a.createGain();
  vibDepth.gain.value = 9;
  vib.connect(vibDepth);
  for (const [f, p] of [[587, 0.34], [742, 0.26], [988, 0.08]]) {
    const osc = a.createOscillator();
    osc.frequency.value = f;
    vibDepth.connect(osc.frequency);
    const g = a.createGain();
    env(a, g, t0, 0.06, 0.95, 0.5, p);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + 1.6);
  }
  const breath = a.createBufferSource();
  breath.buffer = noiseBuffer(a, 1.6);
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1700;
  const bg = a.createGain();
  env(a, bg, t0, 0.05, 0.9, 0.5, 0.07);
  breath.connect(bp).connect(bg).connect(master);
  breath.start(t0);
  breath.stop(t0 + 1.6);
  vib.start(t0);
  vib.stop(t0 + 1.6);
}

// pattern: 1 = dash, 0 = dot
export function morse(pattern, freq = 720) {
  const a = ac();
  if (!a) return;
  let t0 = a.currentTime;
  for (const sym of pattern) {
    const dur = sym ? 0.16 : 0.06;
    const osc = a.createOscillator();
    osc.frequency.value = freq;
    const g = a.createGain();
    env(a, g, t0, 0.005, dur, 0.03, 0.22);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
    t0 += dur + 0.1;
  }
}

export function zap() {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  const hiss = a.createBufferSource();
  hiss.buffer = noiseBuffer(a, 0.3);
  const hp = a.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1400;
  const hg = a.createGain();
  env(a, hg, t0, 0.005, 0.04, 0.18, 0.3);
  hiss.connect(hp).connect(hg).connect(master);
  hiss.start(t0);
  const osc = a.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, t0);
  osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.3);
  const g = a.createGain();
  env(a, g, t0, 0.005, 0.02, 0.26, 0.12);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.35);
}
