import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import type { Stop } from './anchors'
import { MOTION } from './config'
import { journey } from './store'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let locked = false

/*
 * Section snapping
 * ────────────────
 * The page rests on "stops" (one per keyframe, measured in anchors.ts). One wheel
 * notch, swipe or key press plays a single cinematic transition to the next stop;
 * input is ignored while it plays. A stop whose content is taller than the screen
 * is a reading zone: you scroll through it first, then the next gesture moves on.
 */
let stops: Stop[] = []
let current = 0
let transitioning = false
let safetyTimer = 0
let settleTimer = 0
/** The gesture that started a transition (or hit a zone edge) is spent; its tail is ignored. */
let gestureSpent = false
let intent = 0
let lastWheelAt = 0
let lastWheelMag = 0
let lastTouchDelta = 0
/**
 * The current swipe. Where it started decides what it does: a swipe that starts at
 * the edge of a stop plays the transition; one that starts mid-zone only scrolls the
 * text, stopping at the edge, so the *next* swipe moves on.
 */
const swipe = { atStart: true, atEnd: true, total: 0, done: false }
/** Pixels of slack when deciding a reading zone's edge is reached (layout can shift a little). */
const EDGE = 8

const cinematic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function write(scroll: number, limit: number) {
  journey.scrollPx = scroll
  journey.limitPx = Math.max(limit, 1)
  journey.progress = limit > 0 ? Math.min(Math.max(scroll / limit, 0), 1) : 0
}

function nearestStop(y: number) {
  let best = 0
  let bestDist = Infinity
  stops.forEach((s, i) => {
    const d = y < s.start ? s.start - y : y > s.end ? y - s.end : 0
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

/**
 * Plays the transition to a stop. Scrolling back up lands at the bottom of a reading
 * zone (as if reading backwards); jumps (menu, links) always open a section at its top.
 * Settling back into the current stop returns to its nearest edge.
 */
function goTo(index: number, duration?: number, jump = false) {
  if (!lenis || stops.length === 0) return
  const i = Math.min(Math.max(index, 0), stops.length - 1)
  const from = current
  const s = stops[i]
  const target = jump
    ? s.start
    : i === from
      ? Math.min(Math.max(lenis.scroll, s.start), s.end)
      : i < from
        ? s.end
        : s.start
  current = i
  if (Math.abs(target - lenis.scroll) < 1) return
  const hops = Math.max(1, Math.abs(i - from))
  const d = duration ?? Math.min(MOTION.snap.maxDuration, MOTION.snap.duration + (hops - 1) * 0.35)
  transitioning = true
  const done = () => {
    transitioning = false
    window.clearTimeout(safetyTimer)
  }
  window.clearTimeout(safetyTimer)
  safetyTimer = window.setTimeout(done, d * 1000 + 400)
  lenis.scrollTo(target, { duration: d, easing: cinematic, lock: true, force: true, onComplete: done })
}

/** Scrolls inside the current reading zone. Returns false if already at its edge in that direction. */
function scrollWithin(delta: number, immediate: boolean) {
  const stop = stops[current]
  if (!lenis || !stop || stop.end - stop.start < 1) return false
  const from = lenis.targetScroll
  if ((delta > 0 && from >= stop.end - 0.5) || (delta < 0 && from <= stop.start + 0.5)) return false
  const target = from + delta
  const clamped = Math.min(Math.max(target, stop.start), stop.end)
  // Reaching the edge ends this gesture: moving on takes a fresh one.
  if (clamped !== target) gestureSpent = true
  lenis.scrollTo(clamped, immediate ? { immediate: true } : {})
  return true
}

function onVirtualScroll({ deltaY, event }: { deltaY: number; event: WheelEvent | TouchEvent }) {
  if (!lenis || stops.length === 0 || event.ctrlKey || lenis.isStopped) return true
  const type = event.type
  // We drive the page ourselves. Never cancel touchstart/touchend: taps must still click.
  if (event.cancelable && (type === 'wheel' || type === 'touchmove')) event.preventDefault()

  if (type === 'touchstart') {
    const s = stops[current]
    const y = lenis.targetScroll
    swipe.atStart = !s || y <= s.start + EDGE
    swipe.atEnd = !s || y >= s.end - EDGE
    swipe.total = 0
    swipe.done = transitioning
    lastTouchDelta = 0
    return false
  }
  if (type === 'touchend') {
    // A little momentum inside a reading zone (clamped to its edge).
    if (!transitioning && !swipe.done) scrollWithin(lastTouchDelta * 10, false)
    return false
  }
  if (type === 'touchmove') {
    if (swipe.done || transitioning || deltaY === 0) return false
    swipe.total += deltaY
    lastTouchDelta = deltaY
    const dir = Math.sign(swipe.total)
    const s = stops[current]
    const y = lenis.targetScroll
    const fromEdge = dir > 0 ? swipe.atEnd && (!s || y >= s.end - EDGE) : swipe.atStart && (!s || y <= s.start + EDGE)
    if (!fromEdge) {
      scrollWithin(deltaY, true)
      return false
    }
    if (Math.abs(swipe.total) >= MOTION.snap.touchThreshold) {
      swipe.done = true
      goTo(current + dir)
    }
    return false
  }

  // Wheel: a pause in the stream, or a clearly harder flick once the transition is
  // over, starts a new gesture. Trackpad inertia (smoothly decaying) never does.
  const now = performance.now()
  const mag = Math.abs(deltaY)
  const paused = now - lastWheelAt > 220
  if (paused || (!transitioning && mag > lastWheelMag * 1.6 + 6)) gestureSpent = false
  if (paused) intent = 0
  lastWheelAt = now
  lastWheelMag = mag

  if (transitioning || gestureSpent || deltaY === 0) return false
  if (scrollWithin(deltaY, false)) return false

  intent = Math.sign(intent) === Math.sign(deltaY) ? intent + deltaY : deltaY
  if (Math.abs(intent) < MOTION.snap.wheelThreshold) return false
  const dir = Math.sign(intent)
  intent = 0
  gestureSpent = true
  goTo(current + dir)
  return false
}

function onKeyDown(e: KeyboardEvent) {
  if (!lenis || lenis.isStopped || stops.length === 0 || e.altKey || e.ctrlKey || e.metaKey) return
  const target = e.target as HTMLElement
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return
  let dir = 0
  switch (e.key) {
    case 'ArrowDown':
    case 'PageDown':
      dir = 1
      break
    case 'ArrowUp':
    case 'PageUp':
      dir = -1
      break
    case ' ':
      if (target.closest('a, button')) return
      dir = e.shiftKey ? -1 : 1
      break
    case 'Home':
    case 'End':
      e.preventDefault()
      if (!transitioning) goTo(e.key === 'Home' ? 0 : stops.length - 1)
      return
    default:
      return
  }
  e.preventDefault()
  if (transitioning) return
  if (scrollWithin(dir * window.innerHeight * 0.6, false)) return
  goTo(current + dir)
}

/** After a free scroll (scrollbar drag, find-in-page, focus), glide to the nearest stop. */
function settle() {
  if (!lenis || transitioning || lenis.isStopped || stops.length === 0) return
  const y = lenis.scroll
  const inside = stops.findIndex((s) => y >= s.start - 1 && y <= s.end + 1)
  if (inside >= 0) {
    current = inside
    return
  }
  // A short overshoot past the current stop (e.g. a native fling on a phone) means
  // "next": move on in that direction instead of bouncing back to where it started.
  const nearest = nearestStop(y)
  const s = stops[current]
  const push = MOTION.snap.touchThreshold
  const dir = nearest === current && s ? (y > s.end + push ? 1 : y < s.start - push ? -1 : 0) : 0
  if (dir) goTo(current + dir)
  else goTo(nearest, 0.9)
}

/**
 * Lenis smooths every scroll; GSAP's ticker drives it so ScrollTrigger stays in
 * lockstep. In reduced-motion mode we keep plain native scrolling, no snapping.
 */
export function initScroll(reduced: boolean) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  if (reduced) {
    const onScroll = () => write(window.scrollY, document.documentElement.scrollHeight - window.innerHeight)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }

  const instance = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.3,
    virtualScroll: onVirtualScroll,
  })
  lenis = instance
  current = 0
  transitioning = false
  instance.on('scroll', (l: Lenis) => {
    write(l.scroll, l.limit)
    ScrollTrigger.update()
    if (!transitioning) {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settle, 160)
    }
  })
  const raf = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  window.addEventListener('keydown', onKeyDown)
  write(instance.scroll, instance.limit)
  if (locked) instance.stop()

  return () => {
    gsap.ticker.remove(raf)
    window.removeEventListener('keydown', onKeyDown)
    window.clearTimeout(settleTimer)
    window.clearTimeout(safetyTimer)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}

/** Called whenever layout is re-measured. Keeps the current section exactly in place. */
export function setStops(next: Stop[]) {
  const prev = stops[current]
  stops = next
  if (!lenis || transitioning) return
  const y = lenis.scroll
  const i = prev ? stops.findIndex((s) => s.id === prev.id) : -1
  current = i >= 0 ? i : nearestStop(y)
  const s = stops[current]
  if (!s) return
  // Stay pinned to the same edge of the stop (text reveals and fonts shift layout).
  let target = Math.min(Math.max(y, s.start), s.end)
  if (prev && Math.abs(y - prev.start) < 2) target = s.start
  else if (prev && Math.abs(y - prev.end) < 2) target = s.end
  if (Math.abs(target - y) > 1) lenis.scrollTo(target, { immediate: true, force: true })
}

export function lockScroll(value: boolean) {
  locked = value
  document.documentElement.classList.toggle('is-locked', value)
  if (!lenis) return
  if (value) lenis.stop()
  else lenis.start()
}

/** Section ids that map onto a stop with a different id. */
const STOP_ALIASES: Record<string, string> = { contact: 'rest', main: 'hello' }

/**
 * Scrolls to a section. Chapter ids land exactly on their journey keyframe, so a
 * menu jump is one continuous camera flight through every world in between.
 */
export function scrollToId(id: string, immediate = false) {
  const el = document.getElementById(id)
  const stopId = STOP_ALIASES[id] ?? id
  const i = stops.findIndex((s) => s.id === stopId)
  const fallback = el ? el.getBoundingClientRect().top + window.scrollY : null

  if (lenis) {
    if (i >= 0 && !immediate) goTo(i, undefined, true)
    else if (i >= 0) {
      current = i
      lenis.scrollTo(stops[i].start, { immediate: true, force: true })
    } else if (fallback != null) lenis.scrollTo(fallback, { duration: 1.4, easing: cinematic, force: true })
  } else {
    const top = i >= 0 ? stops[i].start : fallback
    if (top != null) window.scrollTo({ top, behavior: 'auto' })
  }
  if (el && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el?.focus({ preventScroll: true })
}
