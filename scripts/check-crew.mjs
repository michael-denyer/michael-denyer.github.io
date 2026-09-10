import assert from 'node:assert/strict';
import {advanceChase} from '../js/crew-animation.js';

const gear = {x:760,dir:1,min:700,max:1240};
const kitten = {x:668,dir:1,velocity:90,distance:0};
let turns = 0;
for (let frame = 0; frame < 3600; frame++) {
  const previous = {...kitten};
  const dt = 1000 / 60, speed = frame >= 1200 && frame < 1800 ? 216 : 90;
  advanceChase(gear,kitten,dt,speed);
  // The old direction switch teleported the kitten by 184 world pixels.
  // A frame may retain its previous speed briefly while it decelerates.
  const limit = Math.max(speed,Math.abs(previous.velocity)) * dt / 1000;
  assert.ok(Math.abs(kitten.x-previous.x) <= limit + 1e-8, 'Chase movement must stay continuous through turns');
  assert.ok(gear.x >= gear.min && gear.x <= gear.max, 'Gear stays on its track');
  assert.ok(kitten.distance >= previous.distance, 'Stride distance advances monotonically');
  if (kitten.dir !== previous.dir) turns++;
}
assert.ok(turns >= 8, 'Exercise both directions over several laps');
const paused = structuredClone({gear,kitten});
advanceChase(gear,kitten,0,90);
assert.deepEqual({gear,kitten},paused, 'Pause freezes position, velocity and stride phase');
console.log('PASS: continuous turns, speed changes, stride distance and paused chase');
