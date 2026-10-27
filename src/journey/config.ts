import type { ColorRef } from '../lib/palette'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE JOURNEY: every tweakable camera point and logo pose lives here.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  - One keyframe per stop: each chapter, the gallery, and a final "rest" at the
 *    page bottom. The page snaps from stop to stop (src/journey/scroll.ts).
 *  - `at` ties a keyframe to the DOM: the keyframe is reached exactly when that
 *    section's text block is centered on screen ('start' = top, 'end' = bottom).
 *  - Camera positions and targets become two CatmullRom splines. Scroll maps
 *    linearly onto them; the snap transition owns the easing.
 *  - Logo positions also form a spline; rotation/scale/colors blend per segment.
 *  - Positions are world units. The logo is LOGO_WIDTH units wide at scale 1.
 *  - Camera values are written as offsets from the chapter's world center so
 *    you can move a whole world by editing one line in WORLD.
 *
 *  Tip: open the site with ?debug to see progress, keyframe and camera position.
 */

// The journey state is a singleton, so edits to this file reload the page cleanly.
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload())

export type Vec3 = readonly [number, number, number]

export interface CameraPoint {
  position: Vec3
  target: Vec3
}

export interface LogoPose {
  position: Vec3
  /** Euler XYZ, radians. [0,0,0] faces the camera head-on. */
  rotation: Vec3
  scale: number
  /** Multiplies the jade texture ('white' = the raw texture). */
  tint: ColorRef
  emissive: ColorRef
  emissiveIntensity: number
  /** 0..1 soft halo sprite around the logo. */
  glow: number
}

export interface AnchorRule {
  /** Which edge of the section's [data-anchor] block to line up. */
  edge: 'center' | 'top'
  /** Where that edge sits when the keyframe is reached (0 top of screen, 1 bottom). */
  ratio: number
}

export interface Keyframe {
  id: string
  at: 'start' | 'end' | string
  /** Chapter shown in the progress indicator (defaults to the keyframe id). */
  chapter?: string
  /** Overrides MOTION.anchor for this keyframe (desktop and mobile). */
  anchor?: AnchorRule
  camera: CameraPoint
  /** Simpler, pulled-back framing used under 768px / touch devices. */
  cameraMobile: CameraPoint
  logo: LogoPose
  sky: { top: ColorRef; bottom: ColorRef }
  /** Linear fog [near, far]; the fog color is the sky's bottom color. */
  fog: readonly [number, number]
}

export interface CloudCluster {
  center: Vec3
  /** Half extents of the box the puffs are scattered in. */
  size: Vec3
  count: number
  scale: readonly [number, number]
  color: ColorRef
  opacity: number
  /** Keyframe id: if set, the cluster only fades in as the journey nears that chapter. */
  near?: string
}

export const LOGO_WIDTH = 2.4

/** Multiplies the GLB's pale jade texture toward the palette's jade. */
export const JADE_TINT: ColorRef = ['jade-light', 'jade', 0.3]

/** World centers: where each chapter's little world is built. */
export const WORLD = {
  hello: [0, 0, 0],
  voice: [3.5, 4.2, -15],
  studio: [-3, 3.2, -31],
  vision: [0.5, 1.6, -47],
  toolkit: [4.5, 2.6, -63],
  mindset: [0, 5, -88],
  craft: [-0.5, 1.4, -112],
} as const satisfies Record<string, Vec3>

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const cam = (center: Vec3, position: Vec3, target: Vec3): CameraPoint => ({
  position: add(center, position),
  target: add(center, target),
})

const pose = (p: Partial<LogoPose> & Pick<LogoPose, 'position'>): LogoPose => ({
  rotation: [0, 0, 0],
  scale: 1,
  tint: JADE_TINT,
  emissive: 'jade',
  emissiveIntensity: 0,
  glow: 0,
  ...p,
})

export const KEYFRAMES: Keyframe[] = [
  {
    id: 'hello',
    at: 'start',
    camera: cam(WORLD.hello, [0, 0.35, 6.2], [0, -0.25, 0]),
    cameraMobile: cam(WORLD.hello, [0, 0.5, 9.4], [0, -1.5, 0]),
    logo: pose({ position: WORLD.hello }),
    sky: { top: 'cream', bottom: 'cream-deep' },
    fog: [7, 34],
  },
  {
    id: 'voice',
    at: 'voice',
    camera: cam(WORLD.voice, [0.6, 1.1, 8.4], [-1.55, 0, 0]),
    cameraMobile: cam(WORLD.voice, [0, 1.2, 12], [0, -1.8, 0]),
    logo: pose({
      position: WORLD.voice,
      rotation: [0.12, -0.35, 0.05],
      scale: 0.78,
      tint: ['jade-light', 'jade', 0.42],
    }),
    sky: { top: 'cream', bottom: ['cream-deep', 'jade-light', 0.22] },
    fog: [8, 38],
  },
  {
    id: 'studio',
    at: 'studio',
    camera: cam(WORLD.studio, [-6.4, 1.8, 3.2], [0.8, 0, -2.2]),
    cameraMobile: cam(WORLD.studio, [-5, 2.6, 9], [0, -1.4, -1]),
    logo: pose({ position: WORLD.studio, rotation: [0, -0.7, 0], scale: 0.6 }),
    sky: { top: 'cream', bottom: ['cream-deep', 'olive-light', 0.3] },
    fog: [8, 36],
  },
  {
    id: 'vision',
    at: 'vision',
    camera: cam(WORLD.vision, [-7.4, 2.2, 7.6], [-0.85, -0.1, -0.85]),
    cameraMobile: cam(WORLD.vision, [-5.5, 2.4, 10.5], [0, -1.4, 0]),
    logo: pose({
      position: WORLD.vision,
      rotation: [0, -0.62, 0],
      scale: 0.68,
      tint: ['jade-light', 'jade', 0.5],
    }),
    sky: { top: ['cream', 'jade-light', 0.12], bottom: ['cream-deep', 'jade-light', 0.35] },
    fog: [7, 32],
  },
  {
    id: 'toolkit',
    at: 'toolkit',
    camera: cam(WORLD.toolkit, [0.3, 0.8, 9.4], [-1.6, 0, 0]),
    cameraMobile: cam(WORLD.toolkit, [0, 1, 11], [0, -1.7, 0]),
    logo: pose({ position: WORLD.toolkit, rotation: [-0.1, 0.25, -0.04], scale: 0.74 }),
    sky: { top: 'cream', bottom: ['cream-deep', 'olive-light', 0.25] },
    fog: [8, 38],
  },
  {
    id: 'mindset',
    at: 'mindset',
    camera: cam(WORLD.mindset, [6, 6, 21], [-3.4, 0.6, 0]),
    cameraMobile: cam(WORLD.mindset, [0, 5.5, 26], [0, -2.2, 0]),
    logo: pose({
      position: WORLD.mindset,
      rotation: [0, 0.8, 0],
      scale: 0.5,
      emissive: 'jade-light',
      emissiveIntensity: 1.1,
      glow: 1,
    }),
    sky: { top: 'olive-ink', bottom: ['olive-ink', 'olive', 0.38] },
    fog: [18, 100],
  },
  {
    id: 'craft',
    at: 'craft',
    camera: cam(WORLD.craft, [0.2, 0.4, 6.4], [-1.8, 0, 0]),
    cameraMobile: cam(WORLD.craft, [0, 0.6, 9.5], [0, -1.6, 0]),
    logo: pose({
      position: WORLD.craft,
      rotation: [0.05, -0.3, 0],
      scale: 0.9,
      tint: ['jade-light', 'jade', 0.22],
    }),
    sky: { top: 'cream', bottom: ['cream-deep', 'olive-light', 0.18] },
    fog: [8, 38],
  },
  {
    id: 'gallery',
    at: 'gallery',
    chapter: 'craft',
    // One row of tiles: center it on every screen size.
    anchor: { edge: 'center', ratio: 0.5 },
    camera: cam(WORLD.craft, [0.6, 0.6, 7.6], [-0.6, 0.1, 0]),
    cameraMobile: cam(WORLD.craft, [0, 0.4, 10.5], [0, 0.6, 0]),
    // Small, in the right-hand gutter beside the grid.
    logo: pose({
      position: add(WORLD.craft, [2.34, 0.25, 0.6]),
      rotation: [0.1, -0.5, 0.08],
      scale: 0.21,
      tint: ['jade-light', 'jade', 0.22],
    }),
    sky: { top: 'cream', bottom: ['cream-deep', 'olive-light', 0.12] },
    fog: [8, 40],
  },
  {
    id: 'rest',
    at: 'end',
    chapter: 'craft',
    camera: cam(WORLD.craft, [0, 0.2, 7.4], [0, -0.2, 0]),
    cameraMobile: cam(WORLD.craft, [0, 0.2, 10], [0, -0.2, 0]),
    logo: pose({ position: add(WORLD.craft, [0.2, -0.1, 1.2]), scale: 0.8 }),
    sky: { top: 'cream', bottom: 'cream-deep' },
    fog: [8, 40],
  },
]

/** Soft volumetric-looking puffs scattered between chapters for depth. */
export const CLOUDS: CloudCluster[] = [
  // The sea the logo rises out of.
  { center: [0, -1.35, -3], size: [11, 0.45, 6], count: 60, scale: [2.2, 4.5], color: 'cream', opacity: 0.95, near: 'hello' },
  { center: [0, -2.0, -6], size: [18, 0.6, 12], count: 40, scale: [3.5, 7], color: ['cream-deep', 'olive-light', 0.3], opacity: 0.8, near: 'hello' },
  // Between voice and studio.
  { center: [0.5, 2.2, -23], size: [9, 2.5, 3], count: 18, scale: [2, 4], color: 'cream', opacity: 0.75 },
  // Between vision and toolkit.
  { center: [2.5, 1.2, -55], size: [9, 2.5, 3], count: 16, scale: [2, 4], color: ['cream', 'jade-light', 0.15], opacity: 0.7 },
  // Dusk clouds under the constellation.
  { center: [0, -5, -88], size: [40, 1.5, 30], count: 30, scale: [7, 13], color: ['olive-ink', 'olive', 0.45], opacity: 0.55, near: 'mindset' },
  // A soft floor for the final chapter.
  { center: [-0.5, -1.6, -110], size: [12, 0.8, 7], count: 26, scale: [2.5, 5], color: 'cream', opacity: 0.85, near: 'craft' },
]

export const MOTION = {
  /** Idle float when the logo is "breathing". */
  floatAmplitude: 0.07,
  floatSpeed: 0.7,
  idleSway: 0.12,
  /** Cursor parallax (desktop only). */
  tilt: { x: 0.16, y: 0.24 },
  cameraParallax: 0.22,
  /**
   * When a keyframe is reached: the section's text block edge (`center` or `top`)
   * sits at this fraction of the viewport height (0 top, 1 bottom). On mobile the
   * text card is tall, so we sync its top edge and keep the logo visible above it.
   */
  anchor: {
    desktop: { edge: 'center', ratio: 0.5 },
    mobile: { edge: 'top', ratio: 0.52 },
  } as const,
  fov: { desktop: 35, mobile: 42 },
  /** Desktop framing is designed at this aspect (1440×900); other shapes dolly to match. */
  designAspect: 1.6,
  /**
   * The landing on the footer logo, as fractions of the final transition (0..1):
   * the flight starts at `blendFrom`, the 3D→2D crossfade at `fadeFrom`.
   */
  landing: { blendFrom: 0.4, fadeFrom: 0.88 },
  /** Section snapping: one gesture = one cinematic transition to the next stop. */
  snap: {
    /** Seconds for a one-stop transition; longer jumps (menu) stretch up to `maxDuration`. */
    duration: 1.9,
    maxDuration: 3.2,
    /** Accumulated wheel / swipe distance (px) needed to start a transition. */
    wheelThreshold: 24,
    touchThreshold: 48,
  },
  /** Extra character during transitions; both return to zero at every stop. */
  spin: {
    /** Full turntable turns per transition (direction alternates each chapter). */
    turns: 1,
    /** Banking roll in radians at mid-transition. */
    roll: 0.22,
  },
  /** Degrees the field of view breathes open mid-transition. */
  fovKick: 4,
}

/** Agents in chapter 03, laid out along the logo's own path around the studio keyframe. */
export const STUDIO_AGENTS = ['Script', 'Visuals', 'Voice', 'Animate', 'Publish'] as const
/** Offsets in "keyframe segments" (1 = one chapter of travel) from the studio keyframe. */
export const STUDIO_NODE_OFFSETS = [-0.38, -0.19, 0, 0.19, 0.38] as const
