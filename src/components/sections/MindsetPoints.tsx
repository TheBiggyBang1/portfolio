import { MINDSET_POINTS } from '../../content/chapters'

export function MindsetPoints() {
  return (
    <ul className="points" data-reveal="fade">
      {MINDSET_POINTS.map((p, i) => (
        <li key={p.title}>
          <span className="points__num">0{i + 1}</span>
          <strong>{p.title}</strong>
          <span>{p.text}</span>
        </li>
      ))}
    </ul>
  )
}
