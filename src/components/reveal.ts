import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * Text reveals. Each [data-reveal-group] becomes one timeline:
 *  - data-reveal="lines": lines rise out of a mask, staggered
 *  - data-reveal="fade":  a soft fade-up
 * The hero group plays on load; the rest play when they scroll into view.
 * Reduced motion: plain opacity fades, no movement.
 */
export function useReveals(active: boolean, reduced: boolean) {
  useEffect(() => {
    if (!active) return

    if (reduced) {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return
            e.target.classList.add('is-revealed')
            io.unobserve(e.target)
          }),
        { rootMargin: '0px 0px -8% 0px' },
      )
      document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
      return () => io.disconnect()
    }

    let ctx: gsap.Context | null = null
    let splits: SplitText[] = []
    let built = false

    const build = () => {
      ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
          const tl = gsap.timeline({ paused: true })
          group.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
            const at = i === 0 ? 0 : '<0.1'
            if (el.dataset.reveal === 'lines') {
              const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' })
              splits.push(split)
              tl.from(split.lines, { yPercent: 115, duration: 1.15, ease: 'power4.out', stagger: 0.085 }, at)
            } else {
              tl.from(el, { autoAlpha: 0, y: 22, duration: 0.9, ease: 'power3.out' }, at)
            }
          })

          if (group.dataset.revealGroup === 'hero') {
            if (built) tl.progress(1)
            else tl.play()
            return
          }
          const st = ScrollTrigger.create({
            trigger: group,
            start: 'top 82%',
            onEnter: () => tl.play(),
            onLeaveBack: () => tl.reverse(),
          })
          if (st.start < window.scrollY) tl.progress(1)
        })
      })
      built = true
    }

    const teardown = () => {
      ctx?.revert()
      splits.forEach((s) => s.revert())
      splits = []
    }

    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      build()
      ScrollTrigger.refresh()
    })

    // Content height can change without a resize (fonts, images): keep trigger positions fresh.
    let lastHeight = document.body.scrollHeight
    let refreshTimer = 0
    const ro = new ResizeObserver(() => {
      if (document.body.scrollHeight === lastHeight) return
      lastHeight = document.body.scrollHeight
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    ro.observe(document.body)

    let width = window.innerWidth
    let timer = 0
    const onResize = () => {
      if (window.innerWidth === width) return
      width = window.innerWidth
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        teardown()
        build()
        ScrollTrigger.refresh()
      }, 250)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelled = true
      ro.disconnect()
      window.clearTimeout(refreshTimer)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(timer)
      teardown()
    }
  }, [active, reduced])
}
