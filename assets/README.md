# Engine-room backdrop

`engine-room.webp` was generated with the built-in OpenAI imagegen tool and
encoded as WebP at quality 88. Dimensions are 1672 by 941 pixels. The image is
decorative; the foreground machinery, live gauges, animals, and interactions
are drawn separately on the canvas.

## Generation prompt

```text
Use case: illustration-story
Asset type: Original landscape background asset for an interactive 2D canvas steampunk workshop website.
Primary request: A richly detailed atmospheric Victorian steampunk engine room, without any characters.
Style/medium: Sophisticated hand-painted storybook and animated-film background illustration with etched linework, readable silhouettes, layered architectural detail, not photorealistic.
Scene/backdrop: Aged copper pipes, dark iron riveted pillars, overhead brass pipework, huge arched factory windows with desaturated teal twilight, Victorian cast-iron tracery, distant industrial city through the windows, small warm gas lamps, dark walnut and brick walls.
Composition/framing: Wide 16:9 landscape, preferably 1920x1080 or highest suitable landscape resolution. Front-on stage composition. Back wall architecture occupies the upper 70 percent; bottom 30 percent is a darker empty stage floor. Keep the foreground empty for separately drawn machinery and cute cats. No giant foreground objects. Center of upper 20 percent should be quiet dark space reserved for a title overlay.
Lighting/mood: Rich atmosphere; cool teal twilight through windows with gentle amber light from small gas lamps.
Color palette: Jewel teal, charcoal brown, warm amber brass.
Materials/textures: Aged copper patina, engraved brass, riveted cast iron, subtle old brick and dark wood.
Constraints: Exactly one image. No characters, cats, people, text, lettering, UI, logos, or watermark.
```

## Painted foreground

`machinery-atlas.webp` was generated with the built-in imagegen tool using the
engine-room backdrop as a style reference. Its 1536 by 1024 image has native
transparency. The machinery and initial crew design prompts are in
`foreground-prompts.json`. Machinery bounds are in `js/artwork.js`.

## Crew animation

The six WebP sheets in `crew/` contain separately generated anatomical poses.
The built-in imagegen tool produced each sequence using the original crew
design as its identity reference. Exact prompts are in `crew/prompts.json`.
The original reference is preserved in commit `db20ead` as `assets/crew-atlas.webp`.

Five sequences have native alpha. The kitten's baked checkerboard was removed
programmatically under the user's existing background-removal authorization.
`scripts/prepare-crew.mjs` separates the six silhouettes, adds padding so tools
cannot bleed into adjacent frames, and exports 960 by 560 transparent WebPs.
It needs Sharp for offline preparation only. Supply a JSON source manifest
mapping each crew name to a `path`, plus `checkerboard: true` for the kitten.

`js/crew-animation.js` records foot and shoulder registration points, authored
pose order, and timing. It renders the pose images directly on the 2D canvas.
The working crew has fixed ground anchors; the kitten's stride follows its
distance travelled along a continuous chase path.
