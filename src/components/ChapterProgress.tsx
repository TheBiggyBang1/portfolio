import { useEffect, useRef } from 'react'
import { CHAPTERS } from '../content/chapters'
import { KEYFRAMES } from '../journey/config'
import { journey, segmentOf, useJourney } from '../journey/store'

/** Keyframe index → chapter index (the gallery and the final rest belong to chapter 07). */
const CHAPTER_OF_KEY = KEYFRAMES.map((k) => Math.max(0, CHAPTERS.findIndex((c) => c.id === (k.chapter ?? k.id))))

/** Side indicator: current chapter number, a thin progress line and the total. */
export function ChapterProgress() {
  const index = useJourney(() => CHAPTER_OF_KEY[Math.round(segmentOf(journey.u))] ?? 0)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      root.current?.style.setProperty('--p', journey.progress.toFixed(4))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const chapter = CHAPTERS[index]
  return (
    <div ref={root} className="progress" aria-hidden="true">
      <span className="progress__current">
        <span key={chapter.number} className="progress__num">
          {chapter.number}
        </span>
      </span>
      <span className="progress__track">
        <span className="progress__fill" />
      </span>
      <span className="progress__total">{CHAPTERS[CHAPTERS.length - 1].number}</span>
      <span className="progress__label">{chapter.label}</span>
    </div>
  )
}
