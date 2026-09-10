// Painted sprite atlases load independently; the procedural sprites remain
// available if an image is missing or the connection is offline.
import { createCrewRig } from "./crew-rig.js";

const sheets = new Map();
let crewRig = null;
const frames = {
  furnace: {sheet:"machinery", cell:0, crop:[99,8,368,547]},
  boiler: {sheet:"machinery", cell:1, crop:[623,5,327,545]},
  telegraph: {sheet:"machinery", cell:2, crop:[1031,119,490,424]},
  airship: {sheet:"machinery", cell:3, crop:[21,614,590,354]},
  flywheel: {sheet:"machinery", cell:4, crop:[619,567,405,403]},
  lantern: {sheet:"machinery", cell:5, crop:[1198,550,187,450]},
  whistle: {sheet:"machinery", crop:[759,4,56,92]},
  engineer: {sheet:"crew", cell:0, crop:[16,11,450,501]},
  operator: {sheet:"crew", cell:1, crop:[540,28,442,475]},
  sleeper: {sheet:"crew", cell:2, crop:[994,188,534,286]},
  kitten: {sheet:"crew", cell:3, crop:[18,551,467,370]},
  stoker: {sheet:"crew", cell:4, crop:[512,512,579,486]},
  pilot: {sheet:"crew", cell:5, crop:[1112,516,406,497]},
};

export function loadArtwork(onLoad) {
  for (const name of ["machinery", "crew"]) {
    const image = new Image();
    const sheet = {image, ready:false};
    sheets.set(name, sheet);
    image.addEventListener("load", () => {
      sheet.ready = true;
      if (name === "crew") crewRig = createCrewRig(image, frames);
      onLoad();
    });
    image.src = new URL(`../assets/${name}-atlas.webp`, import.meta.url).href;
  }
}

export function animateArtwork(t, states) {
  crewRig?.render(t, states);
}

export function hasArtwork(name) {
  const sheet = frames[name].sheet;
  return (sheets.get(sheet)?.ready ?? false)
    && (sheet !== "crew" || (crewRig?.available() ?? false));
}

// Destination rectangles deliberately preserve the source's proportions.
export function paint(ctx, name, x, y, width, height) {
  const frame = frames[name];
  const sheet = sheets.get(frame.sheet);
  if (!sheet?.ready) return null;
  const image = sheet.image;
  const cellWidth = image.width / 3, cellHeight = image.height / 2;
  const [sx, sy, sw, sh] = frame.crop ?? [
    frame.cell % 3 * cellWidth, Math.floor(frame.cell / 3) * cellHeight, cellWidth, cellHeight,
  ];
  const scale = Math.min(width / sw, height / sh);
  const w = sw * scale, h = sh * scale;
  const box = {x:x + (width - w) / 2, y:y + height - h, w, h};
  if (frame.sheet === "crew" && crewRig?.draw(ctx, name, box)) return box;
  ctx.drawImage(image, sx, sy, sw, sh, box.x, box.y, w, h);
  return box;
}

export function paintCrew(ctx, name, t, look = {}, phase = 0) {
  if (!hasArtwork(name)) return false;
  const size = {
    engineer:[116,120], operator:[120,110], sleeper:[94,48],
    kitten:[102,66], stoker:[148,112], pilot:[46,52],
  }[name];
  ctx.save();
  const breathing = Math.sin(t * 0.002 + phase);
  const running = name === "kitten";
  const bob = running ? Math.abs(Math.sin(t * 0.016)) * 3 : 0;
  ctx.translate(0, -bob);
  ctx.rotate(running ? Math.sin(t * 0.016) * 0.035 : 0);
  ctx.scale(1, 1 + breathing * (name === "sleeper" ? 0.018 : 0.005));
  if (look.happy) ctx.rotate(Math.sin(t * 0.005) * 0.025);
  if (look.startle) ctx.translate(0, -3);
  paint(ctx, name, -size[0] / 2, -size[1], ...size);
  ctx.restore();
  return true;
}
