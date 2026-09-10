// Workshop effects and a recorded dog bark, with gesture-gated WebAudio.
// Every public function is safe to call even if audio is unavailable.

let ctx = null;
let master = null;
let muted = false;

function ac() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.4;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.4;
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

function noiseBuffer(a, seconds, white = false) {
  const buf = a.createBuffer(1, a.sampleRate * seconds, a.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    if (white) {
      d[i] = Math.random() * 2 - 1;
    } else {
      // brown-ish noise: integrate white, keep bounded
      last = (last + (Math.random() * 2 - 1) * 0.18) * 0.985;
      d[i] = last * 2.4;
    }
  }
  return buf;
}

export function purr() {
  // source-filter purr: a 25Hz glottal pulse train rung through chest
  // resonances, swelling and fading with a slow breath cycle
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime;
  const out = a.createGain();
  env(a, out, t0, 0.35, 1.6, 0.65, 1.0);
  const breath = a.createOscillator();
  breath.frequency.value = 0.75;
  const breathDepth = a.createGain();
  breathDepth.gain.value = 0.3;
  breath.connect(breathDepth).connect(out.gain);
  out.connect(master);
  const pulses = a.createOscillator();
  pulses.type = "sawtooth";
  pulses.frequency.value = 25;
  for (const [freq, q, g] of [[135, 2.2, 2.4], [310, 2.6, 1.0], [560, 3.0, 0.4]]) {
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const bg = a.createGain();
    bg.gain.value = g;
    pulses.connect(bp).connect(bg).connect(out);
  }
  pulses.start(t0);
  breath.start(t0);
  pulses.stop(t0 + 2.7);
  breath.stop(t0 + 2.7);
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

// Fetching bytes does not enable audio. Decode and play only after a click.
const dogBytes = fetch(new URL("../assets/audio/dog-bark.wav?v=1bdbbf4855e6", import.meta.url))
  .then(response => response.ok ? response.arrayBuffer() : null)
  .catch(() => null);
let dogBuffer = null;
let dogPlaying = false;

async function playDog(rate, volume) {
  if (muted || dogPlaying) return;
  const a = ac();
  if (!a) return;
  dogPlaying = true;
  try {
    const bytes = await dogBytes;
    if (!bytes) { dogPlaying = false; return; }
    dogBuffer ??= await a.decodeAudioData(bytes.slice(0));
    if (muted || a.state !== "running") { dogPlaying = false; return; }
    const source = a.createBufferSource();
    source.buffer = dogBuffer;
    source.playbackRate.value = rate;
    const gain = a.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      dogPlaying = false;
    };
    source.start();
  } catch {
    dogPlaying = false;
  }
}

export function woof() {
  return playDog(0.95, 0.85);
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

export function yip() {
  return playDog(1.15, 0.65);
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
