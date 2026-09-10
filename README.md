# The Aether Works

Personal landing page at [michael-denyer.github.io](https://michael-denyer.github.io) —
a steampunk workshop run by cats, powered by commits.

## What's in the scene

- Boiler gauges, the airship's PR banner, the mainspring streak dial, and the
  commit telegraph ticker all read live GitHub data client-side (unauthenticated
  API + the profile repo's rendered café SVG), with baked fallbacks so the
  workshop never goes dark.
- Mouse parallax across five depth layers.
- Click near a boiler to vent steam. The ◐ valve flips day/night; it otherwise
  follows `prefers-color-scheme`.
- Illustrated Victorian engine-room architecture, copper boilers with lit
  water levels, engraved brass gears, a moving crank, and a caged firebox.
- Painted animal crew with leather aprons, goggles, a waistcoat and watch
  chain, and an aviator helmet. Individually drawn animation poses show
  wrench strokes, telegraph taps, a complete shovel cycle, running strides,
  sleeping twitches, and the pilot looking around.
- Pause the machinery with the pause icon. The workshop starts paused
  when `prefers-reduced-motion` is enabled.
- On phones, use the workshop slider to reach the furnace and boiler bank.
  Touches use their own coordinates, so the crew respond without mouse movement.

## Stack

Vanilla ES modules with one 2D scene canvas.
Run `python3 -m http.server` and open it. No build step or package dependencies.

```text
index.html      shell + masthead
style.css       brass plaque chrome
js/main.js      scene, layers, loop, input, palettes
js/sprites.js   sprite drawing and procedural fallbacks
js/artwork.js   atlas crops, asset loading, and painted-sprite placement
js/crew-animation.js  pose timing, foot registration, and the kitten's chase
js/data.js      live GitHub data with fallbacks
assets/         compressed backdrop, sprite atlases, and generation briefs
```

The backdrop, machinery atlas, and six crew sheets total about 1.6 MiB. Gauges
still use live readings, and the crew retains its click reactions and sounds.
If artwork cannot load, the original articulated canvas crew remains
available. There are no runtime package dependencies or build steps.

For an enlarged animation study with playback controls, open
`/scripts/crew-preview.html` on the local server. Run
`node scripts/check-crew.mjs` to check chase continuity, turning, and pause.

Before publishing edits, run `node scripts/version-assets.mjs`. It derives a
release ID from the site contents and updates every local script, stylesheet,
and image URL together. `node scripts/version-assets.mjs --check` verifies
that the URLs match the current files. The release ID is also recorded in
the page's `aether-release` meta tag for checking which version loaded.
