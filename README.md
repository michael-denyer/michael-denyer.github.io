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

## Stack

Vanilla ES modules + a single 2D canvas. No build step, no dependencies —
`python3 -m http.server` and open it.

```text
index.html      shell + masthead
style.css       brass plaque chrome
js/main.js      scene, layers, loop, input, palettes
js/sprites.js   canvas draw functions (cats, dog, airship, gears, gauges)
js/data.js      live GitHub data with fallbacks
```
