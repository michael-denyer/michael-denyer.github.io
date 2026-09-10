# The Aether Works

Personal landing page at [michael-denyer.github.io](https://michael-denyer.github.io) —
a steampunk workshop run by cats, powered by commits.

## What's in the scene

- Boiler gauges, the airship's PR banner, the mainspring streak dial, and the
  commit telegraph ticker all read live GitHub data client-side (unauthenticated
  API + the profile repo's rendered café SVG), with baked fallbacks so the
  workshop never goes dark.
- Mouse parallax across five depth layers; every cat's eyes follow the cursor.
- Click near a boiler to vent steam. The ◐ valve flips day/night; it otherwise
  follows `prefers-color-scheme`.
- Illustrated Victorian engine-room architecture, copper boilers with lit
  water levels, engraved brass gears, a moving crank, and a caged firebox.
- Painted animal crew with leather aprons, goggles, a waistcoat and watch
  chain, and an aviator helmet. A small WebGL deformation rig animates the
  wrench, tapping paw, shovel, tails, running legs, eyes, and breathing.
- Pause the machinery with the pause icon. The workshop starts paused
  when `prefers-reduced-motion` is enabled.
- On phones, use the workshop slider to reach the furnace and boiler bank.
  Touches use their own coordinates, so the crew respond without mouse movement.

## Stack

Vanilla ES modules with a 2D scene canvas and an offscreen WebGL crew rig.
Run `python3 -m http.server` and open it. No build step or package dependencies.

```text
index.html      shell + masthead
style.css       brass plaque chrome
js/main.js      scene, layers, loop, input, palettes
js/sprites.js   sprite drawing and procedural fallbacks
js/artwork.js   atlas crops, asset loading, and painted-sprite placement
js/crew-rig.js  animated limbs, expressions, and breathing in the painted crew
js/data.js      live GitHub data with fallbacks
assets/         compressed backdrop, sprite atlases, and generation briefs
```

The backdrop and two transparent WebP atlases total about 1.2 MiB. Gauges
still use live readings, and the crew retains its click reactions and sounds.
If artwork cannot load, the procedural scene remains available. If WebGL is
unavailable, the original articulated crew is used. There are no runtime
package dependencies or build steps.
