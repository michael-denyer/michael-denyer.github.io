// Offline asset preparation. Run with Sharp installed and a source manifest:
// node scripts/prepare-crew.mjs /path/to/sources.json
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
const sharp = createRequire(import.meta.url)("sharp");
const sources = JSON.parse(await readFile(process.argv[2], "utf8"));
const names = new Set(["engineer","operator","sleeper","kitten","stoker","pilot"]);
await mkdir(new URL("../assets/crew/", import.meta.url), {recursive:true});

function removeCheckerboard(data, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const neutral = i => {
    const [r,g,b] = data.subarray(i * 4, i * 4 + 3);
    return Math.min(r,g,b) > 175 && Math.max(r,g,b) - Math.min(r,g,b) < 18;
  };
  for (let root = 0; root < seen.length; root++) {
    if (seen[root] || !neutral(root)) continue;
    let head = 0, tail = 0, edge = false;
    const add = i => { if (!seen[i] && neutral(i)) { seen[i] = 1; queue[tail++] = i; } };
    add(root);
    while (head < tail) {
      const i = queue[head++], x = i % width, y = Math.floor(i / width);
      edge ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (x > 0) add(i - 1);
      if (x + 1 < width) add(i + 1);
      if (y > 0) add(i - width);
      if (y + 1 < height) add(i + width);
    }
    // Remove the connected backdrop and enclosed checkerboard gaps, while
    // retaining small eye highlights and individual pale fur details.
    if (edge || tail > 60) for (let j = 0; j < tail; j++) data[queue[j] * 4 + 3] = 0;
  }
}

function packFrames(data, width, height) {
  const seen = new Uint8Array(width * height), queue = new Int32Array(width * height);
  const components = [];
  for (let root = 0; root < seen.length; root++) {
    if (seen[root] || data[root * 4 + 3] < 12) continue;
    let head = 0, tail = 0, left = width, top = height, right = 0, bottom = 0;
    const add = i => { if (!seen[i] && data[i * 4 + 3] >= 12) { seen[i] = 1; queue[tail++] = i; } };
    add(root);
    while (head < tail) {
      const i = queue[head++], x = i % width, y = Math.floor(i / width);
      left = Math.min(left,x); right = Math.max(right,x); top = Math.min(top,y); bottom = Math.max(bottom,y);
      if (x > 0) add(i-1); if (x+1 < width) add(i+1);
      if (y > 0) add(i-width); if (y+1 < height) add(i+width);
    }
    components.push({pixels:queue.slice(0,tail),left,right,top,bottom});
  }
  components.sort((a,b) => b.pixels.length - a.pixels.length);
  const bodies = components.slice(0,6).map(component => ({...component,
    frame:Math.floor((component.left+component.right)/2/512) + 3*Math.floor((component.top+component.bottom)/2/512),
  }));
  if (new Set(bodies.map(body => body.frame)).size !== 6) throw new Error('Expected six separate character poses');
  const output = Buffer.alloc(1920 * 1120 * 4);
  for (const component of components) {
    if (component.pixels.length < 3) continue;
    const x = (component.left+component.right)/2, y = (component.top+component.bottom)/2;
    const distance = body => Math.hypot(Math.max(body.left-x,0,x-body.right),Math.max(body.top-y,0,y-body.bottom));
    const body = bodies.reduce((nearest,candidate) => distance(candidate) < distance(nearest) ? candidate : nearest);
    const col = body.frame % 3, row = Math.floor(body.frame / 3);
    for (const i of component.pixels) {
      // Padding keeps the complete tool or tail inside its own animation cell.
      const px = i % width - col * 512 + 64, py = Math.floor(i / width) - row * 512 + 24;
      if (px < 0 || px >= 640 || py < 0 || py >= 560) continue;
      const destination = ((row * 560 + py) * 1920 + col * 640 + px) * 4;
      data.copy(output,destination,i*4,i*4+4);
    }
  }
  return output;
}

for (const [name, source] of Object.entries(sources)) {
  if (!names.has(name)) throw new Error(`Unknown crew member: ${name}`);
  const metadata = await sharp(source.path).metadata();
  if (metadata.width !== 1536 || metadata.height !== 1024) throw new Error(`${name} needs a 1536 by 1024 source sheet`);
  const {data, info} = await sharp(source.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if (!metadata.hasAlpha) {
    if (!source.checkerboard) throw new Error(`${name} needs an alpha channel`);
    removeCheckerboard(data, info.width, info.height);
  }
  const destination = new URL(`../assets/crew/${name}.webp`, import.meta.url);
  const packed = packFrames(data,info.width,info.height);
  await sharp(packed, {raw:{width:1920,height:1120,channels:4}}).resize(960,560).webp({quality:90,alphaQuality:100}).toFile(destination.pathname);
  console.log(`${name}: ${destination.pathname}`);
}
