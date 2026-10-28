# THE MACHINE THAT NEVER ARRIVES
### 30s · 1080×1920 · 6 beats

**One idea:** an AI agent promises to finish the job, and every beat is another thing it
almost did. The payoff is that the only thing that works is the smallest possible job.

## The retention arc

| t | beat | what is on screen | what carries into the next |
|---|---|---|---|
| 0.0–1.6 | **HOOK** | "IT PLANS." huge, on a real night-city photo, grain moving | the period of the sentence travels up and becomes the dot of the next line |
| 1.6–4.4 | SETUP | "IT ACTS." / "IT NEVER" / "**ARRIVES**" in the serif accent, each one replacing the last by sliding up from behind | "ARRIVES" shrinks and slides into the corner as a stamp |
| 4.4–9.0 | **BODY 1** | the plan card: 5 real steps, first two tick green, then #3 strikes through in red | the red strike line pulls out of the card and becomes a divider |
| 9.0–14.0 | BODY 2 | "$40" giant numeral over a real photo, six hours ticking in mono in the corner | the numeral's baseline becomes the top of the next block |
| 14.0–19.5 | BODY 3 | "STILL NEEDS A HUMAN" — a real photo of a hand, hard cropped, type on top | the photo slides left, revealing the answer |
| 19.5–25.0 | **PAYOFF** | "ONE NARROW TASK." / "HARD BOUNDS." / "A HUMAN CHECK." three lines landing on the beat | the last line's rule extends to full width |
| 25.0–30.0 | LOOP / CTA | the full-width rule becomes the opening frame's horizon line; wordmark; last frame = first frame | loops back to 0 |

## The loop

Frame 0 and the last frame share the same composition: night-city photo, same crop, same
grain seed, the horizon rule at y=1130. The only difference is the type — so the cut reads as
one continuous shot that happens to restart.

## Look (all values from the premium study)

- **Ground:** real photograph, darkened 52 %, never a flat fill.
- **Type:** Archivo Black at 176 px, tracking −8 px; Instrument Serif 104 px in the accent
  `#D4573B`; JetBrains Mono 30 px at +1.5 px for metadata.
- **Texture:** paper 13 % multiply, halftone 22 % multiply over the photo window, grain 9 %
  overlay **re-seeded every frame**.
- **Palette:** `#F4F0E8` light, `#12100E` dark, `#D4573B` accent at 72 % sat. Nothing else.
- **Imperfection:** concrete slab at −1.6°, photo window at 43 % width not 50 %, one element
  cropped by the frame edge, 2 overlapping elements.

## Motion

- in `cubic-bezier(.16,1,.3,1)`, out `cubic-bezier(.7,0,.84,0)`, camera `(.83,0,.17,1)`
- overshoot +4 % on landings (not GSAP's default +10 %)
- stagger 45/50/70/45 ms — deliberately uneven
- durations: micro 160 ms, enter 320 ms, layout 480 ms, camera 900 ms
- 30 fps; every value derived from `t`, nothing from wall clock

## Audio

Bed at −14 LUFS, energy above 150 Hz (a 55 Hz drone alone is inaudible on a phone).
Hits on: each word landing (soft tick), the strike-through (hard tick), $40 (low thump),
each payoff line (tick), the loop seam (nothing — let it breathe).
