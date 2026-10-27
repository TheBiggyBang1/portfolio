import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 767px), (pointer: coarse)'
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

/** `?motion=reduce` forces reduced-motion mode, handy for testing. */
function forcedReduced() {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('motion') === 'reduce'
}

export function isMobileNow() {
  return typeof matchMedia !== 'undefined' && matchMedia(MOBILE_QUERY).matches
}

export function isReducedNow() {
  return forcedReduced() || (typeof matchMedia !== 'undefined' && matchMedia(REDUCED_QUERY).matches)
}

function useMedia(query: string, initial: () => boolean, force = false) {
  const [value, setValue] = useState(initial)
  useEffect(() => {
    if (force) return
    const mq = matchMedia(query)
    const onChange = () => setValue(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query, force])
  return value
}

export function useIsMobile() {
  return useMedia(MOBILE_QUERY, isMobileNow)
}

export function useReducedMotion() {
  return useMedia(REDUCED_QUERY, isReducedNow, forcedReduced())
}

/** Instance-count multiplier for mobile. */
export function quality(isMobile: boolean) {
  return {
    count: isMobile ? 0.45 : 1,
    maxDpr: isMobile ? 1.5 : 2,
  }
}
