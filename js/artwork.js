// Painted sprite atlases load independently; the procedural sprites remain
// available if an image is missing or the connection is offline.
import { loadCrew, hasCrew, animateCrew, drawCrew, crew } from "./crew-animation.js";

const sheets = new Map();
const frames = {
  furnace: {sheet:"machinery", cell:0, crop:[99,8,368,547]},
  boiler: {sheet:"machinery", cell:1, crop:[623,5,327,545]},
  telegraph: {sheet:"machinery", cell:2, crop:[1031,119,490,424]},
  airship: {sheet:"machinery", cell:3, crop:[21,614,590,354]},
  flywheel: {sheet:"machinery", cell:4, crop:[619,567,405,403]},
  lantern: {sheet:"machinery", cell:5, crop:[1198,550,187,450]},
  whistle: {sheet:"machinery", crop:[759,4,56,92]},
};

export function loadArtwork(onLoad) {
  loadCrew(onLoad);
  for (const name of ["machinery"]) {
    const image = new Image();
    const sheet = {image, ready:false};
    sheets.set(name, sheet);
    image.addEventListener("load", () => {
      sheet.ready = true;
      onLoad();
    });
    image.src = new URL(`../assets/${name}-atlas.webp`, import.meta.url).href;
  }
}

export function animateArtwork(t, states) {
  animateCrew(t, states);
}

export function hasArtwork(name) {
  if (Object.hasOwn(crew, name)) return hasCrew(name);
  return sheets.get(frames[name].sheet)?.ready ?? false;
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
  ctx.drawImage(image, sx, sy, sw, sh, box.x, box.y, w, h);
  return box;
}

export const paintCrew = drawCrew;
