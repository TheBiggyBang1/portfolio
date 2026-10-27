import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState } from 'react'
import { DARIJA_SAMPLE } from '../../content/chapters'

/** "Darija → text": a transcript types itself when the caption scrolls into view. */
export function TypedCaption({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null)
  const chars = Array.from(DARIJA_SAMPLE.transcript)
  const [shown, setShown] = useState(reduced ? chars.length : 0)

  useEffect(() => {
    if (reduced) {
      setShown(chars.length)
      return
    }
    const state = { n: 0 }
    let tween: gsap.core.Tween | null = null
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 85%',
      onEnter: () => {
        tween?.kill()
        state.n = 0
        tween = gsap.to(state, {
          n: chars.length,
          duration: chars.length * 0.075,
          delay: 0.5,
          ease: 'none',
          onUpdate: () => setShown(Math.round(state.n)),
        })
      },
      onLeaveBack: () => {
        tween?.kill()
        setShown(0)
      },
    })
    return () => {
      st.kill()
      tween?.kill()
    }
  }, [reduced, chars.length])

  return (
    <figure ref={root} className="caption" data-reveal="fade">
      <div className="caption__row" aria-hidden="true">
        <span className="caption__wave">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ ['--i' as string]: i }} />
          ))}
        </span>
        <span>{DARIJA_SAMPLE.audioLabel}</span>
        <span className="caption__arrow">→</span>
        <span>text</span>
      </div>
      <p className="caption__out" dir="rtl" lang="aeb" aria-label={DARIJA_SAMPLE.transcript}>
        <span aria-hidden="true">{chars.slice(0, shown).join('')}</span>
        <span className="caption__caret" aria-hidden="true" />
      </p>
      <figcaption className="caption__gloss">
        {DARIJA_SAMPLE.gloss} <span className="caption__note">{DARIJA_SAMPLE.note}</span>
      </figcaption>
    </figure>
  )
}
