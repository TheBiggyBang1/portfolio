import { UI } from '../content/chapters'
import { HOME, LANG } from '../content/lang'
import { LogoMark } from './LogoMark'
import { RollingText } from './RollingText'

interface Props {
  menuOpen: boolean
  onToggleMenu: () => void
}

const OTHER = LANG === 'fr' ? 'en' : 'fr'

export function Nav({ menuOpen, onToggleMenu }: Props) {
  return (
    <header className="nav">
      <a className="nav__brand" href="#hello" aria-label={UI.home}>
        <LogoMark className="nav__logo" />
        <span className="nav__name">
          <RollingText text="Mehdi Handous" />
        </span>
      </a>
      <nav className="nav__actions" aria-label={UI.primaryNav}>
        <a className="nav__link nav__lang" href={HOME[OTHER]} hrefLang={OTHER} lang={OTHER} aria-label={UI.switchName}>
          <RollingText text={UI.switchLabel} />
        </a>
        <button
          type="button"
          className="nav__link"
          aria-expanded={menuOpen}
          aria-controls="chapter-menu"
          onClick={onToggleMenu}
        >
          <RollingText text={menuOpen ? UI.close : UI.chapters} />
        </button>
        <a className="btn btn--cta nav__cta" href="#contact">
          <RollingText text={UI.contact} />
        </a>
      </nav>
    </header>
  )
}
