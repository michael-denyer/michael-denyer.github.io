import * as S from "./sprites.js";
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
});
const par = { x: 0, y: 0 };

let steamBursts = [];
addEventListener("pointerdown", () => {
  // vent steam from the nearest boiler valve
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

function look(cx, cy) {
  const dx = mouse.px - cx, dy = mouse.py - cy;
  const d = Math.hypot(dx, dy) || 1;
  const m = Math.min(3.2, d * 0.02);
  return { x: (dx / d) * m, y: (dy / d) * m };
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

  // aether conduits across the wall
  S.aetherTube(ctx, [[430, 560], [430, 300], [900, 300], [900, 180], [1400, 180], [1490, 330]], t, pal, 4);
  S.aetherTube(ctx, [[520, 640], [820, 640], [820, 760]], t, pal, 2);

  // furnace (left)
  ctx.fillStyle = pal.copperDark;
  ctx.fillRect(60, 560, 240, FLOOR - 560);
  ctx.fillStyle = pal.copper;
  ctx.fillRect(74, 574, 212, FLOOR - 588);
  const fireA = 0.75 + 0.25 * Math.sin(t * 0.02) * Math.sin(t * 0.007);
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

  // mainspring machine (center-left)
  ctx.fillStyle = pal.copperDark;
  ctx.fillRect(470, 500, 60, FLOOR - 500);
  S.gear(ctx, 500, 700, 130, 16, t * 0.0011 * (0.4 + data.streakDays / 30), pal.brass, pal.brassDark, pal.wallBottom);
  S.gear(ctx, 640, 800, 64, 10, -t * 0.0011 * (0.4 + data.streakDays / 30) * (130 / 64), pal.copper, pal.copperDark, pal.wallBottom);
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
  S.gear(ctx, 1068, 700, 26, 8, t * 0.004, pal.brassLight, pal.brassDark, pal.brass);
  S.plaque(ctx, 1010, 880, 250, 34, "COMMIT TELEGRAPH", 15, pal);

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
  S.catSit(ctx, "#e8954f", "#f5d9b8", t, 0.2, look(1432, 500), pal);
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

  // sleeping cat on middle boiler dome
  ctx.save();
  ctx.translate(boilerXs[1] + 75, 392);
  S.catCurl(ctx, "#3a3a41", "#26262c", t, 1.4);
  ctx.restore();

  // telegraph operator (grey) on desk stool
  ctx.save();
  ctx.translate(940, 770);
  S.catOperator(ctx, "#9a9aa8", "#c8c8d4", t, 0.6, look(940, 700), pal);
  ctx.restore();

  // stoker bulldog at the furnace
  ctx.save();
  ctx.translate(330, FLOOR);
  ctx.scale(-1.05, 1.05);
  S.dogStoker(ctx, t, pal);
  ctx.restore();

  // runaway gear + chasing kitten
  runaway.x += runaway.dir * 1.5;
  if (runaway.x > runaway.max || runaway.x < runaway.min) runaway.dir *= -1;
  S.gear(ctx, runaway.x, FLOOR - 26, 26, 8, runaway.x * 0.05, pal.brassLight, pal.brassDark, pal.floor);
  ctx.save();
  const kx = runaway.x - runaway.dir * 92;
  ctx.translate(kx, FLOOR);
  S.catRun(ctx, "#f0ece2", "#e8954f", t, runaway.dir, look(kx, FLOOR - 30), pal);
  ctx.restore();

  // airship crossing the rafters (~45s per crossing, on screen at load)
  const ax = ((t * 0.055 + 900) % (W + 760)) - 380;
  ctx.save();
  ctx.translate(ax, 150);
  S.airship(ctx, t, `${data.openPrs} PR${data.openPrs === 1 ? "" : "S"} INBOUND`, pal);
  ctx.restore();
}

function atmosphere(t) {
  // drifting steam plumes
  for (const p of plumes) {
    p.x += p.v;
    if (p.x - p.r > W) p.x = -p.r;
    const wob = Math.sin(t * 0.0005 + p.ph) * 30;
    softGlow(p.x, p.y + wob, p.r, p.r * 0.55, pal.steamRGB, pal.steamA);
  }
  // boiler valve steam + click bursts
  for (const bx of boilerXs) {
    if (Math.sin(t * 0.001 + bx) > 0.55) {
      const f = (t * 0.06 + bx) % 60;
      softGlow(bx + 75, 380 - f, 14 + f * 0.5, 14 + f * 0.5, pal.steamRGB, 0.5);
    }
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
  const off = (t * 0.07) % tw;
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
  view.scale *= 1; // logical px mapping for pointer math
  view.ox *= 1;
}
addEventListener("resize", resize);
resize();

function frame(t) {
  const idleX = Math.sin(t * 0.00015) * 0.3;
  par.x += ((mouse.x - 0.5) * 2 + idleX - par.x) * 0.04;
  par.y += ((mouse.y - 0.5) * 2 - par.y) * 0.04;
  ctx.clearRect(-200, -200, W + 400, H + 400);
  layer(-10, -6, () => wall(t));
  layer(-18, -10, () => lamps(t));
  layer(-26, -14, () => { machines(t); cast(t); });
  layer(-40, -22, () => atmosphere(t));
  layer(-60, -34, () => foreground(t));
  ticker(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
