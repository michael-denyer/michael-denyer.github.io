// Canvas draw functions for the Aether Works scene.
// All sprites draw at a local origin; callers translate/scale the context.
import { hasArtwork, paint, paintCrew } from "./artwork.js?v=1bdbbf4855e6";

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
  if (hasArtwork("flywheel")) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    paint(ctx, "flywheel", -r, -r, r * 2, r * 2);
    ctx.restore();
    return;
  }
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
  ctx.fillStyle = "#14231e";
  ctx.fillRect(x - w / 2 + 4, y + 4, w - 8, h - 8);
  ctx.strokeStyle = "rgba(255,234,183,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 + 6, y + 6, w - 12, h - 12);
  ctx.fillStyle = "#fff0cf";
  ctx.font = `600 ${size}px Arial, sans-serif`;
  // Keep the lettering large enough to read between the rivets.
  const room = w - 34;
  const measured = ctx.measureText(text).width;
  if (measured > room) {
    size = Math.max(15, Math.floor((size * room) / measured));
    ctx.font = `600 ${size}px Arial, sans-serif`;
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
  ctx.strokeStyle = "#171d18";
  ctx.lineWidth = 19;
  ctx.stroke(path);
  ctx.strokeStyle = "#80643b";
  ctx.lineWidth = 13;
  ctx.stroke(path);
  ctx.strokeStyle = "#b69b64";
  ctx.lineWidth = 9;
  ctx.stroke(path);
  ctx.strokeStyle = "#203d36";
  ctx.lineWidth = 6;
  ctx.stroke(path);
  ctx.strokeStyle = pal.aetherDim;
  ctx.lineWidth = 3;
  ctx.shadowColor = pal.aether;
  ctx.shadowBlur = pal.aetherGlow * 0.35;
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
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  // junction collars
  for (let i = 1; i < pts.length - 1; i++) {
    ctx.fillStyle = pal.brassDark;
    ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 12, 0, 7); ctx.fill();
    ctx.fillStyle = metal(ctx, pts[i][0] - 10, pts[i][1] - 10, 20, 20, pal.brassDark, pal.brass, pal.brassLight);
    ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 9, 0, 7); ctx.fill();
    rivet(ctx, pts[i][0], pts[i][1], 4);
  }
  ctx.restore();
}

// Fur colors are internal six-digit palette values.
function furTone(col, offset) {
  const value = Number.parseInt(col.slice(1), 16);
  const channels = [16, 8, 0].map(shift => Math.max(0, Math.min(255, ((value >> shift) & 255) + offset)));
  return "#" + channels.map(value => value.toString(16).padStart(2, "0")).join("");
}

function fur(ctx, x, y, r, col) {
  const light = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.1, x, y, r * 1.25);
  light.addColorStop(0, furTone(col, 32));
  light.addColorStop(0.5, col);
  light.addColorStop(1, furTone(col, -48));
  return light;
}

function oval(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(30,23,17,0.7)";
  ctx.lineWidth = 1.15;
  ctx.stroke();
}

function paw(ctx, x, y, r, col) {
  oval(ctx, x, y, r, r * 0.58, fur(ctx, x, y, r, col));
  ctx.strokeStyle = "rgba(50,34,25,0.4)";
  ctx.lineWidth = 0.8;
  for (const dx of [-0.26, 0.26]) {
    ctx.beginPath();
    ctx.moveTo(x + r * dx, y + r * 0.1);
    ctx.lineTo(x + r * dx, y + r * 0.43);
    ctx.stroke();
  }
}

function goggles(ctx, cx, cy, r, headR) {
  ctx.save();
  ctx.strokeStyle = "#35261b";
  ctx.lineWidth = r * 0.62;
  ctx.beginPath();
  ctx.arc(cx, cy + headR * 0.1, headR, Math.PI * 1.07, Math.PI * 1.93);
  ctx.stroke();
  ctx.strokeStyle = "#dfb367";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.8, cy - headR * 0.62);
  ctx.lineTo(cx + r * 0.8, cy - headR * 0.62);
  ctx.stroke();
  for (const dx of [-r * 1.16, r * 1.16]) {
    const x = cx + dx, y = cy - headR * 0.62;
    oval(ctx, x, y, r + 1, r + 1, metal(ctx, x - r, y - r, 2 * r, 2 * r, "#584022", "#ba8942", "#ffe0a0"));
    const glass = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    glass.addColorStop(0, "#b4f6e4");
    glass.addColorStop(0.38, "#4a9e98");
    glass.addColorStop(1, "#173b3a");
    oval(ctx, x, y, r * 0.68, r * 0.68, glass);
    ctx.strokeStyle = "#f4ffe9";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.43, Math.PI * 1.05, Math.PI * 1.62);
    ctx.stroke();
  }
  ctx.restore();
}

function ear(ctx, x, y, s, col, tilt) {
  ctx.fillStyle = fur(ctx, x + s / 2, y - s / 2, s, col);
  ctx.strokeStyle = "#453126";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(x - 1, y + 3);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.65, x + s * tilt, y - s * 1.3);
  ctx.quadraticCurveTo(x + s * 0.9, y - s * 0.65, x + s + 1, y + 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#b97c70";
  ctx.beginPath();
  ctx.moveTo(x + s * 0.22, y - s * 0.08);
  ctx.lineTo(x + s * tilt, y - s * 0.96);
  ctx.lineTo(x + s * 0.77, y - s * 0.04);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#e3b8a0";
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(x + s * 0.3, y); ctx.lineTo(x + s * 0.45, y - s * 0.45); ctx.stroke();
}

// Pupils stay inside the irises, including on the small running kitten.
function catEyes(ctx, cx, cy, gap, r, look, glowAlpha, eyeCol) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = eyeCol;
  ctx.shadowBlur = glowAlpha > 0 ? glowAlpha * 3 : 0;
  if (look.happy) {
    ctx.strokeStyle = "#352d24";
    ctx.lineWidth = 1.8;
    for (const dx of [-gap, gap]) {
      ctx.beginPath();
      if (look.asleep) {
        ctx.moveTo(cx + dx - r, cy);
        ctx.quadraticCurveTo(cx + dx, cy + r * 0.8, cx + dx + r, cy);
      } else {
        ctx.arc(cx + dx, cy + r * 0.6, r * 1.1, Math.PI * 1.12, Math.PI * 1.88);
      }
      ctx.stroke();
    }
  } else {
    const gazeX = Math.max(-r * 0.4, Math.min(r * 0.4, look.x));
    const gazeY = Math.max(-r * 0.3, Math.min(r * 0.3, look.y));
    for (const dx of [-gap, gap]) {
      const ex = cx + dx, ry = r * (look.startle ? 1.35 : 1.04);
      ctx.fillStyle = "#efe4bb";
      ctx.strokeStyle = "#40362a";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(ex - r * 1.4, cy);
      ctx.bezierCurveTo(ex - r, cy - ry * 1.4, ex + r, cy - ry * 1.4, ex + r * 1.4, cy);
      ctx.bezierCurveTo(ex + r, cy + ry * 1.2, ex - r, cy + ry * 1.2, ex - r * 1.4, cy);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = eyeCol;
      ctx.beginPath(); ctx.ellipse(ex + gazeX, cy + gazeY, r * 0.88, r * 0.93, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#142821";
      ctx.beginPath();
      ctx.ellipse(ex + gazeX, cy + gazeY, r * (look.startle || look.roundPupils ? 0.64 : 0.3), r * 0.82, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#fff7db";
      ctx.beginPath(); ctx.arc(ex + gazeX - r * 0.25, cy + gazeY - r * 0.35, r * 0.27, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}

function whiskers(ctx, x, y, span, col = "#f0dfbe") {
  ctx.strokeStyle = col;
  ctx.lineWidth = 0.8;
  for (const d of [-1, 1]) for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + d * span * 0.4, y + i * 2);
    ctx.quadraticCurveTo(x + d * span * 0.82, y + i * 4, x + d * span, y + i * 5 - 1);
    ctx.stroke();
  }
}

// Head centered at the caller's origin; all working cats share facial detail.
function catHead(ctx, col, cream, look, pal, t, ph, withGoggles = true) {
  ear(ctx, -22, -13, 15, col, 0.3);
  ear(ctx, 7, -13, 15, col, 0.7);
  oval(ctx, 0, 0, 23, 21, fur(ctx, 0, -2, 24, col));
  // Small cheek tufts soften the circular silhouette.
  for (const d of [-1, 1]) {
    ctx.fillStyle = fur(ctx, d * 16, 5, 13, col);
    ctx.beginPath();
    ctx.moveTo(d * 15, -2); ctx.lineTo(d * 26, 5); ctx.lineTo(d * 21, 6);
    ctx.lineTo(d * 25, 11); ctx.quadraticCurveTo(d * 14, 16, d * 11, 12);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = furTone(col, -42);
  ctx.lineWidth = 2.1;
  ctx.lineCap = "round";
  for (const dx of [-6, 0, 6]) {
    ctx.beginPath(); ctx.moveTo(dx, -16); ctx.lineTo(dx * 0.75, -10 + Math.abs(dx) * 0.22); ctx.stroke();
  }
  oval(ctx, -6, 8, 8, 5.8, cream);
  oval(ctx, 6, 8, 8, 5.8, cream);
  const blink = (t + ph * 1500) % 6100 > 5960;
  catEyes(ctx, 0, -2, 9, 3.9, {...look, happy: look.happy || (blink && !look.startle)}, pal.eyeGlow, "#83bba0");
  ctx.fillStyle = "#a66c64";
  ctx.beginPath(); ctx.moveTo(-3.3, 5); ctx.quadraticCurveTo(0, 3.5, 3.3, 5); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#5b3e35";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 8); ctx.lineTo(0, 10); ctx.quadraticCurveTo(-3, 14, -5, 10);
  ctx.moveTo(0, 10); ctx.quadraticCurveTo(3, 14, 5, 10); ctx.stroke();
  whiskers(ctx, 0, 8, 33);
  if (withGoggles) goggles(ctx, 0, -4, 7.1, 23);
}

export function catSit(ctx, col, shade, t, ph, look, pal, withGoggles = true) {
  if (paintCrew(ctx, "engineer")) return;
  ctx.save();
  const sw = Math.sin(t * 0.0025 + ph);
  oval(ctx, 3, 1, 35, 5, "rgba(10,17,13,0.3)");
  ctx.strokeStyle = fur(ctx, 40, -25, 35, col);
  ctx.lineWidth = 11; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(24, -9); ctx.bezierCurveTo(61, 3, 67 + sw * 7, -40, 48 + sw * 7, -46); ctx.stroke();
  ctx.strokeStyle = furTone(col, -38); ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(52 + sw * 3, -12 - i * 7); ctx.lineTo(60 + sw * 3, -14 - i * 7); ctx.stroke();
  }
  oval(ctx, 0, -32, 28, 33, fur(ctx, -3, -37, 35, col));
  // Leather workshop apron, stitched pocket and brass fasteners.
  ctx.fillStyle = metal(ctx, -20, -48, 40, 0, "#38281e", "#765332", "#a07948");
  ctx.beginPath(); ctx.moveTo(-14, -56); ctx.lineTo(14, -56); ctx.lineTo(24, -9); ctx.quadraticCurveTo(0, -2, -24, -9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#caab72"; ctx.lineWidth = 0.8;
  ctx.strokeRect(-10, -30, 20, 14);
  for (const x of [-10, 10]) rivet(ctx, x, -51, 2);
  ctx.fillStyle = "#737f74"; ctx.fillRect(-6, -33, 3, 10);
  ctx.fillStyle = "#ca9956"; ctx.fillRect(2, -35, 4, 12);
  paw(ctx, -15, -3, 12, shade); paw(ctx, 15, -3, 12, shade);
  ctx.save(); ctx.translate(0, -75);
  catHead(ctx, col, shade, look, pal, t, ph, withGoggles);
  ctx.restore();
  ctx.restore();
}

export function catCurl(ctx, col, shade, t, ph) {
  if (paintCrew(ctx, "sleeper")) return;
  ctx.save();
  ctx.scale(1, 1 + 0.025 * Math.sin(t * 0.0018 + ph));
  oval(ctx, 0, 1, 42, 4, "rgba(10,17,13,0.25)");
  oval(ctx, 0, -16, 40, 22, fur(ctx, -8, -21, 42, furTone(col, 25)));
  ctx.strokeStyle = shade; ctx.lineWidth = 4; ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(-2 + i * 8, -34); ctx.quadraticCurveTo(8 + i * 7, -26, 3 + i * 8, -18); ctx.stroke();
  }
  ctx.save(); ctx.translate(-26, -25); ctx.scale(0.74, 0.74);
  catHead(ctx, "#77716b", "#c4b6a0", {x:0, y:0, happy:true, asleep:true}, {}, t, ph, false);
  ctx.restore();
  ctx.strokeStyle = fur(ctx, 5, -5, 38, "#77716b"); ctx.lineWidth = 13;
  ctx.beginPath(); ctx.moveTo(29, -26); ctx.bezierCurveTo(58, 4, -11, 11, -19, -9); ctx.stroke();
  ctx.strokeStyle = "#b1a28c"; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(32, -12); ctx.quadraticCurveTo(32, 1, 3, -1); ctx.stroke();
  paw(ctx, -19, -6, 8, "#b7ad9c");
  ctx.restore();
}

export function catRun(ctx, col, patch, t, dir, look, pal) {
  if (hasArtwork("kitten")) {
    ctx.save(); ctx.scale(dir, 1);
    paintCrew(ctx, "kitten");
    ctx.restore(); return;
  }
  ctx.save();
  ctx.scale(dir, 1);
  const run = Math.sin(t * 0.02);
  oval(ctx, 2, 5, 36, 3, "rgba(10,17,13,0.25)");
  ctx.strokeStyle = fur(ctx, -33, -31, 24, col); ctx.lineWidth = 8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-23, -20); ctx.bezierCurveTo(-43, -22, -52, -50, -37 - run * 5, -49); ctx.stroke();
  ctx.save(); ctx.rotate(-0.06 * run);
  for (const [lx, phase] of [[-17, -1], [17, 1]]) {
    oval(ctx, lx + phase * run * 5, -1, 5, 9, fur(ctx, lx, 0, 10, "#c4bca8"), phase * run * 0.4);
  }
  oval(ctx, 0, -18, 29, 18, fur(ctx, -5, -23, 32, col));
  oval(ctx, -8, -24, 13, 9, fur(ctx, -8, -26, 14, patch), 0.3);
  for (const [lx, phase] of [[-12, 1], [22, -1]]) paw(ctx, lx + phase * run * 6, 0, 6.5, col);
  // A small red neckerchief follows the kitten's gait.
  ctx.fillStyle = "#923e2c";
  ctx.beginPath(); ctx.moveTo(15, -29); ctx.lineTo(24, -18); ctx.lineTo(17, -11); ctx.lineTo(13, -24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(17, -22); ctx.lineTo(4, -13 + run * 3); ctx.lineTo(9, -24); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(29, -30); ctx.scale(0.7, 0.7);
  catHead(ctx, col, "#f5ead1", {x:look.x * dir, y:look.y, happy:look.happy, startle:look.startle}, pal, t, 2.1, false);
  ctx.restore();
  ctx.restore(); ctx.restore();
}

export function catOperator(ctx, col, shade, t, ph, look, pal, tapBoost = 1) {
  if (hasArtwork("operator")) {
    paintCrew(ctx, "operator");
    return;
  }
  ctx.save();
  const tap = Math.max(0, Math.sin(t * 0.012 * tapBoost + ph)) * 8;
  const sw = Math.sin(t * 0.002 + ph);
  oval(ctx, 0, 1, 31, 4, "rgba(10,17,13,0.25)");
  ctx.strokeStyle = fur(ctx, -36, -28, 30, col); ctx.lineWidth = 10; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-23, -11); ctx.bezierCurveTo(-49, -5, -59, -38, -44 + sw * 7, -48); ctx.stroke();
  oval(ctx, 0, -29, 27, 32, fur(ctx, -6, -34, 34, col), -0.12);
  // Waistcoat, cream shirt, bow tie, and a pocket-watch chain.
  ctx.fillStyle = "#263e36";
  ctx.beginPath(); ctx.moveTo(-16, -51); ctx.lineTo(13, -49); ctx.lineTo(22, -8); ctx.lineTo(2, -4); ctx.lineTo(-20, -11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ddcfaa";
  ctx.beginPath(); ctx.moveTo(-6, -51); ctx.lineTo(11, -49); ctx.lineTo(6, -24); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#a9b39a"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-13, -47); ctx.lineTo(0, -28); ctx.moveTo(15, -43); ctx.lineTo(7, -26); ctx.stroke();
  ctx.fillStyle = "#a77837";
  ctx.beginPath(); ctx.moveTo(2, -43); ctx.lineTo(-6, -47); ctx.lineTo(-6, -39); ctx.lineTo(2, -43); ctx.lineTo(9, -47); ctx.lineTo(9, -39); ctx.closePath(); ctx.fill();
  for (const y of [-23, -15]) rivet(ctx, 3, y, 1.5);
  ctx.strokeStyle = "#d9b563"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-13, -25); ctx.quadraticCurveTo(-6, -9, 2, -22); ctx.stroke();
  paw(ctx, -12, -2, 10, shade);
  ctx.strokeStyle = fur(ctx, 29, -24, 25, col); ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(14, -34); ctx.quadraticCurveTo(34, -28, 43, -12 - tap); ctx.stroke();
  paw(ctx, 43, -11 - tap, 7, shade);
  ctx.save(); ctx.translate(9, -67); ctx.scale(0.96, 0.96);
  catHead(ctx, col, shade, look, pal, t, ph);
  ctx.restore(); ctx.restore();
}

// Wall-mounted steam whistle with a pull cord. Origin: bracket center.
// yank 0..1 pulls the cord and tilts the bell.
export function steamWhistle(ctx, t, yank, pal) {
  if (hasArtwork("whistle")) {
    ctx.save(); ctx.rotate(yank * 0.07);
    paint(ctx, "whistle", -25, -98, 50, 100);
    ctx.restore();
  } else {
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
  }
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

// Bulldog stoker, with a leather apron and articulated shovel arm.
export function dogStoker(ctx, t, pal) {
  if (hasArtwork("stoker")) {
    paintCrew(ctx, "stoker");
    return;
  }
  ctx.save();
  const cyc = Math.sin(t * 0.004);
  const shovelAng = -0.5 + cyc * 0.45;
  oval(ctx, 1, 3, 43, 5, "rgba(10,17,13,0.3)");
  ctx.strokeStyle = fur(ctx, -42, -33, 20, "#a87b52");
  ctx.lineWidth = 8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-33, -30); ctx.bezierCurveTo(-52, -22, -59, -42, -45, -40 + Math.sin(t * 0.014) * 5); ctx.stroke();
  for (const x of [-22, 20]) {
    oval(ctx, x, -5, 8, 13, fur(ctx, x, -5, 15, "#856246"));
    paw(ctx, x + 2, 1, 9, "#bc9c73");
  }
  oval(ctx, 0, -29, 38, 28, fur(ctx, -9, -36, 42, "#ae815a"));
  oval(ctx, 24, -34, 18, 26, fur(ctx, 20, -40, 28, "#d4bc92"), -0.25);
  // Heavy work apron wraps around the barrel-shaped torso.
  ctx.fillStyle = metal(ctx, -28, -45, 50, 0, "#35281e", "#6d4f34", "#9c774c");
  ctx.beginPath(); ctx.moveTo(-18, -54); ctx.quadraticCurveTo(0, -45, 21, -52);
  ctx.lineTo(20, -11); ctx.quadraticCurveTo(-6, -5, -29, -18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#bca074"; ctx.lineWidth = 0.8;
  ctx.strokeRect(-17, -34, 21, 15);
  ctx.beginPath(); ctx.moveTo(-21, -48); ctx.lineTo(-24, -19); ctx.quadraticCurveTo(-5, -9, 17, -15); ctx.stroke();
  rivet(ctx, -14, -47, 2); rivet(ctx, 14, -46, 2);
  paw(ctx, -25, 0, 10, "#c0a27b");
  paw(ctx, 17, 0, 10, "#d4bc92");
  // Folded ears and broad, jowly face read as a bulldog at scene scale.
  oval(ctx, 36, -50, 23, 22, fur(ctx, 31, -57, 28, "#b68d65"));
  oval(ctx, 23, -65, 8, 10, fur(ctx, 21, -66, 11, "#7c563c"), -0.45);
  ctx.strokeStyle = "#c7986c"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(19, -69); ctx.quadraticCurveTo(29, -66, 21, -60); ctx.stroke();
  oval(ctx, 44, -48, 10, 15, fur(ctx, 41, -54, 18, "#e4d2ad"), -0.2);
  const blink = t % 7200 > 7040;
  if (blink) {
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(34, -56); ctx.lineTo(41, -56); ctx.stroke();
  } else {
    oval(ctx, 38, -56, 4.3, 4.8, "#eee1bd");
    oval(ctx, 39, -55.5, 2.6, 3.1, "#382d20");
    oval(ctx, 38, -57, 0.8, 0.8, "#fff9df");
  }
  ctx.strokeStyle = "#624b35"; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(32, -62); ctx.quadraticCurveTo(37, -65, 42, -61); ctx.stroke();
  oval(ctx, 44, -40, 11, 9, fur(ctx, 43, -43, 13, "#d5b98d"));
  oval(ctx, 53, -40, 8, 8, fur(ctx, 52, -44, 11, "#e4cda6"));
  oval(ctx, 53, -46, 6.1, 4.2, "#302b24", -0.12);
  ctx.strokeStyle = "#a8a18b"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(51, -48); ctx.lineTo(55, -48); ctx.stroke();
  ctx.strokeStyle = "#684a35"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(52, -42); ctx.lineTo(51, -36); ctx.quadraticCurveTo(44, -32, 39, -36); ctx.stroke();
  for (const [x,y] of [[43,-42],[47,-39],[40,-39]]) oval(ctx, x, y, 0.65, 0.65, "#6a5137");
  // Tweed cap with a panel seam, small brass badge, and dark peak.
  oval(ctx, 33, -71, 20, 8, fur(ctx, 28, -74, 25, "#596049"), -0.1);
  oval(ctx, 48, -70, 13, 3, "#323c2e", -0.06);
  ctx.strokeStyle = "#9c9a76"; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(22, -76); ctx.quadraticCurveTo(32, -69, 44, -71); ctx.stroke();
  rivet(ctx, 27, -70, 2);
  ctx.save(); ctx.translate(40, -34); ctx.rotate(shovelAng);
  ctx.strokeStyle = "#362a20"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(46, 14); ctx.stroke();
  ctx.strokeStyle = "#b19464"; ctx.lineWidth = 1.3; ctx.stroke();
  oval(ctx, 54, 17, 13, 8, metal(ctx, 41, 10, 26, 16, "#353d38", "#86918a", "#c7cabb"), 0.3);
  ctx.strokeStyle = "#697369"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(44, 14); ctx.lineTo(62, 20); ctx.stroke();
  if (cyc > 0.3) {
    for (let i = 0; i < 3; i++) oval(ctx, 50 + i * 5, 12 + (i % 2) * 4, 3.2, 2.5, "#302e26");
  }
  paw(ctx, 7, 3, 7, "#cfb58c");
  ctx.restore(); ctx.restore();
}

function dogPilot(ctx, t) {
  if (hasArtwork("pilot")) {
    ctx.save(); ctx.translate(6, 70); paintCrew(ctx, "pilot"); ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(6, 46);
  oval(ctx, 0, 2, 15, 16, fur(ctx, -3, -3, 19, "#c49c71"));
  // Leather flying helmet and long ears tucked under its flaps.
  ctx.fillStyle = "#62432e";
  ctx.beginPath(); ctx.arc(0, 0, 16, Math.PI, 0); ctx.lineTo(14, 8); ctx.lineTo(10, 5);
  ctx.lineTo(10, -7); ctx.quadraticCurveTo(0, -12, -10, -7); ctx.lineTo(-10, 6); ctx.lineTo(-16, 8); ctx.closePath(); ctx.fill();
  oval(ctx, -12, 4, 5, 10, fur(ctx, -13, 0, 12, "#956641"), -0.2);
  oval(ctx, 12, 4, 5, 10, fur(ctx, 11, 0, 12, "#956641"), 0.2);
  goggles(ctx, 0, -4, 5.2, 15);
  catEyes(ctx, 0, 0, 5.8, 2.4, {x:0.3,y:0,happy:t % 6500 > 6370,roundPupils:true}, 0, "#a99358");
  oval(ctx, 0, 7, 8, 5.7, fur(ctx, -2, 4, 10, "#ecdcbb"));
  oval(ctx, 0, 4, 3.4, 2.3, "#302b23");
  ctx.strokeStyle = "#614432"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 9); ctx.quadraticCurveTo(3, 12, 5, 9); ctx.stroke();
  ctx.fillStyle = "#9c382b";
  ctx.beginPath(); ctx.moveTo(-11, 12); ctx.quadraticCurveTo(0, 16, 12, 11); ctx.lineTo(12, 16); ctx.lineTo(-10, 18); ctx.closePath(); ctx.fill();
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
  ctx.fillStyle = "#14231e";
  ctx.save();
  ctx.translate(-178, 8 + Math.sin(t * 0.003) * 6);
  ctx.rotate(Math.sin(t * 0.003) * 0.06 - 0.03);
  const bw = 16 + banner.length * 10;
  ctx.fillRect(-bw, -16, bw, 32);
  ctx.strokeStyle = pal.brass;
  ctx.strokeRect(-bw, -16, bw, 32);
  ctx.fillStyle = "#fff0cf";
  ctx.font = "600 17px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(banner, -bw / 2, 6);
  ctx.restore();
  if (hasArtwork("airship")) {
    const ship = paint(ctx, "airship", -150, -75, 300, 180);
    ctx.save();
    ctx.translate(ship.x + ship.w * 0.527, ship.y + ship.h * 0.67);
    ctx.scale(0.6, 0.6);
    if (!paintCrew(ctx, "pilot")) {
      ctx.translate(-6, -70); dogPilot(ctx, t);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(177,141,79,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(-137, -11, 3, 31 * Math.sin(t * 0.035) ** 2 + 2, 0, 0, 7); ctx.stroke();
    ctx.restore(); return;
  }
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
  dogPilot(ctx, t);
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
