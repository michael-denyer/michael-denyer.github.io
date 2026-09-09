// Canvas draw functions for the Aether Works scene.
// All sprites draw at a local origin; callers translate/scale the context.

export const LINE = "#241c14";

// Shared metal finish keeps the moving machinery in the same light.
export function metal(ctx, x, y, w, h, dark, mid, light) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, dark);
  g.addColorStop(0.22, mid);
  g.addColorStop(0.38, light);
  g.addColorStop(0.5, mid);
  g.addColorStop(0.82, dark);
  g.addColorStop(1, mid);
  return g;
}

export function rivet(ctx, x, y, r = 4) {
  ctx.fillStyle = "#21170f";
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, r + 1, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#897044";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#e4c78a";
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "#43331e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.48, y + r * 0.48);
  ctx.lineTo(x + r * 0.48, y - r * 0.48);
  ctx.stroke();
}

export function gear(ctx, x, y, r, teeth, ang, col, dark, holeColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = dark;
  const tw = Math.max(6, r * 0.16);
  for (let i = 0; i < teeth; i++) {
    ctx.save();
    ctx.rotate((i / teeth) * Math.PI * 2);
    ctx.fillRect(r - 4, -tw / 2, tw * 0.9 + 8, tw);
    ctx.restore();
  }
  const finish = metal(ctx, -r, -r, r * 2, r * 2, dark, col, col);
  ctx.fillStyle = finish;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 7);
  ctx.fill();
  ctx.fillStyle = holeColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,225,166,0.28)";
  ctx.lineWidth = Math.max(1, r * 0.012);
  for (const radius of [0.68, 0.94]) {
    ctx.beginPath();
    ctx.arc(0, 0, r * radius, 0, 7);
    ctx.stroke();
  }
  ctx.fillStyle = finish;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2);
    ctx.fillRect(-r * 0.07, 0, r * 0.14, r * 0.65);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, 7);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, 7);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    rivet(ctx, Math.sin(a) * r * 0.79, Math.cos(a) * r * 0.79, Math.max(2, r * 0.022));
  }
  ctx.restore();
}

export function gauge(ctx, x, y, r, val, label, wob, pal) {
  ctx.save();
  ctx.fillStyle = "#17120e";
  ctx.beginPath();
  ctx.arc(x + 2, y + 5, r * 1.17, 0, 7);
  ctx.fill();
  ctx.fillStyle = metal(ctx, x - r, y - r, r * 2, r * 2, pal.brassDark, pal.brass, pal.brassLight);
  ctx.beginPath();
  ctx.arc(x, y, r + r * 0.12, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#34271c";
  ctx.beginPath();
  ctx.arc(x, y, r + r * 0.06, 0, 7);
  ctx.fill();
  const face = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
  face.addColorStop(0, "#fff1cf");
  face.addColorStop(0.75, pal.gaugeFace);
  face.addColorStop(1, "#b29b6b");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 7);
  ctx.fill();
  const a0 = 2.36, sweep = 4.71;
  ctx.strokeStyle = "#a32d2d";
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, a0 + sweep * 0.82, a0 + sweep);
  ctx.stroke();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = Math.max(1.2, r * 0.022);
  for (let i = 0; i <= 40; i++) {
    const a = a0 + (sweep * i) / 40;
    const inner = i % 4 === 0 ? 0.72 : 0.81;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * inner, y + Math.sin(a) * r * inner);
    ctx.lineTo(x + Math.cos(a) * r * 0.87, y + Math.sin(a) * r * 0.87);
    ctx.stroke();
  }
  ctx.fillStyle = LINE;
  ctx.font = `${Math.round(r * 0.16)}px Georgia, serif`;
  ctx.textAlign = "center";
  for (let i = 0; i <= 5; i++) {
    if (label && (i === 0 || i === 5)) continue;
    const a = a0 + sweep * i / 5;
    ctx.fillText(String(i * 20), x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58 + r * 0.05);
  }
  const na = a0 + sweep * Math.max(0, Math.min(1, val)) + wob;
  ctx.strokeStyle = "#8a2222";
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(na) * r * 0.16, y - Math.sin(na) * r * 0.16);
  ctx.lineTo(x + Math.cos(na) * r * 0.7, y + Math.sin(na) * r * 0.7);
  ctx.stroke();
  ctx.fillStyle = pal.brassDark;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.09, 0, 7);
  ctx.fill();
  if (label) {
    ctx.fillStyle = LINE;
    ctx.font = `600 ${Math.round(r * 0.16)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + r * 0.44);
  }
  ctx.strokeStyle = "rgba(255,255,240,0.55)";
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.94, Math.PI * 1.13, Math.PI * 1.82);
  ctx.stroke();
  ctx.restore();
}

export function plaque(ctx, x, y, w, h, text, size, pal) {
  ctx.fillStyle = pal.brassDark;
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = metal(ctx, x - w / 2, y, w, h, pal.brassDark, pal.brass, pal.brassLight);
  ctx.fillRect(x - w / 2 + 4, y + 4, w - 8, h - 8);
  ctx.strokeStyle = "rgba(255,234,183,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 + 6, y + 6, w - 12, h - 12);
  ctx.fillStyle = LINE;
  ctx.font = `600 ${size}px Georgia, serif`;
  // engraving must fit between the rivets — shrink a little, stay readable,
  // and truncate whatever still doesn't fit
  const room = w - 34;
  const measured = ctx.measureText(text).width;
  if (measured > room) {
    size = Math.max(12, Math.floor((size * room) / measured));
    ctx.font = `600 ${size}px Georgia, serif`;
    // middle-ellipsis so near-identical names stay distinguishable
    const original = text;
    let keep = original.length;
    while (ctx.measureText(text).width > room && keep > 5) {
      keep -= 1;
      const head = Math.ceil(keep * 0.6);
      text = original.slice(0, head) + "…" + original.slice(original.length - (keep - head));
    }
  }
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + h / 2 + size * 0.36);
  rivet(ctx, x - w / 2 + 11, y + h / 2, 3.5);
  rivet(ctx, x + w / 2 - 11, y + h / 2, 3.5);
}

export function boiler(ctx, x, y, w, h, name, pressure, t, pal) {
  // x,y = top-left of the cylinder body
  const shell = metal(ctx, x, y, w, 0, pal.copperDark, pal.copper, pal.copperLight);
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.arc(x + w / 2, y, w / 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = shell;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(248,205,142,0.15)";
  ctx.lineWidth = 1;
  for (let sy = y + 8; sy < y + h; sy += 7) {
    ctx.beginPath(); ctx.moveTo(x + 5, sy); ctx.lineTo(x + w - 5, sy); ctx.stroke();
  }
  for (let by = y + 56; by < y + h; by += 88) {
    ctx.fillStyle = metal(ctx, x, by, w, 0, pal.brassDark, pal.brass, pal.brassLight);
    ctx.fillRect(x - 3, by, w + 6, 12);
    rivet(ctx, x + 13, by + 5);
    rivet(ctx, x + w / 2, by + 5);
    rivet(ctx, x + w - 13, by + 5);
  }
  // relief valve
  ctx.fillStyle = pal.brassDark;
  ctx.fillRect(x + w / 2 - 9, y - w / 2 - 28, 18, 30);
  ctx.fillStyle = pal.brass;
  ctx.fillRect(x + w / 2 - 13, y - w / 2 - 34, 26, 8);
  gauge(ctx, x + w / 2, y + 120, w * 0.27, pressure, "", Math.sin(t * 0.005 + x) * 0.04 * (0.3 + pressure), pal);
  plaque(ctx, x + w / 2, y + 190, w + 14, 34, name.toUpperCase(), 15, pal);
  // Backlit water level, inspection hatch and bolted mounting feet.
  const levelY = y + 256;
  ctx.fillStyle = "#231c16";
  ctx.fillRect(x + 24, levelY, 22, 112);
  ctx.fillStyle = pal.aetherDim;
  ctx.fillRect(x + 29, levelY + 5, 12, 102);
  ctx.fillStyle = pal.aether;
  ctx.fillRect(x + 29, levelY + 102 - pressure * 90, 12, 5 + pressure * 90);
  ctx.fillStyle = "rgba(255,255,232,0.6)";
  ctx.fillRect(x + 31, levelY + 8, 2, 95);
  for (let mark = 0; mark < 6; mark++) {
    ctx.fillStyle = pal.brassLight;
    ctx.fillRect(x + 44, levelY + 10 + mark * 18, 8, 1);
  }
  for (const capY of [levelY - 4, levelY + 108]) {
    ctx.fillStyle = pal.brass;
    ctx.fillRect(x + 22, capY, 26, 8);
  }
  gear(ctx, x + w * 0.69, levelY + 55, 29, 8, 0.3, pal.brass, pal.brassDark, pal.copperDark);
  for (const footX of [x + 6, x + w - 32]) {
    ctx.fillStyle = pal.ironGearDark;
    ctx.fillRect(footX, y + h - 24, 26, 30);
    rivet(ctx, footX + 13, y + h - 9, 4);
  }
}

export function aetherTube(ctx, pts, t, pal, pulseCount = 3) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const path = new Path2D();
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = pal.tubeCasing;
  ctx.lineWidth = 14;
  ctx.stroke(path);
  ctx.strokeStyle = pal.aetherDim;
  ctx.lineWidth = 7;
  ctx.shadowColor = pal.aether;
  ctx.shadowBlur = pal.aetherGlow;
  ctx.stroke(path);
  ctx.shadowBlur = 0;
  // segment lengths for pulse travel
  let total = 0;
  const segs = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  for (let p = 0; p < pulseCount; p++) {
    let dist = ((t * 0.18 + (p * total) / pulseCount) % total);
    let i = 0;
    while (dist > segs[i]) { dist -= segs[i]; i++; }
    const f = dist / segs[i];
    const px = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
    const py = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
    ctx.fillStyle = pal.aetherBright;
    ctx.shadowColor = pal.aether;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  // junction collars
  for (let i = 1; i < pts.length - 1; i++) {
    ctx.fillStyle = pal.brassDark;
    ctx.fillRect(pts[i][0] - 9, pts[i][1] - 9, 18, 18);
    ctx.fillStyle = pal.brass;
    ctx.fillRect(pts[i][0] - 6, pts[i][1] - 6, 12, 12);
  }
  ctx.restore();
}

function goggles(ctx, cx, cy, r, headR) {
  ctx.strokeStyle = "#6b5226";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy + headR * 0.05, headR, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  for (const dx of [-r * 1.15, r * 1.15]) {
    ctx.fillStyle = "#caa64a";
    ctx.beginPath();
    ctx.arc(cx + dx, cy - headR * 0.62, r, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#bfe8e2";
    ctx.beginPath();
    ctx.arc(cx + dx, cy - headR * 0.62, r * 0.62, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(cx + dx - r * 0.2, cy - headR * 0.62 - r * 0.2, r * 0.2, 0, 7);
    ctx.fill();
  }
}

function ear(ctx, x, y, s, col, tilt) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s * tilt, y - s * 1.3);
  ctx.lineTo(x + s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d98a8a";
  ctx.beginPath();
  ctx.moveTo(x + s * 0.28, y - s * 0.1);
  ctx.lineTo(x + s * 0.5 * (1 + tilt * 0.6), y - s * 0.72);
  ctx.lineTo(x + s * 0.72, y - s * 0.1);
  ctx.closePath();
  ctx.fill();
}

// look = {x, y, happy?, startle?} — happy draws blissful closed arcs,
// startle widens the pupils; both override normal cursor tracking.
function catEyes(ctx, cx, cy, gap, r, look, glowAlpha, eyeCol) {
  if (look.happy) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    for (const dx of [-gap, gap]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + r * 0.6, r * 1.2, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    return;
  }
  const pr = look.startle ? r * 1.05 : r * 0.72;
  const lx = look.startle ? 0 : look.x;
  const ly = look.startle ? 0 : look.y;
  for (const dx of [-gap, gap]) {
    if (glowAlpha > 0) {
      ctx.fillStyle = eyeCol;
      ctx.globalAlpha = glowAlpha;
      ctx.beginPath();
      ctx.arc(cx + dx, cy, r + 2.5, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#e8f0d8";
    ctx.beginPath();
    ctx.arc(cx + dx, cy, r + (look.startle ? 2.2 : 1), 0, 7);
    ctx.fill();
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(cx + dx + lx, cy + ly, pr, 0, 7);
    ctx.fill();
  }
}

// Sitting engineer cat. look = {x,y} pupil offset (already clamped).
export function catSit(ctx, col, shade, t, ph, look, pal, withGoggles = true) {
  const sw = Math.sin(t * 0.0025 + ph);
  ctx.strokeStyle = col;
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(28, -8);
  ctx.quadraticCurveTo(62, -12, 54 + sw * 11, -52);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, -34, 32, 36, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(0, -20, 16, 14, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(-14, -3, 11, 7, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, -3, 11, 7, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -74, 23, 0, 7);
  ctx.fill();
  ear(ctx, -22, -89, 15, col, 0.35);
  ear(ctx, 6, -89, 15, col, 0.65);
  if (withGoggles) goggles(ctx, 0, -74, 7, 23);
  catEyes(ctx, 0, -76, 9.5, 3, look, pal.eyeGlow, "#8fe8c8");
  ctx.fillStyle = "#d98a8a";
  ctx.beginPath();
  ctx.arc(0, -67, 2.4, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(36,28,20,0.45)";
  ctx.lineWidth = 1.2;
  for (const d of [-1, 1]) for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(d * 13, -68 + i * 2.5);
    ctx.lineTo(d * 31, -66 + i * 6);
    ctx.stroke();
  }
}

// Curled sleeping cat (on warm boiler top)
export function catCurl(ctx, col, shade, t, ph) {
  const br = 1 + 0.05 * Math.sin(t * 0.0018 + ph);
  ctx.save();
  ctx.scale(1, br);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, -16, 40, 19, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = shade;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(34, -8);
  ctx.quadraticCurveTo(8, 6, -26, -4);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(-28, -24, 17, 0, 7);
  ctx.fill();
  ear(ctx, -42, -35, 11, col, 0.4);
  ear(ctx, -24, -37, 11, col, 0.6);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (const dx of [-34, -23]) {
    ctx.beginPath();
    ctx.moveTo(dx, -23);
    ctx.quadraticCurveTo(dx + 3, -20, dx + 6, -23);
    ctx.stroke();
  }
  ctx.restore();
}

// Running kitten (chasing the runaway gear), dir = 1 right, -1 left
export function catRun(ctx, col, patch, t, dir, look, pal) {
  ctx.save();
  ctx.scale(dir, 1);
  const run = Math.sin(t * 0.02);
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-24, -18);
  ctx.quadraticCurveTo(-42, -26, -38 - run * 5, -46);
  ctx.stroke();
  ctx.save();
  ctx.rotate(-0.07 * run);
  ctx.beginPath();
  ctx.ellipse(0, -18, 29, 17, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = patch;
  ctx.beginPath();
  ctx.ellipse(-6, -26, 11, 7, 0.3, 0, 7);
  ctx.fill();
  ctx.fillStyle = col;
  for (const [lx, o] of [[-10, 1], [16, -1], [-16, -1], [22, 1]]) {
    ctx.beginPath();
    ctx.ellipse(lx + o * run * 4, -2, 5.5, 9, o * 0.25, 0, 7);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(29, -26, 15, 0, 7);
  ctx.fill();
  ear(ctx, 17, -37, 11, col, 0.4);
  ear(ctx, 32, -38, 11, col, 0.6);
  catEyes(ctx, 31, -28, 5.5, 2.2,
    { x: look.x * dir, y: look.y, happy: look.happy, startle: look.startle },
    pal.eyeGlow, "#8fe8c8");
  ctx.fillStyle = "#d98a8a";
  ctx.beginPath();
  ctx.arc(40, -22, 2, 0, 7);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// Telegraph operator cat seated in profile, paw tapping
export function catOperator(ctx, col, shade, t, ph, look, pal, tapBoost = 1) {
  const tap = Math.max(0, Math.sin(t * 0.012 * tapBoost + ph)) * 8;
  const sw = Math.sin(t * 0.002 + ph);
  ctx.strokeStyle = col;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-26, -10);
  ctx.quadraticCurveTo(-52, -14, -46 + sw * 9, -48);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(0, -30, 28, 33, -0.12, 0, 7);
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(6, -18, 13, 12, 0, 0, 7);
  ctx.fill();
  // tapping front paw
  ctx.strokeStyle = col;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(14, -34);
  ctx.quadraticCurveTo(34, -28, 42, -12 - tap);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(43, -11 - tap, 6, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -66, 21, 0, 7);
  ctx.fill();
  ear(ctx, -10, -80, 14, col, 0.35);
  ear(ctx, 16, -81, 14, col, 0.65);
  goggles(ctx, 10, -66, 6.4, 21);
  catEyes(ctx, 12, -68, 8.5, 2.8, look, pal.eyeGlow, "#8fe8c8");
  ctx.fillStyle = "#d98a8a";
  ctx.beginPath();
  ctx.arc(13, -60, 2.2, 0, 7);
  ctx.fill();
}

// Wall-mounted steam whistle with a pull cord. Origin: bracket center.
// yank 0..1 pulls the cord and tilts the bell.
export function steamWhistle(ctx, t, yank, pal) {
  ctx.fillStyle = pal.brassDark;
  ctx.fillRect(-10, -8, 20, 46);
  rivet(ctx, 0, 30, 3.5);
  ctx.save();
  ctx.rotate(yank * 0.1);
  ctx.fillStyle = pal.brass;
  ctx.fillRect(-7, -52, 14, 48);
  ctx.beginPath();
  ctx.moveTo(-16, -52);
  ctx.lineTo(16, -52);
  ctx.lineTo(10, -86);
  ctx.lineTo(-10, -86);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = pal.brassDark;
  ctx.fillRect(-16, -56, 32, 7);
  ctx.restore();
  const cordLen = 58 + yank * 22;
  const swing = yank > 0 ? 0 : Math.sin(t * 0.0016) * 5;
  ctx.strokeStyle = "#8a6d2f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, 20);
  ctx.quadraticCurveTo(10 + swing, 20 + cordLen * 0.6, 8 + swing, 20 + cordLen);
  ctx.stroke();
  ctx.strokeStyle = pal.brass;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(8 + swing, 28 + cordLen, 8, 0, 7);
  ctx.stroke();
}

// Bulldog stoker shoveling coal, side profile facing right
export function dogStoker(ctx, t, pal) {
  const cyc = Math.sin(t * 0.004);
  const shovelAng = -0.5 + cyc * 0.45;
  ctx.fillStyle = "#8a6748";
  ctx.beginPath();
  ctx.ellipse(0, -28, 38, 26, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#74543a";
  for (const lx of [-22, -4, 14, 28]) {
    ctx.fillRect(lx, -10, 11, 14);
  }
  // tail wag
  ctx.strokeStyle = "#74543a";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-36, -34);
  ctx.quadraticCurveTo(-48, -40 + Math.sin(t * 0.02) * 6, -52, -32 + Math.sin(t * 0.02) * 8);
  ctx.stroke();
  // head
  ctx.fillStyle = "#8a6748";
  ctx.beginPath();
  ctx.arc(36, -48, 21, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#74543a";
  ctx.beginPath();
  ctx.ellipse(26, -62, 7, 11, 0.5, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#c9ab8a";
  ctx.beginPath();
  ctx.ellipse(46, -42, 12, 9, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(50, -44, 3.4, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(38, -52, 2.6, 0, 7);
  ctx.fill();
  // flat cap
  ctx.fillStyle = "#5a4632";
  ctx.beginPath();
  ctx.ellipse(34, -66, 16, 6, -0.1, 0, 7);
  ctx.fill();
  ctx.fillRect(40, -70, 16, 5);
  // shovel arms
  ctx.save();
  ctx.translate(40, -40);
  ctx.rotate(shovelAng);
  ctx.strokeStyle = "#5a4632";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(46, 14);
  ctx.stroke();
  ctx.fillStyle = "#777";
  ctx.beginPath();
  ctx.ellipse(54, 17, 13, 8, 0.3, 0, 7);
  ctx.fill();
  if (cyc > 0.3) {
    ctx.fillStyle = "#ff7b2e";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(50 + i * 5, 12 + (i % 2) * 4, 3, 0, 7);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Airship with dog pilot. Origin at balloon center.
export function airship(ctx, t, banner, pal) {
  const bob = Math.sin(t * 0.0012) * 6;
  ctx.save();
  ctx.translate(0, bob);
  // banner rope + cloth
  ctx.strokeStyle = "rgba(120,100,70,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-95, 6);
  ctx.quadraticCurveTo(-140, 16, -178, 8 + Math.sin(t * 0.003) * 6);
  ctx.stroke();
  ctx.fillStyle = pal.bannerCloth;
  ctx.save();
  ctx.translate(-178, 8 + Math.sin(t * 0.003) * 6);
  ctx.rotate(Math.sin(t * 0.003) * 0.06 - 0.03);
  const bw = 16 + banner.length * 10;
  ctx.fillRect(-bw, -16, bw, 32);
  ctx.fillStyle = LINE;
  ctx.font = "600 16px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(banner, -bw / 2, 6);
  ctx.restore();
  // balloon
  ctx.fillStyle = metal(ctx, -30, -38, 20, 76, pal.balloonDark, pal.balloon, pal.brassLight);
  ctx.beginPath();
  ctx.ellipse(0, 0, 100, 38, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = pal.balloonDark;
  ctx.beginPath();
  ctx.ellipse(0, 10, 100, 28, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = pal.balloonRib;
  ctx.lineWidth = 2.4;
  for (const rx of [-60, -20, 20, 60]) {
    ctx.beginPath();
    ctx.moveTo(rx, -36);
    ctx.quadraticCurveTo(rx * 1.12, 0, rx, 37);
    ctx.stroke();
  }
  // tail fin
  ctx.fillStyle = pal.balloonDark;
  ctx.beginPath();
  ctx.moveTo(-92, -10);
  ctx.lineTo(-128, -30);
  ctx.lineTo(-118, 2);
  ctx.closePath();
  ctx.fill();
  // gondola
  ctx.strokeStyle = "#5a4632";
  ctx.lineWidth = 3;
  for (const gx of [-30, 30]) {
    ctx.beginPath();
    ctx.moveTo(gx, 30);
    ctx.lineTo(gx * 0.7, 58);
    ctx.stroke();
  }
  ctx.fillStyle = "#6e4a2e";
  ctx.fillRect(-40, 56, 80, 26);
  ctx.fillStyle = "#8a5f3c";
  ctx.fillRect(-36, 60, 72, 18);
  // dog pilot peeking
  ctx.fillStyle = "#b98a5e";
  ctx.beginPath();
  ctx.arc(6, 50, 14, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#9c6f44";
  ctx.beginPath();
  ctx.ellipse(-5, 44, 5, 9, 0.4, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(17, 44, 5, 9, -0.4, 0, 7);
  ctx.fill();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(2, 48, 2.2, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(11, 48, 2.2, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, 54, 2.6, 0, 7);
  ctx.fill();
  // scarf trailing
  ctx.strokeStyle = "#a32d2d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(14, 56);
  ctx.quadraticCurveTo(34, 52 + Math.sin(t * 0.006) * 5, 52, 60 + Math.sin(t * 0.005) * 8);
  ctx.stroke();
  // propeller at rear
  ctx.save();
  ctx.translate(104, 6);
  ctx.fillStyle = "#5a4632";
  ctx.fillRect(-8, -3, 10, 6);
  const pa = t * 0.04;
  ctx.strokeStyle = "rgba(90,70,50,0.85)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const a = pa + i * Math.PI;
    ctx.lineTo(Math.cos(a) * 4, Math.sin(a) * 26);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
