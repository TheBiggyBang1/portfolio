import { CatmullRomCurve3, Color, Euler, Quaternion, Vector3 } from 'three'
import { resolveColor } from '../lib/palette'
import { KEYFRAMES, MOTION, STUDIO_NODE_OFFSETS, type Vec3 } from './config'
import type { JourneySample } from './store'

const spinEuler = new Euler()
const spinQuat = new Quaternion()

/**
 * The snap transition eases scroll with an in-out cubic, which bunches travel into
 * the middle. Undo that (recover elapsed time), then apply a softer sine ease so
 * the spin glides instead of whipping round mid-flight.
 */
function spinProgress(t: number) {
  const time = t < 0.5 ? Math.cbrt(t / 4) : 1 - Math.cbrt(2 * (1 - t)) / 2
  return 0.5 - 0.5 * Math.cos(Math.PI * time)
}

export const KEY_COUNT = KEYFRAMES.length
/** Journey time covered by one keyframe-to-keyframe segment. */
export const SEG = 1 / (KEY_COUNT - 1)

export const keyIndex = (id: string) => KEYFRAMES.findIndex((k) => k.id === id)
export const keyU = (id: string) => keyIndex(id) * SEG

const v3 = (p: Vec3) => new Vector3(p[0], p[1], p[2])
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The logo's path through all worlds (same on every device). */
export const logoCurve = new CatmullRomCurve3(
  KEYFRAMES.map((k) => v3(k.logo.position)),
  false,
  'centripetal',
)

/** Journey time of each agent node in chapter 03. */
export const STUDIO_NODE_U = STUDIO_NODE_OFFSETS.map((o) => keyU('studio') + o * SEG)

/**
 * Remaps raw scroll progress through the stops' [start, end] ranges.
 * Inside a range the journey holds still on its keyframe; between ranges it is
 * piecewise linear (the snap transition supplies the easing).
 */
export function progressToU(progress: number, anchors: [number, number][]) {
  const n = anchors.length
  for (let i = 0; i < n; i++) {
    const [start, end] = anchors[i]
    if (progress <= end) {
      if (i === 0 || progress >= start) return i / (n - 1)
      const prevEnd = anchors[i - 1][1]
      return (i - 1 + (progress - prevEnd) / Math.max(start - prevEnd, 1e-6)) / (n - 1)
    }
  }
  return 1
}

/** 0 at a stop, rising to 1 as a transition reaches the next stop. */
export function transitionFraction(u: number) {
  const f = Math.min(Math.max(u, 0), 1) * (KEY_COUNT - 1)
  return f - Math.min(Math.floor(f), KEY_COUNT - 2)
}

/** Builds the camera splines + per-keyframe values and returns a sampler. */
export function createSampler(mobile: boolean) {
  const cams = KEYFRAMES.map((k) => (mobile ? k.cameraMobile : k.camera))
  const camCurve = new CatmullRomCurve3(cams.map((c) => v3(c.position)), false, 'centripetal')
  const targetCurve = new CatmullRomCurve3(cams.map((c) => v3(c.target)), false, 'centripetal')

  const quats = KEYFRAMES.map((k) => new Quaternion().setFromEuler(new Euler(...k.logo.rotation)))
  const tints = KEYFRAMES.map((k) => resolveColor(k.logo.tint))
  const emissives = KEYFRAMES.map((k) => resolveColor(k.logo.emissive))
  const skyTops = KEYFRAMES.map((k) => resolveColor(k.sky.top))
  const skyBottoms = KEYFRAMES.map((k) => resolveColor(k.sky.bottom))

  const blend = (out: Color, list: Color[], i: number, t: number) => out.copy(list[i]).lerp(list[i + 1], t)

  return {
    camCurve,
    targetCurve,
    sample(u: number, out: JourneySample) {
      const uc = Math.min(Math.max(u, 0), 1)
      const f = uc * (KEY_COUNT - 1)
      const i = Math.min(Math.floor(f), KEY_COUNT - 2)
      const t = f - i
      const e = smooth(t)
      const a = KEYFRAMES[i]
      const b = KEYFRAMES[i + 1]

      // Spatial values ride the splines linearly in u.
      camCurve.getPoint(uc, out.camPos)
      targetCurve.getPoint(uc, out.camTarget)
      logoCurve.getPoint(uc, out.logoPos)

      // Look values settle into each keyframe.
      out.logoQuat.slerpQuaternions(quats[i], quats[i + 1], e)
      // A full turntable spin plus a gentle bank per transition. Both are zero
      // at t = 0 and t = 1, so every keyframe pose is untouched.
      const dir = i % 2 === 0 ? 1 : -1
      const sp = spinProgress(t)
      spinEuler.set(0, MOTION.spin.turns * Math.PI * 2 * sp * dir, Math.sin(Math.PI * sp) * MOTION.spin.roll * dir)
      out.logoQuat.multiply(spinQuat.setFromEuler(spinEuler))
      out.logoScale = lerp(a.logo.scale, b.logo.scale, e)
      blend(out.tint, tints, i, e)
      blend(out.emissive, emissives, i, e)
      out.emissiveIntensity = lerp(a.logo.emissiveIntensity, b.logo.emissiveIntensity, e)
      out.glow = lerp(a.logo.glow, b.logo.glow, e)
      blend(out.skyTop, skyTops, i, e)
      blend(out.skyBottom, skyBottoms, i, e)
      out.fogNear = lerp(a.fog[0], b.fog[0], e)
      out.fogFar = lerp(a.fog[1], b.fog[1], e)
      return out
    },
  }
}

export type Sampler = ReturnType<typeof createSampler>

/** 0 far away → 1 when the journey is within `inner` segments of a keyframe. */
export function presence(u: number, key: number, inner = 0.55, outer = 0.95) {
  const d = Math.abs(u - key) / SEG
  if (d <= inner) return 1
  if (d >= outer) return 0
  return 1 - smooth((d - inner) / (outer - inner))
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}
