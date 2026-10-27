import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { lockScroll } from '../journey/scroll'
import { journey } from '../journey/store'
import { LogoMark } from './LogoMark'

interface Props {
  reduced: boolean
  /** Called when the 3D logo takes over: start the hero reveal. */
  onReveal: () => void
}

/** If WebGL never becomes ready, give up waiting after this long. */
const READY_TIMEOUT_MS = 10000

/**
 * logo.svg draws itself while a counter runs. When the 3D logo is ready the SVG
 * glides onto the 3D logo's projected position and crossfades into it.
 */
export function Preloader({ reduced, onReveal }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const logo = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const onRevealRef = useRef(onReveal)
  onRevealRef.current = onReveal
  const [gone, setGone] = useState(false)

  useEffect(() => {
    // Already handed off (e.g. the motion preference changed later): nothing to run.
    const el = root.current
    if (!el) return
    lockScroll(true)
    const shapes = el.querySelectorAll<SVGGeometryElement>('.preloader__logo path, .preloader__logo circle')
    const drawTime = reduced ? 0.3 : 1.9
    const start = performance.now()
    const state = { shown: 0 }
    let finished = false

    const ctx = gsap.context(() => {
      shapes.forEach((s) => {
        const len = s.getTotalLength()
        gsap.set(s, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 })
      })
      gsap.to(shapes, { strokeDashoffset: 0, duration: drawTime, ease: 'power2.inOut', stagger: 0.18 })
    }, el)

    const handoff = () => {
      ctx.add(() => {
        const box = logo.current!.getBoundingClientRect()
        const target = journey.logoScreen
        const tl = gsap.timeline({
          onComplete: () => {
            lockScroll(false)
            setGone(true)
          },
        })
        tl.to(shapes, { fillOpacity: 1, duration: 0.5, ease: 'power1.out' })
        tl.to('.preloader__meta', { autoAlpha: 0, y: 12, duration: 0.45, ease: 'power2.in' }, '<')
        if (!reduced && journey.ready && target.w > 8) {
          tl.to(logo.current, {
            x: target.x - (box.left + box.width / 2),
            y: target.y - (box.top + box.height / 2),
            scale: target.w / box.width,
            duration: 1.05,
            ease: 'power3.inOut',
          })
        }
        tl.to('.preloader__bg', { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, '>-0.15')
        tl.to(journey, { logoOpacity: 1, duration: 0.7, ease: 'power1.inOut' }, '<0.1')
        tl.to(logo.current, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut' }, '<0.15')
        tl.add(() => {
          gsap.to(journey, { intro: 1, duration: reduced ? 0 : 3.8, ease: 'power2.out' })
          onRevealRef.current()
        }, '<')
      })
    }

    const tick = () => {
      const elapsed = performance.now() - start
      const timeShare = Math.min(elapsed / (drawTime * 1000), 1) * 100
      const timedOut = elapsed > READY_TIMEOUT_MS
      const loadShare = journey.ready || timedOut ? 100 : Math.min(journey.loadProgress, 92)
      const target = Math.min(timeShare, loadShare)
      // Frame-rate independent easing (deltaRatio is 1 at 60fps).
      state.shown += (target - state.shown) * (1 - Math.pow(0.86, gsap.ticker.deltaRatio()))
      if (Math.abs(target - state.shown) < 0.4) state.shown = target
      if (count.current) count.current.textContent = String(Math.round(state.shown)).padStart(3, '0')
      if (!finished && state.shown >= 100) {
        finished = true
        if (!journey.ready) document.documentElement.classList.add('no-webgl')
        gsap.ticker.remove(tick)
        handoff()
      }
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      ctx.revert()
    }
  }, [reduced])

  if (gone) return null

  return (
    <div ref={root} className="preloader" role="status" aria-live="polite" aria-label="Loading the story">
      <div className="preloader__bg" />
      <div ref={logo} className="preloader__logo">
        <LogoMark variant="gradient" />
      </div>
      <div className="preloader__meta" aria-hidden="true">
        <span className="preloader__caption">
          Mehdi Handous
          <br />
          <em>a story in seven chapters</em>
        </span>
        <span ref={count} className="preloader__count">
          000
        </span>
      </div>
    </div>
  )
}
