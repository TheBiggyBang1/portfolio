import { useEffect, useRef } from 'react'
import { KEYFRAMES } from '../journey/config'
import { journey, segmentOf } from '../journey/store'

const fmt = (v: { x: number; y: number; z: number }) => `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`

/** Open the site with ?debug to see where you are on the journey while tuning config.ts. */
export function DebugPanel() {
  const ref = useRef<HTMLPreElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const seg = segmentOf(journey.u)
      const s = journey.sample
      if (ref.current) {
        ref.current.textContent = [
          `progress ${journey.progress.toFixed(4)}`,
          `u        ${journey.u.toFixed(4)}`,
          `keyframe ${KEYFRAMES[Math.round(seg)]?.id} (${seg.toFixed(2)})`,
          `camera   ${fmt(s.camPos)}`,
          `target   ${fmt(s.camTarget)}`,
          `logo     ${fmt(s.logoPos)}`,
          `stops    ${journey.anchors.map(([s, e]) => (e - s > 1e-4 ? `${s.toFixed(3)}–${e.toFixed(3)}` : s.toFixed(3))).join(' ')}`,
        ].join('\n')
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <pre ref={ref} className="debug" aria-hidden="true" />
}
