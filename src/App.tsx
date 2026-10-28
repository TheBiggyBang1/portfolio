import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ChapterMenu } from './components/ChapterMenu'
import { ChapterProgress } from './components/ChapterProgress'
import { DebugPanel } from './components/DebugPanel'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { useReveals } from './components/reveal'
import { AgentPipeline } from './components/sections/AgentPipeline'
import { ChapterSection } from './components/sections/ChapterSection'
import { CraftAndContact, Footer } from './components/sections/CraftAndContact'
import { Hello } from './components/sections/Hello'
import { MindsetPoints } from './components/sections/MindsetPoints'
import { TypedCaption } from './components/sections/TypedCaption'
import { CHAPTERS, UI } from './content/chapters'
import { keyIndex } from './journey/curves'
import { measureStops, stopsToAnchors } from './journey/anchors'
import { initScroll, scrollToId, setStops } from './journey/scroll'
import { journey, segmentOf, useJourney } from './journey/store'
import { useIsMobile, useReducedMotion } from './lib/device'

// three.js and the scenes load as their own chunk while the preloader runs.
const Experience = lazy(() => import('./scenes/World'))

const debug = new URLSearchParams(window.location.search).has('debug')
const MINDSET = keyIndex('mindset')

export default function App() {
  const reduced = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('reduced', reduced)
    return initScroll(reduced)
  }, [reduced])

  useReveals(revealed, reduced)

  // Stops follow the DOM: re-measure whenever layout may have changed.
  const mobile = useIsMobile()
  useEffect(() => {
    const update = () => {
      const stops = measureStops(mobile)
      journey.anchors = stopsToAnchors(stops)
      setStops(stops)
    }
    const ro = new ResizeObserver(update)
    ro.observe(document.body)
    window.addEventListener('resize', update)
    document.fonts?.ready.then(update)
    update()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [mobile])

  // Chapter 06 happens at dusk: flip the UI to dark ink while it is on screen.
  const dark = useJourney(() => Math.abs(segmentOf(journey.u) - MINDSET) < 0.5)
  useEffect(() => {
    if (dark) document.documentElement.dataset.theme = 'dark'
    else delete document.documentElement.dataset.theme
  }, [dark])

  // In-page links ride the journey (Lenis) instead of jumping.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a')
      if (!a) return
      if (a.hasAttribute('data-placeholder')) {
        e.preventDefault()
        return
      }
      const href = a.getAttribute('href') ?? ''
      if (!href.startsWith('#') || href.length < 2) return
      e.preventDefault()
      setMenuOpen(false)
      requestAnimationFrame(() => scrollToId(href.slice(1)))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Deep links (#vision) work once the intro is done.
  useEffect(() => {
    if (!revealed || !window.location.hash) return
    const id = window.location.hash.slice(1)
    const t = window.setTimeout(() => scrollToId(id), 400)
    return () => window.clearTimeout(t)
  }, [revealed])

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const onReveal = useCallback(() => setRevealed(true), [])

  return (
    <>
      <a className="skip-link" href="#voice">
        {UI.skipIntro}
      </a>
      <div className="webgl" aria-hidden="true">
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </div>

      <Nav menuOpen={menuOpen} onToggleMenu={toggleMenu} />
      <ChapterMenu open={menuOpen} onClose={closeMenu} />
      <ChapterProgress />

      <main id="main">
        <Hello />
        <ChapterSection chapter={CHAPTERS[1]}>
          <TypedCaption reduced={reduced} />
        </ChapterSection>
        <ChapterSection chapter={CHAPTERS[2]}>
          <AgentPipeline />
        </ChapterSection>
        <ChapterSection chapter={CHAPTERS[3]} />
        <ChapterSection chapter={CHAPTERS[4]} />
        <ChapterSection chapter={CHAPTERS[5]} theme="dark">
          <MindsetPoints />
        </ChapterSection>
        <CraftAndContact />
      </main>
      <Footer />

      <Preloader reduced={reduced} onReveal={onReveal} />
      {debug && <DebugPanel />}
    </>
  )
}
