import { KEYFRAMES, MOTION } from './config'

/** A snap stop: the scroll range (px) in which its keyframe holds still. */
export interface Stop {
  id: string
  start: number
  end: number
}

/** Space kept below a section's content when its stop is a reading zone. */
const BOTTOM_MARGIN = { desktop: 32, mobile: 72 }

/**
 * Measures one stop per keyframe from the DOM.
 * - start: the scroll position where the section's [data-anchor] block reaches
 *   its anchor rule (MOTION.anchor, or the keyframe's own `anchor`).
 * - end: equal to start when the content fits on screen; otherwise far enough
 *   to read to its bottom (a "reading zone" where the 3D stays still).
 */
export function measureStops(mobile: boolean): Stop[] {
  const vh = window.innerHeight
  const max = Math.max(document.documentElement.scrollHeight - vh, 0)
  const margin = mobile ? BOTTOM_MARGIN.mobile : BOTTOM_MARGIN.desktop
  const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY
  const navClearance = (document.querySelector('.nav')?.getBoundingClientRect().height ?? 72) + 12

  const stops = KEYFRAMES.map((k, i): Stop => {
    if (k.at === 'start') return { id: 'hello', start: 0, end: 0 }
    if (k.at === 'end') {
      // The last stop holds contact + footer; it's a zone only if they don't fit.
      const contact = document.getElementById('contact')
      const start = contact ? Math.min(max, docTop(contact) - vh * 0.06) : max
      return { id: k.id, start, end: max }
    }
    const section = document.getElementById(k.at)
    const el = section?.querySelector<HTMLElement>('[data-anchor]') ?? section
    if (!el) return { id: k.id, start: (i / (KEYFRAMES.length - 1)) * max, end: (i / (KEYFRAMES.length - 1)) * max }
    const rule = k.anchor ?? (mobile ? MOTION.anchor.mobile : MOTION.anchor.desktop)
    const top = docTop(el)
    const height = el.getBoundingClientRect().height
    let start = top + (rule.edge === 'center' ? height / 2 : 0) - vh * rule.ratio
    // Too tall to center without sliding under the nav: line its top up just below the nav instead.
    if (rule.edge === 'center' && start > top - navClearance) start = top - navClearance
    const end = Math.max(start, top + height + margin - vh)
    return { id: k.at, start, end }
  })

  // Clamp to the page and keep stops strictly ordered.
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i]
    s.start = Math.min(Math.max(s.start, 0), max)
    s.end = Math.min(Math.max(s.end, s.start), max)
    if (i > 0) {
      const prev = stops[i - 1]
      if (s.start <= prev.end) s.start = Math.min(prev.end + 1, max)
      s.end = Math.max(s.end, s.start)
    }
  }
  return stops
}

/** Stops as scroll-progress ranges, for the journey's progress → u mapping. */
export function stopsToAnchors(stops: Stop[]): [number, number][] {
  const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
  return stops.map((s) => [s.start / max, s.end / max])
}
