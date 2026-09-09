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
- Pause the machinery with the Motion button. The workshop starts paused
  when `prefers-reduced-motion` is enabled.
- On phones, use the workshop slider to reach the furnace and boiler bank.
  Touches use their own coordinates, so the crew respond without mouse movement.

## Stack

Vanilla ES modules + a single 2D canvas. No build step, no dependencies —
`python3 -m http.server` and open it.

```text
index.html      shell + masthead
style.css       brass plaque chrome
js/main.js      scene, layers, loop, input, palettes
js/sprites.js   canvas draw functions (cats, dog, airship, gears, gauges)
js/data.js      live GitHub data with fallbacks
assets/         compressed engine-room backdrop and its generation brief
```

The backdrop is a locally served 351 KiB WebP. If it cannot load, the
procedural wall and gears still render. The scene has no new runtime
dependencies or build step.
