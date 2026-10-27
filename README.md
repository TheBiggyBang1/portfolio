# Mehdi Handous — portfolio

A scroll-driven 3D storybook. The jade logo makes one continuous journey through
seven chapter worlds while the real HTML story scrolls over it.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally
```

Useful URL flags:

| Flag | What it does |
| --- | --- |
| `?debug` | Overlay with scroll progress, journey time, current keyframe, camera/target/logo positions. Use it while tuning `config.ts`. |
| `?motion=reduce` | Forces reduced-motion mode (same as the OS setting). |

## Deploying on Render

The site is fully static, so it deploys as a Render **Static Site**: free, served
from a CDN, and it never sleeps (no Docker or server needed). `render.yaml`
holds the whole setup.

1. In Render: **New → Blueprint**, connect GitHub, pick this repo, **Apply**.
2. Render runs `npm ci && npm run build` (Node version from `.node-version`)
   and publishes `dist/`. Every push to `main` redeploys.
3. The link-preview tags (`og:url`, `og:image`) are filled with the site's
   onrender.com address at build time. With a custom domain, add an environment
   variable `SITE_URL` (e.g. `https://example.com`) and redeploy.

`render.yaml` also sets caching (hashed `/assets/*` for a year, the logo and
gallery for a day) and a few security headers.

## Structure

```
render.yaml           Render static-site config (build, publish dir, headers)
public/
  logo.glb            compressed 3D logo (320 KB, Meshopt + WebP, pivot centered)
  logo.svg            clean 2D logo (favicon, extracted from the original)
  og-image.jpg        1200×630 link-preview image (a capture of the hero)
src/
  journey/
    config.ts         ← camera points, logo keyframes, sky, fog, clouds, motion settings
    curves.ts         splines + sampler (scroll → camera/logo/sky values)
    anchors.ts        measures where each chapter's text sits in the scroll
    scroll.ts         Lenis + GSAP ScrollTrigger wiring, menu jumps
    store.ts          shared mutable state read by the frame loop
  scenes/
    World.tsx         <Canvas>, frame driver, lights, environment, lazy worlds
    Logo.tsx          the protagonist: material, pose, idle float, parallax, landing
    Sky.tsx, CloudField.tsx
    HelloScene … CraftScene.tsx   one component per chapter world
  components/         nav, chapter menu, preloader, progress indicator, reveals
    sections/         chapter sections, typed caption, agent pipeline, craft/contact/footer
  content/chapters.ts ← all copy, links and placeholders
  styles/tokens.css   ← palette, type scale, spacing
  styles/global.css
```

## How the journey works

1. **Stops.** Each keyframe in `config.ts` is tied to a section (`at: 'voice'`).
   `anchors.ts` measures a *stop* for it: the scroll position where that section's
   text block is centered (desktop) or where its top reaches 52% of the screen
   (mobile). If the content is taller than the screen, the stop becomes a short
   *reading zone* you can scroll through while the 3D holds still.
2. **Snapping** (`scroll.ts`). The page rests on a stop. One wheel gesture, swipe,
   or ↓ / PageDown / Space plays a single ~1.9 s cinematic transition to the next
   stop (↑ / PageUp goes back, Home / End jump to the ends). Input is ignored
   while it plays, and trackpad inertia can't skip a section. After a scrollbar
   drag the page glides to the nearest stop. The chapters menu flies through every
   world in between.
3. Scroll progress is remapped through the stops into journey time `u`: constant
   inside a stop, linear between stops. The transition's easing comes from the
   snap animation alone.
4. `u` drives two `CatmullRomCurve3` splines (camera position and camera target)
   and a third spline for the logo's position. Rotation, scale, tint, glow, sky
   and fog blend between neighbouring keyframes.
5. During each transition the logo makes a full turntable spin (alternating
   direction) with a gentle bank, and the lens breathes open slightly. All three
   return to zero at every stop, so the keyframe poses are exactly what you set.
6. Idle float and cursor tilt are layered on top. The final transition flies the
   logo onto the footer's 2D logo, flattens it and crossfades.

Tune the feel in `MOTION` (`config.ts`):

| Setting | What it changes |
| --- | --- |
| `snap.duration` / `snap.maxDuration` | seconds per transition / cap for long menu jumps |
| `snap.wheelThreshold` / `snap.touchThreshold` | how much wheel / swipe it takes to move on |
| `spin.turns` / `spin.roll` | turns per transition (0 = none) / bank angle |
| `fovKick` | degrees the lens opens mid-transition |
| `landing.blendFrom` / `landing.fadeFrom` | when the footer landing and 3D→2D crossfade start |

## Adjusting camera points

Open `src/journey/config.ts`.

- **Move a whole world:** edit its line in `WORLD`. Camera points and logo poses
  are written as offsets from these centers, so everything follows.
- **Reframe a chapter:** edit that keyframe's `camera: cam(WORLD.x, position, target)`.
  `position` and `target` are offsets from the world center. A target to the
  *left* of the logo puts the logo on the *right* of the screen (where the text
  isn't).
- **Mobile** has its own simpler, pulled-back path in `cameraMobile`.
- Desktop framing is designed at a 1.6 aspect (1440×900). Narrower windows dolly
  back automatically (`MOTION.designAspect`), so you only tune one framing.
- Saving `config.ts` reloads the page, because the journey state is a singleton.

## Adjusting logo keyframes

Each keyframe has a `logo: pose({...})` block:

| Field | Meaning |
| --- | --- |
| `position` | world position (usually `WORLD.x`) |
| `rotation` | Euler XYZ in radians; `[0,0,0]` faces the camera head-on |
| `scale` | 1 = `LOGO_WIDTH` (2.4 units) wide |
| `tint` | multiplies the jade texture (default `JADE_TINT`) |
| `emissive`, `emissiveIntensity` | self-glow (used in chapter 06) |
| `glow` | 0–1 halo sprite + point light |

Idle float, sway, cursor tilt and camera parallax live in `MOTION`.

## Colors

The palette is defined **once**, in `src/styles/tokens.css`. The 3D code reads
the same CSS variables at runtime (`src/lib/palette.ts`), so changing `--jade`
re-tints buttons, text accents *and* the 3D world.

In `config.ts`, colors are `ColorRef`s: a token name (`'jade'`), a hex
(`'#ffffff'`), `'white'`, or a mix `['cream-deep', 'jade-light', 0.3]`
(30% of the second color). Each keyframe's `sky.bottom` is also the fog color.

## Chapter content

All copy is in `src/content/chapters.ts`. Wrap italic key words in `*asterisks*`
inside a title.

- **Links:** each chapter's `links` list. The first renders as the main button,
  any others as quieter text links beside it.
- **Results** come from the published model cards: Whisper WER 79.1% → 30.4%
  (CTranslate2 version, held-out test set); CheXNet mean AUROC 0.77 over 14 findings.
- **Darija caption** (`DARIJA_SAMPLE`): a real line from the model's test set, where
  its output matched the reference exactly.
- **Gallery** (`GALLERY`): title, type, link, image in `public/gallery/`, and `fit`:
  `cover` for renders and photos, `contain` for logos and packshots. Keep images
  around 1200 px wide, as WebP.
- **Contact:** email, LinkedIn and GitHub live in `PROFILE`.
- **Link preview:** title and description in `index.html`, image in
  `public/og-image.jpg` (keep it 1200×630).

## Clouds

`CLOUDS` in `config.ts` lists puff clusters (center, half-size, count, scale,
color, opacity). Add `near: 'chapterId'` to make a cluster fade in only around
that chapter. The puff texture is painted in code (`src/lib/textures.ts`).

## Accessibility & performance notes

- Text is real, selectable HTML in semantic `<section id="hello|voice|…|craft">`
  plus `#gallery` and `#contact`. The chapters menu jumps to them; deep links like
  `/#vision` work.
- Reduced motion: no snapping and no smooth scroll (plain native scrolling), no
  camera travel, spins or idle animation. The canvas renders on demand and cuts
  between static chapter frames with a short fade. Text uses plain fades.
- Mobile (<768 px or touch): pulled-back camera path, ~45% of the instances,
  DPR capped at 1.5, no cursor parallax. Swipes snap like the wheel; taps on links
  are never intercepted.
- Shaders are compiled in parallel (`KHR_parallel_shader_compile`) before the
  first visible frame, and each chapter world compiles hidden when it mounts.
  This avoids frame hitches mid-scroll. Worlds mount near their chapter and are
  disposed when you scroll far away (`src/scenes/useDispose.ts`).
- Total production assets ≈ 1.8 MB (JS ≈ 430 KB gzipped, GLB 320 KB).

## Re-exporting the 3D logo

The original `logo_3d.glb` (15.8 MB, three 4K PNG textures, corner pivot) isn't
in the repo or the site (it's git-ignored). Put it at the project root to
regenerate `public/logo.glb`:

```bash
npx @gltf-transform/cli center logo_3d.glb centered.glb --pivot center
npx @gltf-transform/cli optimize centered.glb public/logo.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify false
```

The model is exported lying flat (Blender Z-up), so `Logo.tsx` stands it up with
`MODEL_ROTATION`.
