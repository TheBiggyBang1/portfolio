import { LogoMark } from './LogoMark'
import { RollingText } from './RollingText'

interface Props {
  menuOpen: boolean
  onToggleMenu: () => void
}

export function Nav({ menuOpen, onToggleMenu }: Props) {
  return (
    <header className="nav">
      <a className="nav__brand" href="#hello" aria-label="Mehdi Handous, back to the beginning">
        <LogoMark className="nav__logo" />
        <span className="nav__name">
          <RollingText text="Mehdi Handous" />
        </span>
      </a>
      <nav className="nav__actions" aria-label="Primary">
        <button
          type="button"
          className="nav__link"
          aria-expanded={menuOpen}
          aria-controls="chapter-menu"
          onClick={onToggleMenu}
        >
          <RollingText text={menuOpen ? 'Close' : 'Chapters'} />
        </button>
        <a className="btn btn--cta nav__cta" href="#contact">
          <RollingText text="Contact" />
        </a>
      </nav>
    </header>
  )
}
