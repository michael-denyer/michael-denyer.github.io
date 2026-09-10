// Each frame is a separately drawn pose. Origins register the planted feet
// (or the pilot's shoulders), so changing pose never slides the whole animal.
export const crew = {
  engineer: {
    scale:0.25, phase:0,
    origins:[[306,499],[272,499],[279,499],[306,493],[274,493],[308,493]],
    // The upright pose uses the other paw; keep the working stroke in one hand.
    poses:[0,1,2,1,0,3,5], durations:[550,130,340,130,300,140,500],
  },
  operator: {
    scale:0.235, phase:450,
    origins:[[310,494],[299,494],[307,494],[321,480],[311,480],[309,480]],
    poses:[0,1,2,3,2,1,4,5], durations:[400,100,170,180,130,100,130,450],
  },
  sleeper: {
    scale:0.19, phase:1400,
    origins:[[256,420],[256,421],[256,422],[256,389],[256,390],[256,390]],
    // Rest on the paws, with one brief ear twitch between long sleeping holds.
    poses:[0,1,0], durations:[5600,220,1800],
  },
  kitten: {
    scale:0.205, phase:0,
    origins:[[260,467],[260,467],[260,467],[260,420],[260,420],[260,420]],
    poses:[0,1,2,3,4,5], durations:[90,90,85,90,105,90],
  },
  stoker: {
    scale:0.255, phase:500,
    origins:[[182,497],[197,497],[210,497],[190,470],[208,470],[216,470]],
    poses:[0,1,2,3,4,5], durations:[360,180,260,250,210,280],
  },
  pilot: {
    scale:0.105, phase:2500,
    origins:[[270,502],[269,502],[277,502],[279,497],[277,497],[278,497]],
    poses:[0,1,2,1,0,3,4,5], durations:[2200,180,700,180,1200,100,180,1000],
  },
};

export function poseAt(definition, elapsed) {
  const period = definition.durations.reduce((sum, duration) => sum + duration, 0);
  let position = ((elapsed + definition.phase) % period + period) % period;
  for (let i = 0; i < definition.poses.length; i++) {
    if (position < definition.durations[i]) return definition.poses[i];
    position -= definition.durations[i];
  }
  return definition.poses[0];
}

export function advanceChase(gear, kitten, dt, speed) {
  gear.x += gear.dir * speed * dt / 1000;
  if (gear.x > gear.max) { gear.x = 2 * gear.max - gear.x; gear.dir = -1; }
  if (gear.x < gear.min) { gear.x = 2 * gear.min - gear.x; gear.dir = 1; }
  const target = gear.x - gear.dir * 80;
  const desired = Math.max(-speed, Math.min(speed, (target - kitten.x) * 3));
  kitten.velocity += (desired - kitten.velocity) * (1 - Math.exp(-dt / 110));
  const travel = kitten.velocity * dt / 1000;
  kitten.x += travel;
  kitten.distance += Math.abs(travel);
  if (Math.abs(kitten.velocity) > 10) kitten.dir = Math.sign(kitten.velocity);
}

const sheets = new Map();
let previousTime = 0;

export function loadCrew(onLoad) {
  for (const name of Object.keys(crew)) {
    const image = new Image();
    const sheet = {image, ready:false, elapsed:0};
    sheets.set(name, sheet);
    image.addEventListener("load", () => { sheet.ready = true; onLoad(); });
    image.src = new URL(`../assets/crew/${name}.webp?v=1424d2a11c5c`, import.meta.url).href;
  }
}

export function hasCrew(name) { return sheets.get(name)?.ready ?? false; }

export function animateCrew(t, states) {
  const dt = t - previousTime;
  previousTime = t;
  for (const [name, sheet] of sheets) {
    const state = states[name] ?? {};
    if (name === "kitten" && state.distance !== undefined) {
      // One drawn stride per 60 world pixels, including deceleration and zoomies.
      sheet.elapsed = state.distance / 60 * 550;
    } else {
      sheet.elapsed += dt * (state.speed ?? (state.happy ? 1.3 : 1));
    }
  }
}

export function drawCrew(ctx, name) {
  const sheet = sheets.get(name);
  if (!sheet?.ready) return false;
  const definition = crew[name];
  const frame = poseAt(definition, sheet.elapsed);
  const column = frame % 3, row = Math.floor(frame / 3);
  const [ox,oy] = definition.origins[frame];
  const scale = definition.scale;
  // Sheets are stored at half the source resolution; registration remains in
  // source coordinates so neither pose width nor head height changes the scale.
  ctx.drawImage(sheet.image, column * 320, row * 280, 320, 280,
    (-64 - ox) * scale, (-24 - oy) * scale, 640 * scale, 560 * scale);
  return true;
}
