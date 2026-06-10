import * as S from "./sprites.js";
import * as sfx from "./audio.js";
import { fallback, fetchLive } from "./data.js";

const W = 1920, H = 1080;
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const NIGHT = {
  name: "night",
  wallTop: "#181420", wallBottom: "#0e0b14", plate: "#1f1a2a",
  floor: "#171219", floorLine: "#231b24", glowPool: "rgba(255,176,80,0.07)",
  brass: "#c9a24a", brassDark: "#8a6d2f", brassLight: "#e2c878",
  copper: "#7d4a30", copperDark: "#5a3320", copperLight: "#925a3c",
  gaugeFace: "#efe5cb",
  ironGear: "#262030", ironGearDark: "#171221",
  tubeCasing: "#3a3148", aether: "#4fd8c8", aetherDim: "#2c7a72",
  aetherBright: "#bdfff4", aetherGlow: 16,
  haze: "rgba(255,170,70,0.05)",
  lampGlow: "rgba(255,190,90,0.16)",
  balloon: "#7d4a30", balloonDark: "#5a3320", balloonRib: "#46271a",
  bannerCloth: "#e8d9b8",
  ember: "#ff9b4a",
  eyeGlow: 0.55,
  steamRGB: "214,210,224", steamA: 0.2,
  poolRGB: "255,176,80", poolA: 0.1,
  textDim: "#9a8f78",
  fireGlow: "rgba(255,120,30,0.5)",
};
const DAY = {
  ...NIGHT,
  name: "day",
  wallTop: "#5e5044", wallBottom: "#443830", plate: "#6e5c50",
  floor: "#4a3c34", floorLine: "#5c4a40", glowPool: "rgba(255,200,120,0.06)",
  ironGear: "#6e6054", ironGearDark: "#574b41",
  tubeCasing: "#6e6054", aetherGlow: 9,
  haze: "rgba(255,200,120,0.10)",
  lampGlow: "rgba(255,190,90,0.05)",
  eyeGlow: 0,
  steamRGB: "244,240,234", steamA: 0.26,
  poolRGB: "255,210,140", poolA: 0.07,
  fireGlow: "rgba(255,120,30,0.35)",
};

function softGlow(x, y, rx, ry, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.beginPath();
  ctx.arc(x, y, rx, 0, 7);
  ctx.fill();
  ctx.restore();
}

let pal = matchMedia("(prefers-color-scheme: dark)").matches ? NIGHT : DAY;
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  pal = e.matches ? NIGHT : DAY;
});
document.getElementById("mode").addEventListener("click", () => {
  pal = pal.name === "night" ? DAY : NIGHT;
});
const sfxBtn = document.getElementById("sfx");
sfxBtn.addEventListener("click", () => {
  sfx.setMuted(!sfx.isMuted());
  sfxBtn.classList.toggle("muted", sfx.isMuted());
  sfxBtn.setAttribute("aria-pressed", String(!sfx.isMuted()));
});

let data = fallback;
fetchLive().then((d) => { data = d; });

// ---- input ------------------------------------------------------------
const mouse = { x: 0.5, y: 0.5, px: W / 2, py: H / 2 };
let view = { scale: 1, ox: 0, oy: 0 };
addEventListener("pointermove", (e) => {
  mouse.x = e.clientX / innerWidth;
  mouse.y = e.clientY / innerHeight;
  mouse.px = (e.clientX - view.ox) / view.scale;
  mouse.py = (e.clientY - view.oy) / view.scale;
  canvas.style.cursor = hitSpot() ? "pointer" : "default";
});
const par = { x: 0, y: 0 };

// ---- interactions --------------------------------------------------------
// fx values are "active until" timestamps in frame time.
const fx = { whistle: 0, woof: 0, telegraph: 0, surge: 0, zoomie: 0, pets: new Map() };
let steamBursts = [], hearts = [], scraps = [], sparks = [], bubbles = [], parcels = [];
let nowT = 0;

const AIRSHIP_Y = 150;
function airshipX(t) {
  return ((t * 0.055 + 900) % (W + 760)) - 380;
}

const JUNCTIONS = [[430, 300], [900, 300], [900, 180], [820, 640]];
const WHISTLE = { x: 1285, y: 330 };

function hotspots() {
  const kx = runaway.x - runaway.dir * 92;
  return [
    { x: 1432, y: 505, r: 75, act: "pet", id: "ladder" },
    { x: boilerXs[1] + 75, y: 372, r: 65, act: "pet", id: "sleeper" },
    { x: 950, y: 700, r: 75, act: "pet", id: "operator" },
    { x: kx, y: FLOOR - 30, r: 65, act: "pet", id: "kitten" },
    { x: 330, y: FLOOR - 55, r: 85, act: "woof" },
    { x: airshipX(nowT), y: AIRSHIP_Y + 20, r: 115, act: "airdrop" },
    { x: WHISTLE.x, y: WHISTLE.y + 30, r: 65, act: "whistle" },
    { x: 1068, y: 735, r: 60, act: "telegraph" },
    ...JUNCTIONS.map(([jx, jy]) => ({ x: jx, y: jy, r: 42, act: "surge" })),
  ];
}

function hitSpot() {
  let best = null, bd = 1e9;
  for (const h of hotspots()) {
    const d = Math.hypot(h.x - mouse.px, h.y - mouse.py);
    if (d < h.r && d < bd) { bd = d; best = h; }
  }
  return best;
}

function spawnHearts(x, y) {
  for (let i = 0; i < 6; i++) {
    hearts.push({ x: x + (Math.random() - 0.5) * 50, y: y - 60 - Math.random() * 30,
      vy: -0.5 - Math.random() * 0.6, ph: Math.random() * 7, a: 1, s: 7 + Math.random() * 7 });
  }
}

function speak(x, y, text) {
  bubbles.push({ x, y, text, born: nowT });
}

// Every resident reacts in their own way.
function trigger(h) {
  if (h.act === "pet") {
    spawnHearts(h.x, h.y);
    if (h.id === "sleeper") {
      // the boiler cat IS the purr — deep rumble, gentle vibration
      fx.pets.set(h.id, nowT + 2600);
      speak(h.x, h.y - 50, "purrrrrr…");
      sfx.purr();
    } else if (h.id === "kitten") {
      // delighted mew, then zoomies after the runaway gear
      fx.pets.set(h.id, nowT + 1600);
      fx.zoomie = nowT + 3200;
      speak(h.x, h.y - 90, "mew!");
      sfx.mew();
    } else if (h.id === "ladder") {
      // so pleased the wrench gets dropped
      fx.pets.set(h.id, nowT + 1900);
      sfx.clank();
      for (let i = 0; i < 5; i++) {
        sparks.push({ x: h.x + 30, y: h.y + 60, vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.5, a: 1, col: "230,200,120" });
      }
    } else if (h.id === "operator") {
      // purrs in morse, naturally
      fx.pets.set(h.id, nowT + 1900);
      fx.telegraph = Math.max(fx.telegraph, nowT + 1200);
      speak(h.x, h.y - 130, "·· prr ··");
      sfx.morse([0, 0, 1, 0, 0], 640);
    }
  } else if (h.act === "woof") {
    fx.woof = nowT + 1900;
    speak(330, FLOOR - 170, "WOOF!");
    sfx.woof();
    for (let i = 0; i < 12; i++) {
      sparks.push({ x: 160 + Math.random() * 60, y: 800, vx: (Math.random() - 0.5) * 1.6,
        vy: -1.5 - Math.random() * 2.5, a: 1, col: "255,155,60" });
    }
  } else if (h.act === "airdrop") {
    const ax = airshipX(nowT);
    speak(ax + 20, AIRSHIP_Y - 60, "yip!");
    sfx.yip();
    if (parcels.length < 3) {
      parcels.push({ x: ax + 6, y: AIRSHIP_Y + 90, vy: 0.3, ph: Math.random() * 7,
        landedAt: 0 });
    }
  } else if (h.act === "whistle") {
    fx.whistle = nowT + 2400;
    speak(WHISTLE.x - 30, WHISTLE.y - 120, "TOOOOT!");
    sfx.toot();
  } else if (h.act === "telegraph") {
    fx.telegraph = nowT + 3200;
    speak(1068, 640, "· · — ·");
    sfx.morse([0, 0, 1, 0]);
    for (let i = 0; i < 10; i++) {
      scraps.push({ x: 1110, y: 740, vx: 1 + Math.random() * 2.5,
        vy: -2 - Math.random() * 2, rot: Math.random() * 7, a: 1 });
    }
  } else if (h.act === "surge") {
    fx.surge = nowT + 2300;
    sfx.zap();
    for (let i = 0; i < 14; i++) {
      sparks.push({ x: h.x, y: h.y, vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.7) * 4, a: 1, col: "120,236,220" });
    }
  }
}

addEventListener("pointerdown", () => {
  const h = hitSpot();
  if (h) { trigger(h); return; }
  // otherwise vent steam from the nearest boiler valve
  const valves = boilerXs.map((x) => ({ x: x + 75, y: 392 }));
  let best = valves[0], bd = 1e9;
  for (const v of valves) {
    const d = Math.hypot(v.x - mouse.px, v.y - mouse.py);
    if (d < bd) { bd = d; best = v; }
  }
  if (bd < 320) for (let i = 0; i < 16; i++) {
    steamBursts.push({ x: best.x, y: best.y, vx: (Math.random() - 0.5) * 2.4,
      vy: -2 - Math.random() * 2.5, r: 6 + Math.random() * 8, a: 0.45 });
  }
});

// ---- scene constants ---------------------------------------------------
const FLOOR = 930;
const boilerXs = [1400, 1580, 1760];
const rand = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const r1 = rand(77);
const motes = Array.from({ length: 36 }, () => ({
  x: r1() * W, y: r1() * H, v: 0.08 + r1() * 0.22, ph: r1() * 7, r: 1 + r1() * 1.8,
}));
const embers = Array.from({ length: 14 }, () => ({
  x: 120 + r1() * 160, y: FLOOR - r1() * 60, v: 0.3 + r1() * 0.6, ph: r1() * 7,
}));
let plumes = Array.from({ length: 7 }, (_, i) => ({
  x: r1() * W, y: 250 + r1() * 500, r: 90 + r1() * 130, v: 0.12 + r1() * 0.2, ph: i,
}));
const runaway = { x: 760, dir: 1, min: 700, max: 1240 };

function look(cx, cy, petId) {
  const dx = mouse.px - cx, dy = mouse.py - cy;
  const d = Math.hypot(dx, dy) || 1;
  const m = Math.min(3.2, d * 0.02);
  return {
    x: (dx / d) * m,
    y: (dy / d) * m,
    happy: petId ? (fx.pets.get(petId) ?? 0) > nowT : false,
    startle: fx.whistle > nowT,
  };
}

function layer(fx, fy, fn) {
  ctx.save();
  ctx.translate(par.x * fx, par.y * fy);
  fn();
  ctx.restore();
}

// ---- layers ------------------------------------------------------------
function wall(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.wallTop);
  g.addColorStop(1, pal.wallBottom);
  ctx.fillStyle = g;
  ctx.fillRect(-80, -60, W + 160, H + 120);
  ctx.strokeStyle = pal.plate;
  ctx.lineWidth = 3;
  for (let x = 0; x < W + 100; x += 240) {
    ctx.beginPath(); ctx.moveTo(x, -60); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let x = 120; x < W + 100; x += 240)
    for (let y = 140; y < FLOOR; y += 260) S.rivet(ctx, x, y, 5);
  // giant silhouette gears
  S.gear(ctx, 1500, 240, 380, 22, t * 0.00006, pal.ironGear, pal.ironGearDark, pal.wallTop);
  S.gear(ctx, 60, 660, 320, 18, -t * 0.00009, pal.ironGear, pal.ironGearDark, pal.wallTop);
  S.gear(ctx, 900, -40, 230, 14, t * 0.00012, pal.ironGear, pal.ironGearDark, pal.wallTop);
  // warm haze
  ctx.fillStyle = pal.haze;
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.4, W * 0.55, H * 0.45, 0, 0, 7);
  ctx.fill();
}

function lamps(t) {
  for (const lx of [330, 960, 1590]) {
    ctx.strokeStyle = "#3c3328";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 64); ctx.stroke();
    ctx.fillStyle = pal.brassDark;
    ctx.beginPath(); ctx.moveTo(lx - 30, 104); ctx.lineTo(lx + 30, 104); ctx.lineTo(lx + 17, 66); ctx.lineTo(lx - 17, 66); ctx.closePath(); ctx.fill();
    const flick = 0.9 + 0.1 * Math.sin(t * 0.013 + lx);
    ctx.fillStyle = "#ffd9a0";
    ctx.globalAlpha = flick;
    ctx.beginPath(); ctx.arc(lx, 108, 9, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.lampGlow;
    ctx.beginPath(); ctx.moveTo(lx - 30, 104); ctx.lineTo(lx + 30, 104); ctx.lineTo(lx + 130, FLOOR); ctx.lineTo(lx - 130, FLOOR); ctx.closePath(); ctx.fill();
  }
}

function machines(t) {
  // floor
  ctx.fillStyle = pal.floor;
  ctx.fillRect(-80, FLOOR, W + 160, H - FLOOR + 60);
  ctx.strokeStyle = pal.floorLine;
  ctx.lineWidth = 3;
  for (let y = FLOOR + 26; y < H + 40; y += 34) {
    ctx.beginPath(); ctx.moveTo(-80, y); ctx.lineTo(W + 80, y); ctx.stroke();
  }
  for (const lx of [330, 960, 1590]) {
    softGlow(lx, FLOOR + 40, 210, 30, pal.poolRGB, pal.poolA);
  }

  // aether conduits across the wall (surge brightens and speeds the pulses)
  const tubePal = fx.surge > nowT
    ? { ...pal, aetherGlow: 34, aetherDim: pal.aether, aetherBright: "#eafffb" }
    : pal;
  S.aetherTube(ctx, [[430, 560], [430, 300], [900, 300], [900, 180], [1400, 180], [1490, 330]], pulsePhase, tubePal, 4);
  S.aetherTube(ctx, [[520, 640], [820, 640], [820, 760]], pulsePhase, tubePal, 2);

  // furnace (left)
  ctx.fillStyle = pal.copperDark;
  ctx.fillRect(60, 560, 240, FLOOR - 560);
  ctx.fillStyle = pal.copper;
  ctx.fillRect(74, 574, 212, FLOOR - 588);
  const fireA = 0.75 + 0.25 * Math.sin(t * 0.02) * Math.sin(t * 0.007)
    + (fx.woof > nowT ? 0.3 : 0);
  ctx.fillStyle = pal.fireGlow;
  ctx.globalAlpha = fireA;
  ctx.fillRect(96, 660, 168, 200);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#1c0d04";
  ctx.fillRect(104, 668, 152, 184);
  softGlow(180, 800, 130, 110, "255,130,40", 0.32 * fireA);
  ctx.fillStyle = `rgba(255,${110 + Math.sin(t * 0.01) * 40},30,0.95)`;
  for (let i = 0; i < 5; i++) {
    const fx = 112 + i * 30, fh = 58 + Math.sin(t * 0.012 + i * 2) * 26;
    ctx.beginPath();
    ctx.moveTo(fx, 850);
    ctx.quadraticCurveTo(fx + 11, 850 - fh, fx + 22, 850);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = `rgba(255,220,120,${0.8 * fireA})`;
  for (let i = 0; i < 4; i++) {
    const fx = 130 + i * 30, fh = 30 + Math.sin(t * 0.014 + i * 2.4) * 14;
    ctx.beginPath();
    ctx.moveTo(fx, 850);
    ctx.quadraticCurveTo(fx + 7, 850 - fh, fx + 14, 850);
    ctx.closePath(); ctx.fill();
  }
  S.plaque(ctx, 180, 524, 150, 34, "FIREBOX No.1", 14, pal);
  // coal pile
  ctx.fillStyle = "#15110e";
  ctx.beginPath(); ctx.ellipse(360, FLOOR + 6, 70, 26, 0, Math.PI, 0); ctx.fill();

  // mainspring machine (center-left); gearPhase accumulates so the surge
  // overspeed accelerates smoothly instead of teleporting the teeth
  ctx.fillStyle = pal.copperDark;
  ctx.fillRect(470, 500, 60, FLOOR - 500);
  S.gear(ctx, 500, 700, 130, 16, gearPhase * (0.4 + data.streakDays / 30), pal.brass, pal.brassDark, pal.wallBottom);
  S.gear(ctx, 640, 800, 64, 10, -gearPhase * (0.4 + data.streakDays / 30) * (130 / 64), pal.copper, pal.copperDark, pal.wallBottom);
  S.gauge(ctx, 500, 430, 96, Math.min(1, data.streakDays / 30), "MAINSPRING", Math.sin(t * 0.004) * 0.012, pal);
  S.plaque(ctx, 500, 540, 220, 34, `${data.streakDays} days under steam`, 15, pal);

  // telegraph desk (center)
  ctx.fillStyle = pal.copperDark;
  ctx.fillRect(850, 770, 330, 24);
  ctx.fillStyle = pal.copper;
  ctx.fillRect(866, 794, 24, FLOOR - 794);
  ctx.fillRect(1140, 794, 24, FLOOR - 794);
  ctx.fillStyle = pal.brassDark;
  ctx.fillRect(1020, 716, 96, 54);
  ctx.fillStyle = pal.brass;
  ctx.fillRect(1028, 724, 80, 38);
  S.gear(ctx, 1068, 700, 26, 8, gearPhase * 3.6, pal.brassLight, pal.brassDark, pal.brass);
  S.plaque(ctx, 1010, 880, 250, 34, "COMMIT TELEGRAPH", 15, pal);

  // steam whistle on the wall by the boiler bank
  const yank = fx.whistle > nowT ? Math.min(1, (fx.whistle - nowT) / 600) : 0;
  ctx.save();
  ctx.translate(WHISTLE.x, WHISTLE.y);
  S.steamWhistle(ctx, t, yank, pal);
  ctx.restore();

  // boiler bank (right) on platform
  ctx.fillStyle = pal.copperDark;
  ctx.fillRect(1340, FLOOR - 26, 540, 26);
  const names = data.boilers;
  boilerXs.forEach((bx, i) => {
    const b = names[i] ?? { name: "—", pressure: 0.1 };
    S.boiler(ctx, bx, 460, 150, FLOOR - 26 - 460, b.name, b.pressure, t, pal);
  });
  // rolling ladder against the bank
  ctx.strokeStyle = "#5a4632";
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(1310, FLOOR); ctx.lineTo(1392, 470); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1364, FLOOR); ctx.lineTo(1446, 470); ctx.stroke();
  ctx.lineWidth = 6;
  for (let i = 1; i <= 7; i++) {
    const f = i / 8;
    ctx.beginPath();
    ctx.moveTo(1310 + 82 * f, FLOOR - (FLOOR - 470) * f);
    ctx.lineTo(1364 + 82 * f, FLOOR - (FLOOR - 470) * f);
    ctx.stroke();
  }
}

function cast(t) {
  // ladder engineer (ginger) — top of ladder, wrench arm
  ctx.save();
  ctx.translate(1432, 560);
  ctx.scale(0.92, 0.92);
  S.catSit(ctx, "#e8954f", "#f5d9b8", t, 0.2, look(1432, 500, "ladder"), pal);
  const wa = Math.sin(t * 0.006) * 0.35;
  ctx.save();
  ctx.translate(20, -46);
  ctx.rotate(wa);
  ctx.strokeStyle = "#e8954f";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(30, -16); ctx.stroke();
  ctx.fillStyle = "#9aa1ad";
  ctx.fillRect(26, -34, 9, 26);
  ctx.beginPath(); ctx.arc(30, -36, 8, 0.6, 5.7); ctx.fill();
  ctx.restore();
  ctx.restore();

  // sleeping cat on middle boiler dome (vibrates while purring)
  const purring = (fx.pets.get("sleeper") ?? 0) > nowT;
  ctx.save();
  ctx.translate(
    boilerXs[1] + 75 + (purring ? Math.sin(t * 0.15) * 1.4 : 0),
    392 + (purring ? Math.sin(t * 0.11) * 0.8 : 0),
  );
  S.catCurl(ctx, "#3a3a41", "#26262c", t, 1.4);
  ctx.restore();

  // telegraph operator (grey) on desk stool
  ctx.save();
  ctx.translate(940, 770);
  S.catOperator(ctx, "#9a9aa8", "#c8c8d4", t, 0.6, look(940, 700, "operator"), pal,
    fx.telegraph > nowT ? 4 : 1);
  ctx.restore();

  // stoker bulldog at the furnace (hops when boop'd)
  const hop = fx.woof > nowT ? Math.abs(Math.sin(t * 0.02)) * 16 : 0;
  ctx.save();
  ctx.translate(330, FLOOR - hop);
  ctx.scale(-1.05, 1.05);
  S.dogStoker(ctx, t, pal);
  ctx.restore();

  // runaway gear + chasing kitten (zoomies when freshly petted)
  runaway.x += runaway.dir * (fx.zoomie > nowT ? 3.6 : 1.5);
  if (runaway.x > runaway.max || runaway.x < runaway.min) runaway.dir *= -1;
  S.gear(ctx, runaway.x, FLOOR - 26, 26, 8, runaway.x * 0.05, pal.brassLight, pal.brassDark, pal.floor);
  ctx.save();
  const kx = runaway.x - runaway.dir * 92;
  ctx.translate(kx, FLOOR);
  S.catRun(ctx, "#f0ece2", "#e8954f", t, runaway.dir, look(kx, FLOOR - 30, "kitten"), pal);
  ctx.restore();

  // startle marks while the whistle is screaming
  if (fx.whistle > nowT) {
    ctx.fillStyle = "#ffd24a";
    ctx.font = "700 38px Georgia, serif";
    ctx.textAlign = "center";
    const jitter = Math.sin(t * 0.05) * 2;
    for (const [ex, ey] of [[1432, 428], [950, 660], [kx, FLOOR - 120], [boilerXs[1] + 40, 330]]) {
      ctx.fillText("!", ex + jitter, ey);
    }
  }

  // airship crossing the rafters (~45s per crossing, on screen at load)
  const ax = ((t * 0.055 + 900) % (W + 760)) - 380;
  ctx.save();
  ctx.translate(ax, 150);
  S.airship(ctx, t, `${data.openPrs} PR${data.openPrs === 1 ? "" : "S"} INBOUND`, pal);
  ctx.restore();
}

function effects(t) {
  // parachute parcels from the airship: drift down, land, pop into paper
  parcels = parcels.filter((p) => !p.landedAt || nowT - p.landedAt < 1400);
  for (const p of parcels) {
    if (!p.landedAt) {
      p.vy = Math.min(1.5, p.vy + 0.02);
      p.y += p.vy;
      p.x += Math.sin(t * 0.002 + p.ph) * 0.8;
      if (p.y >= FLOOR - 14) {
        p.landedAt = nowT;
        sfx.clank();
        for (let i = 0; i < 8; i++) {
          scraps.push({ x: p.x, y: p.y - 8, vx: (Math.random() - 0.5) * 3.4,
            vy: -1.5 - Math.random() * 2.4, rot: Math.random() * 7, a: 1 });
        }
      }
    }
    const fade = p.landedAt ? Math.max(0, 1 - (nowT - p.landedAt) / 1400) : 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = fade;
    if (!p.landedAt) {
      const sway = Math.sin(t * 0.002 + p.ph) * 0.12;
      ctx.rotate(sway);
      ctx.fillStyle = "#e8d9b8";
      ctx.beginPath();
      ctx.arc(0, -52, 26, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,100,70,0.9)";
      ctx.lineWidth = 1.6;
      for (const cx2 of [-24, -8, 8, 24]) {
        ctx.beginPath();
        ctx.moveTo(cx2, -50);
        ctx.lineTo(cx2 * 0.3, -14);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#8a5f3c";
    ctx.fillRect(-14, -14, 28, 24);
    ctx.strokeStyle = "#5a4632";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-14, -14, 28, 24);
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(0, 10);
    ctx.moveTo(-14, -2); ctx.lineTo(14, -2);
    ctx.stroke();
    ctx.fillStyle = "#f0e6cb";
    ctx.font = "700 10px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("PR", 0, -4.5);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  hearts = hearts.filter((h) => h.a > 0.02);
  for (const h of hearts) {
    h.y += h.vy; h.a *= 0.985;
    ctx.save();
    ctx.translate(h.x + Math.sin(h.y * 0.06 + h.ph) * 8, h.y);
    ctx.scale(h.s / 10, h.s / 10);
    ctx.globalAlpha = h.a;
    ctx.fillStyle = "#ed7ba0";
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-8, -5, -3, -10, 0, -5);
    ctx.bezierCurveTo(3, -10, 8, -5, 0, 3);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  scraps = scraps.filter((s) => s.a > 0.02);
  for (const s of scraps) {
    s.x += s.vx; s.y += s.vy; s.vy += 0.09; s.rot += 0.1; s.a *= 0.978;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalAlpha = s.a;
    ctx.fillStyle = "#f0e6cb";
    ctx.fillRect(-7, -4, 14, 8);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  sparks = sparks.filter((s) => s.a > 0.03);
  for (const s of sparks) {
    s.x += s.vx; s.y += s.vy; s.vy += 0.05; s.a *= 0.95;
    softGlow(s.x, s.y, 7, 7, s.col, s.a);
    ctx.fillStyle = `rgba(${s.col},${s.a})`;
    ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
  }
  bubbles = bubbles.filter((b) => nowT - b.born < 1700);
  for (const b of bubbles) {
    const age = nowT - b.born;
    const pop = Math.min(1, age / 140);
    const fade = age > 1300 ? 1 - (age - 1300) / 400 : 1;
    ctx.save();
    ctx.translate(b.x, b.y - pop * 8);
    ctx.scale(pop, pop);
    ctx.globalAlpha = fade;
    ctx.font = "700 24px Georgia, serif";
    const w = ctx.measureText(b.text).width + 28;
    ctx.fillStyle = "#f5ead2";
    ctx.strokeStyle = "#6b5226";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -42, w, 42, 9);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(10, 14); ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = S.LINE;
    ctx.textAlign = "center";
    ctx.fillText(b.text, 0, -12);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function atmosphere(t) {
  // drifting steam plumes
  for (const p of plumes) {
    p.x += p.v;
    if (p.x - p.r > W) p.x = -p.r;
    const wob = Math.sin(t * 0.0005 + p.ph) * 30;
    softGlow(p.x, p.y + wob, p.r, p.r * 0.55, pal.steamRGB, pal.steamA);
  }
  // boiler valve steam + click bursts; the whistle makes every valve scream
  const screaming = fx.whistle > nowT;
  for (const bx of boilerXs) {
    if (screaming || Math.sin(t * 0.001 + bx) > 0.55) {
      const f = (t * (screaming ? 0.22 : 0.06) + bx) % 60;
      softGlow(bx + 75, 380 - f, 14 + f * 0.5, 14 + f * 0.5, pal.steamRGB, screaming ? 0.8 : 0.5);
    }
  }
  if (screaming) {
    const f = (t * 0.3) % 80;
    softGlow(WHISTLE.x - 4, WHISTLE.y - 96 - f, 16 + f * 0.5, 16 + f * 0.5, pal.steamRGB, 0.85);
  }
  steamBursts = steamBursts.filter((s) => s.a > 0.01);
  for (const s of steamBursts) {
    s.x += s.vx; s.y += s.vy; s.vy *= 0.985; s.r += 0.5; s.a *= 0.96;
    softGlow(s.x, s.y, s.r, s.r, "220,216,228", s.a);
  }
  // embers above the furnace
  for (const e of embers) {
    e.y -= e.v;
    if (e.y < 420) e.y = FLOOR - 20;
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.004 + e.ph));
    ctx.fillStyle = pal.ember;
    ctx.fillRect(e.x + Math.sin(e.y * 0.04 + e.ph) * 14, e.y, 3, 3);
  }
  ctx.globalAlpha = 1;
  // dust motes
  ctx.fillStyle = "rgba(255,225,170,0.5)";
  for (const m of motes) {
    m.y += m.v;
    if (m.y > H) m.y = -4;
    ctx.globalAlpha = 0.12 + 0.3 * Math.abs(Math.sin(t * 0.001 + m.ph));
    ctx.beginPath();
    ctx.arc(m.x + Math.sin(m.y * 0.01 + m.ph) * 24, m.y, m.r, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function foreground(t) {
  S.gear(ctx, 1820, H + 30, 250, 16, t * 0.00035, pal.ironGear, pal.ironGearDark, pal.wallBottom);
  S.gear(ctx, -40, H - 10, 190, 12, -t * 0.0005, pal.ironGear, pal.ironGearDark, pal.wallBottom);
}

function ticker(t) {
  const text = data.ticker.join("   ···   ") + "   ···   ";
  ctx.font = "500 19px ui-monospace, Menlo, monospace";
  const tw = ctx.measureText(text).width;
  const off = tickerPos % tw;
  ctx.fillStyle = "rgba(240,230,205,0.92)";
  ctx.fillRect(0, H - 44, W, 44);
  ctx.fillStyle = "#beb39a";
  for (let x = 14; x < W; x += 30) {
    ctx.fillRect(x, H - 38, 4, 4);
    ctx.fillRect(x, H - 10, 4, 4);
  }
  ctx.fillStyle = S.LINE;
  ctx.textAlign = "left";
  ctx.fillText(text, -off, H - 17);
  ctx.fillText(text, -off + tw, H - 17);
  ctx.fillStyle = pal.brassDark;
  ctx.fillRect(0, H - 48, W, 6);
}

// ---- main loop -----------------------------------------------------------
function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  const scale = Math.max(innerWidth / W, innerHeight / H);
  view = {
    scale,
    ox: (innerWidth - W * scale) / 2,
    oy: (innerHeight - H * scale) / 2,
  };
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * view.ox, dpr * view.oy);
}
addEventListener("resize", resize);
resize();

let gearPhase = 0, pulsePhase = 0, tickerPos = 0, lastT = 0;

function frame(t) {
  nowT = t;
  const dt = Math.min(100, t - lastT);
  lastT = t;
  const surging = fx.surge > nowT;
  gearPhase += dt * 0.0011 * (surging ? 3 : 1);
  pulsePhase += dt * (surging ? 4 : 1);
  tickerPos += dt * 0.07 * (fx.telegraph > nowT ? 3.2 : 1);
  const idleX = Math.sin(t * 0.00015) * 0.3;
  par.x += ((mouse.x - 0.5) * 2 + idleX - par.x) * 0.04;
  par.y += ((mouse.y - 0.5) * 2 - par.y) * 0.04;
  ctx.clearRect(-200, -200, W + 400, H + 400);
  layer(-10, -6, () => wall(t));
  layer(-18, -10, () => lamps(t));
  layer(-26, -14, () => { machines(t); cast(t); effects(t); });
  layer(-40, -22, () => atmosphere(t));
  layer(-60, -34, () => foreground(t));
  ticker(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// hidden hook for visual testing: /#fxtest fires every interaction at once
if (location.hash === "#fxtest") {
  setTimeout(() => {
    for (const h of hotspots()) trigger(h);
  }, 1400);
}
