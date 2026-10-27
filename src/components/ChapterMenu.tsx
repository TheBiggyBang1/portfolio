import { useEffect, useRef } from 'react'
import { CHAPTERS } from '../content/chapters'
import { lockScroll } from '../journey/scroll'

interface Props {
  open: boolean
  onClose: () => void
}

/** Full-screen chapter index. Links are handled by the app-wide anchor handler. */
export function ChapterMenu({ open, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) {
      returnFocus.current?.focus()
      return
    }
    returnFocus.current = document.activeElement as HTMLElement
    lockScroll(true)
    const first = root.current?.querySelector<HTMLElement>('a')
    const t = window.setTimeout(() => first?.focus(), 350)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !root.current) return
      // Keep focus inside the dialog (plus the nav toggle that closes it).
      const toggle = document.querySelector<HTMLElement>('[aria-controls="chapter-menu"]')
      const focusables = [toggle, ...root.current.querySelectorAll<HTMLElement>('a')].filter(Boolean) as HTMLElement[]
      const i = focusables.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        focusables[focusables.length - 1].focus()
      } else if (!e.shiftKey && i === focusables.length - 1) {
        e.preventDefault()
        focusables[0].focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      lockScroll(false)
    }
  }, [open, onClose])

  return (
    <div
      ref={root}
      id="chapter-menu"
      className={`menu${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Chapters"
      aria-hidden={!open}
      inert={!open}
    >
      <ol className="menu__list">
        {CHAPTERS.map((c, i) => (
          <li key={c.id} className="menu__item" style={{ ['--i' as string]: i }}>
            <a className="menu__link" href={`#${c.id}`}>
              <span className="menu__num">{c.number}</span>
              <span className="menu__title">{c.label}</span>
              <span className="menu__line">{c.line}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}
