/**
 * Hover effect: the word slides up and an identical copy rolls in from below,
 * letter by letter. The visual copies are hidden from screen readers.
 */
export function RollingText({ text }: { text: string }) {
  const chars = Array.from(text)
  const line = (
    <span className="roll__line">
      {chars.map((ch, i) => (
        <span key={i} className="roll__char" style={{ ['--i' as string]: i }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
  return (
    <span className="roll">
      <span className="sr-only">{text}</span>
      <span className="roll__inner" aria-hidden="true">
        {line}
        {line}
      </span>
    </span>
  )
}
