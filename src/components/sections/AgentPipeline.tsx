import { STUDIO_AGENTS, UI } from '../../content/chapters'
import { SEG, STUDIO_NODE_U } from '../../journey/curves'
import { journey, useJourney } from '../../journey/store'

/** The five agents as chips, lit in sync with the 3D gates the logo flies through. */
export function AgentPipeline() {
  const lit = useJourney(() => STUDIO_NODE_U.filter((u) => journey.u >= u - 0.03 * SEG).length)
  return (
    <ol className="pipeline" data-reveal="fade" aria-label={UI.pipeline}>
      {STUDIO_AGENTS.map((agent, i) => (
        <li key={agent} className={i < lit ? 'is-lit' : undefined}>
          <span className="pipeline__dot" aria-hidden="true" />
          {agent}
        </li>
      ))}
    </ol>
  )
}
