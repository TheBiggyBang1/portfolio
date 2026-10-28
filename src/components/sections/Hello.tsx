import { CHAPTERS, UI } from '../../content/chapters'
import { RichTitle } from '../RichTitle'

export function Hello() {
  const c = CHAPTERS[0]
  return (
    <section id="hello" className="chapter chapter--hello" aria-labelledby="hello-title">
      <div className="hello" data-reveal-group="hero">
        <p className="chapter__label hello__label" data-reveal="fade">
          {UI.chapter} {c.number} — {c.label}
        </p>
        <h1 id="hello-title" className="hello__title" data-reveal="lines">
          <RichTitle text={c.title} />
        </h1>
        <div className="hello__intro">
          {c.body.map((p, i) => (
            <p key={i} data-reveal="lines">
              {p}
            </p>
          ))}
        </div>
        <div className="hello__scroll" data-reveal="fade" aria-hidden="true">
          <span>{UI.scroll}</span>
          <span className="hello__scroll-line" />
        </div>
      </div>
    </section>
  )
}
