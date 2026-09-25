/**
 * Everything around the envelope: the light it sits in, the dust in the air,
 * the glint that crosses the paper, and the burst when the seal gives.
 *
 * None of it touches the envelope. It is all behind or in front of the
 * canvas, so the object itself renders exactly as it did before.
 *
 * The motes are the part that does the work. Sixteen specks on long, unequal
 * cycles, each started mid-flight by a negative delay — without that they all
 * begin at the same phase and the first half-minute reads as a loop starting
 * rather than as air that was already moving before anyone arrived.
 */

type Props = {
  /** Held back until the envelope is on screen. */
  ready: boolean
  opening: boolean
}

const MOTES = Array.from({ length: 16 }, (_, i) => ({
  // Spread on coprime strides, so they never fall into rows or clumps.
  left: 5 + ((i * 37) % 90),
  top: 6 + ((i * 53) % 86),
  size: 2 + (i % 4),
  // Negative, so every mote is already partway through its drift.
  delay: -((i * 2.3) % 26),
  duration: 24 + (i % 5) * 5,
  drift: ((i % 7) - 3) * 2.6,
  dim: 0.3 + (i % 4) * 0.11,
}))

// Twenty-eight motes off the wax, on five drifts so no two leave together.
const SPARKS = Array.from({ length: 28 }, (_, i) => i)

export function GateAmbience({ ready, opening }: Props) {
  return (
    <>
      {/* Slow pools of warm light behind the envelope. The canvas has an
          alpha channel, so these read through it as the ground it lies on. */}
      <div className="gate__aura" aria-hidden="true">
        <span className="gate__aura-pool gate__aura-pool--a" />
        <span className="gate__aura-pool gate__aura-pool--b" />
        <span className="gate__aura-pool gate__aura-pool--c" />
      </div>

      <div className={`gate__motes ${ready ? 'is-lit' : ''}`} aria-hidden="true">
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="gate__mote"
            style={
              {
                left: `${m.left}%`,
                top: `${m.top}%`,
                width: `${m.size}px`,
                height: `${m.size}px`,
                '--dim': m.dim,
                '--drift': `${m.drift}vmin`,
                animationDelay: `${m.delay}s`,
                animationDuration: `${m.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* A glint crossing the paper, once every twelve seconds or so. */}
      <div className="gate__sheen" aria-hidden="true" />

      {/* Draws the eye to the middle while the envelope waits, and opens out
          as it gives. */}
      <div className="gate__vignette" aria-hidden="true" />

      {opening && (
        <>
          <div className="gate__burst" aria-hidden="true" />
          <div className="gate__sparks" aria-hidden="true">
            {SPARKS.map((i) => (
              <span key={i} className={`gate__spark gate__spark--${i % 5}`} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
