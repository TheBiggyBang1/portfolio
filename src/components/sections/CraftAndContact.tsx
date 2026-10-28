import { useEffect, useRef } from 'react'
import { CHAPTERS, CONTACT, GALLERY, isPlaceholder, PROFILE, UI } from '../../content/chapters'
import { journey } from '../../journey/store'
import { LogoMark } from '../LogoMark'
import { RichTitle } from '../RichTitle'
import { RollingText } from '../RollingText'
import { ChapterSection } from './ChapterSection'

function SocialLink({ href, label }: { href: string; label: string }) {
  const placeholder = isPlaceholder(href)
  return (
    <a
      className="contact__link"
      href={placeholder ? '#' : href}
      data-placeholder={placeholder ? href : undefined}
      title={placeholder ? `Placeholder: replace ${href} in src/content/chapters.ts` : undefined}
      target={placeholder ? undefined : '_blank'}
      rel={placeholder ? undefined : 'noreferrer'}
    >
      <RollingText text={label} />
    </a>
  )
}

/** Chapter 07: craft text, a gallery grid and the contact block. */
export function CraftAndContact() {
  const emailPlaceholder = isPlaceholder(PROFILE.email)

  return (
    <>
      <ChapterSection chapter={CHAPTERS[6]} />

      <section id="gallery" className="gallery-section" aria-label={UI.gallery}>
        <ul className="gallery" data-anchor data-reveal-group>
          {GALLERY.map((item, i) => (
            <li key={item.title} className={`tile tile--${item.fit}`} data-reveal="fade" style={{ ['--i' as string]: i }}>
              <a className="tile__link" href={item.href} target="_blank" rel="noreferrer">
                <img className="tile__img" src={item.image} alt={item.alt} loading="lazy" decoding="async" />
                <span className="tile__kind">{item.kind}</span>
                <span className="tile__title">{item.title}</span>
                <span className="tile__cta">
                  {item.cta} <span aria-hidden="true">↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section id="contact" className="contact" aria-labelledby="contact-title">
        <div className="contact__inner" data-reveal-group>
          <p className="chapter__label" data-reveal="fade">
            {CONTACT.label}
          </p>
          <h2 id="contact-title" className="contact__title" data-reveal="lines">
            <RichTitle text={CONTACT.title} />
          </h2>
          <p className="contact__text" data-reveal="lines">
            {CONTACT.text}
          </p>
          <div className="contact__actions" data-reveal="fade">
            <a
              className="btn btn--cta btn--large"
              href={emailPlaceholder ? '#' : `mailto:${PROFILE.email}`}
              data-placeholder={emailPlaceholder ? PROFILE.email : undefined}
              title={emailPlaceholder ? 'Placeholder: replace [EMAIL] in src/content/chapters.ts' : undefined}
            >
              <RollingText text={CONTACT.write} />
            </a>
            <SocialLink href={PROFILE.linkedin} label="LinkedIn" />
            <SocialLink href={PROFILE.github} label="GitHub" />
          </div>
        </div>
      </section>
    </>
  )
}

/** The footer holds the 2D logo the 3D logo lands on and crossfades into. */
export function Footer() {
  const rest = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (rest.current) rest.current.style.opacity = journey.endFade.toFixed(3)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <footer className="footer">
        <div ref={rest} className="footer__rest" data-logo-rest>
          <LogoMark variant="gradient" title={UI.logo} />
        </div>
        <div className="footer__bar">
          <span>© {new Date().getFullYear()} {PROFILE.name}</span>
          <a href="#hello" className="footer__top">
            <RollingText text={UI.backToTop} />
          </a>
        </div>
      </footer>
    </>
  )
}
