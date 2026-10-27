import type { ReactNode } from 'react'
import { isPlaceholder, type Chapter } from '../../content/chapters'
import { RichTitle } from '../RichTitle'
import { RollingText } from '../RollingText'

interface Props {
  chapter: Chapter
  theme?: 'dark'
  children?: ReactNode
}

export function ProjectLink({ href, label }: { href: string; label: string }) {
  const placeholder = isPlaceholder(href)
  return (
    <a
      className="btn link-cta"
      href={placeholder ? '#' : href}
      data-placeholder={placeholder ? href : undefined}
      title={placeholder ? `Placeholder: replace ${href} in src/content/chapters.ts` : undefined}
      target={placeholder ? undefined : '_blank'}
      rel={placeholder ? undefined : 'noreferrer'}
    >
      <RollingText text={label} />
      <span className="link-cta__arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  )
}

/**
 * One chapter of the story. [data-anchor] marks the block the 3D journey syncs to;
 * [data-reveal] elements animate in as a group when the chapter enters.
 */
export function ChapterSection({ chapter, theme, children }: Props) {
  const titleId = `${chapter.id}-title`
  return (
    <section id={chapter.id} className="chapter" data-theme={theme} aria-labelledby={titleId}>
      <div className="chapter__content" data-anchor data-reveal-group>
        <p className="chapter__label" data-reveal="fade">
          Chapter {chapter.number} — {chapter.label}
        </p>
        <h2 id={titleId} className="chapter__title" data-reveal="lines">
          <RichTitle text={chapter.title} />
        </h2>
        <div className="chapter__body">
          {chapter.body.map((p, i) => (
            <p key={i} data-reveal="lines">
              {p}
            </p>
          ))}
        </div>
        {children}
        {(chapter.tags || chapter.links) && (
          <div className="chapter__meta" data-reveal="fade">
            {chapter.tags && (
              <ul className="tags" aria-label="Technologies">
                {chapter.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {chapter.links?.map((link, i) =>
              i === 0 ? (
                <ProjectLink key={link.href} href={link.href} label={link.label} />
              ) : (
                <a key={link.href} className="link-text" href={link.href} target="_blank" rel="noreferrer">
                  <RollingText text={link.label} />
                  <span className="link-cta__arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  )
}
