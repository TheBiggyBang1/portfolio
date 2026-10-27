import { useEffect, useRef, useState } from 'react'
import { Color, Quaternion, Vector3 } from 'three'
import { KEYFRAMES } from './config'

/** Everything the frame loop reads/writes. Mutable on purpose: no React renders per frame. */
export interface JourneySample {
  camPos: Vector3
  camTarget: Vector3
  logoPos: Vector3
  logoQuat: Quaternion
  logoScale: number
  tint: Color
  emissive: Color
  emissiveIntensity: number
  glow: number
  skyTop: Color
  skyBottom: Color
  fogNear: number
  fogFar: number
}

export const journey = {
  /** Raw scroll progress 0..1 (from Lenis or native scroll). */
  progress: 0,
  scrollPx: 0,
  limitPx: 1,
  /** Scroll-progress [start, end] range in which each keyframe holds (measured from the DOM). */
  anchors: KEYFRAMES.map((_, i): [number, number] => [i / (KEYFRAMES.length - 1), i / (KEYFRAMES.length - 1)]),
  /** Journey time 0..1: progress remapped piecewise-linearly through the anchors. */
  u: 0,
  mobile: false,
  reduced: false,
  /** 0..1 driven by the preloader: 3D logo fade-in, then the rise out of the clouds. */
  logoOpacity: 0,
  intro: 0,
  /** True once the 3D logo has rendered at least once. */
  ready: false,
  /** Asset loading progress 0..100 (written by the 3D chunk once it has loaded). */
  loadProgress: 0,
  /** Animation clock in seconds (frozen in reduced-motion mode). */
  time: 0,
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  /** Current world position of the logo, for scenes that react to it. */
  logoPosition: new Vector3(),
  /** Current halo/light strength (keyframe glow × visibility). */
  logoGlow: 0,
  /** Projected logo rect in CSS px (used by the preloader hand-off). */
  logoScreen: { x: 0, y: 0, w: 0, h: 0 },
  /** 0..1 flight onto the footer logo, and the 3D→2D crossfade. */
  endBlend: 0,
  endFade: 0,
  sample: {
    camPos: new Vector3(),
    camTarget: new Vector3(),
    logoPos: new Vector3(),
    logoQuat: new Quaternion(),
    logoScale: 1,
    tint: new Color(),
    emissive: new Color(),
    emissiveIntensity: 0,
    glow: 0,
    skyTop: new Color(),
    skyBottom: new Color(),
    fogNear: 10,
    fogFar: 40,
  } as JourneySample,
}

if (import.meta.env.DEV) (window as unknown as { __journey: typeof journey }).__journey = journey

/** Keyframe position along the journey: u * (keyframes - 1). */
export const segmentOf = (u: number) => u * (KEYFRAMES.length - 1)

/**
 * Subscribe a React component to a derived journey value. The selector runs
 * every animation frame but the component only re-renders when the result changes.
 */
export function useJourney<T>(select: () => T): T {
  const selectRef = useRef(select)
  selectRef.current = select
  const [value, setValue] = useState(select)
  const last = useRef(value)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const next = selectRef.current()
      if (!Object.is(next, last.current)) {
        last.current = next
        setValue(() => next)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return value
}
