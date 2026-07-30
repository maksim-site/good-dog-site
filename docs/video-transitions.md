# GOOD DOG — sauce transition prompts

## Source frames

### Ketchup

- First frame: `public/video/frames/hotdog-sauce-v4-start-plain.png`
- Last frame: `public/video/frames/hotdog-sauce-v4-end-ketchup.png`

### Mustard

- First frame: `public/video/frames/hotdog-sauce-v4-start-plain.png`
- Last frame: `public/video/frames/hotdog-sauce-v4-end-mustard.png`

Use both the first and last frame controls. Do not use a frame that already
contains another sauce.

## Ketchup prompt

```text
Locked-off photorealistic premium food product shot. Preserve the supplied hot
dog, bun, sausage, camera angle, perspective, framing, scale, lighting,
background, shadows, material texture and color grade exactly.

The shot begins completely clean, matching the first frame. After a short hold,
only the narrow stainless-steel nozzle tip of a restaurant squeeze applicator
enters from just above the upper-left edge. No bottle, jar, label, hand or person
is visible. The nozzle moves smoothly from left to right and deposits exactly
one continuous, thick, glossy deep-red ketchup line in an even relaxed zigzag
along the visible length of the sausage. The ketchup makes natural physical
contact with the sausage, with realistic highlights and tiny contact shadows.
The nozzle exits above the upper-right edge. Hold on the finished hot dog,
matching the supplied last frame exactly.

One sauce only. Fixed camera. No zoom, pan, orbit, focus pull or camera shake.
The hot dog must never move, rotate, deform, shorten, lengthen or change texture.
No mustard, yellow sauce, second ketchup line, toppings, onion, herbs, drips,
splashes, smoke burst, extra objects, plate, table, text, logo or watermark.
```

## Mustard prompt

Use the ketchup prompt, but replace:

```text
deep-red ketchup
```

with:

```text
warm golden-yellow mustard
```

and replace:

```text
No mustard, yellow sauce
```

with:

```text
No ketchup, red sauce
```

## Suggested timing

- Duration: 4–5 seconds
- 0.0–0.5 s: exact clean first-frame hold
- 0.5–1.0 s: nozzle enters
- 1.0–3.5 s: one sauce line is drawn left to right
- 3.5–4.0 s: nozzle exits
- Final 0.5–1.0 s: exact last-frame hold
- Aspect ratio: 16:9
- Camera motion: locked / none
- Motion strength: low to medium
- Audio: off

## Website integration

The builder already uses the matching still cutouts as its accessible fallback.
When an approved clip is ready, place it under `public/video/clips/` and set its
path in `app/BuilderProductMedia.tsx`. The final still remains the fallback for
reduced motion, low power and failed video loading.
