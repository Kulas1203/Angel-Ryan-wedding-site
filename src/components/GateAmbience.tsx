import { useEffect, useRef } from 'react'

/**
 * Everything around the envelope: the dark it is discovered out of, the light
 * it sits in, the air moving in front of it, and the moment the seal gives.
 *
 * None of it touches the envelope. Every layer is behind or in front of the
 * canvas, so the object itself renders exactly as it did without any of this.
 *
 * Three ideas do most of the work:
 *
 *   the curtain   the frame comes up out of near-dark, so the envelope is
 *                 found rather than switched on
 *   parallax      the air in front and the light behind move against each
 *                 other under the pointer, which is what turns a flat stack
 *                 of gradients into a space with the envelope inside it
 *   long cycles   nothing repeats on a period anyone can catch: every layer
 *                 runs on a different prime-ish duration and starts partway
 *                 through, so the scene was already moving before anyone
 *                 arrived
 */

type Props = {
  /** Held back until the envelope is on screen. */
  ready: boolean
  opening: boolean
}

const MOTES = Array.from({ length: 18 }, (_, i) => ({
  // Coprime strides, so they never fall into rows or clumps.
  left: 5 + ((i * 37) % 90),
  top: 6 + ((i * 53) % 86),
  size: 2 + (i % 4),
  // Negative, so every mote is already partway through its drift.
  delay: -((i * 2.3) % 26),
  duration: 24 + (i % 5) * 5,
  drift: ((i % 7) - 3) * 2.6,
  dim: 0.3 + (i % 4) * 0.11,
  depth: 1 + (i % 3), // how hard it answers the pointer
}))

const LEAVES = Array.from({ length: 9 }, (_, i) => ({
  left: 4 + ((i * 41) % 92),
  size: 13 + (i % 4) * 5,
  delay: -((i * 6.1) % 38),
  duration: 34 + (i % 5) * 6,
  sway: ((i % 5) - 2) * 7,
  spin: 180 + (i % 4) * 140 * (i % 2 ? 1 : -1),
  dim: 0.2 + (i % 3) * 0.09,
}))

// Motes off the wax, on five drifts so no two leave together.
const SPARKS = Array.from({ length: 30 }, (_, i) => i)

export function GateAmbience({ ready, opening }: Props) {
  const auraRef = useRef<HTMLDivElement>(null)

  // The pointer moves the layers against each other. The variables are set on
  // the gate itself and inherited, so the two halves of the parallax — one
  // behind the canvas, one in front — stay in step without React re-rendering
  // twenty-odd elements sixty times a second.
  useEffect(() => {
    const gate = auraRef.current?.closest('.gate') as HTMLElement | null
    if (!gate) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = 0
    let ty = 0
    let px = 0
    let py = 0
    let raf = 0

    const onPointer = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2
      ty = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      // Eased toward the pointer rather than pinned to it: the lag is what
      // reads as air having weight.
      px += (tx - px) * 0.045
      py += (ty - py) * 0.045
      gate.style.setProperty('--px', px.toFixed(4))
      gate.style.setProperty('--py', py.toFixed(4))
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      gate.style.removeProperty('--px')
      gate.style.removeProperty('--py')
    }
  }, [])

  return (
    <>
      {/* Behind the canvas. Its alpha lets these read as the ground. */}
      <div className="gate__aura" ref={auraRef} aria-hidden="true">
        <span className="gate__aura-pool gate__aura-pool--a" />
        <span className="gate__aura-pool gate__aura-pool--b" />
        <span className="gate__aura-pool gate__aura-pool--c" />
        {/* Leaves fall behind the envelope, which occludes them. In front of
            it they read as marks on the paper. */}
        {/* Shafts of light coming in across the frame, as though from a
            window above and to the left. */}
        <span className="gate__shaft gate__shaft--1" />
        <span className="gate__shaft gate__shaft--2" />
        <span className="gate__shaft gate__shaft--3" />

        {LEAVES.map((l, i) => (
          <span
            key={`l${i}`}
            className="gate__leaf"
            style={
              {
                left: `${l.left}%`,
                width: `${l.size}px`,
                height: `${l.size * 2.1}px`,
                '--dim': l.dim,
                '--sway': `${l.sway}vw`,
                '--spin': `${l.spin}deg`,
                animationDelay: `${l.delay}s`,
                animationDuration: `${l.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className={`gate__air ${ready ? 'is-lit' : ''}`} aria-hidden="true">
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
                '--depth': m.depth,
                animationDelay: `${m.delay}s`,
                animationDuration: `${m.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}

      </div>

      {/* A glint crossing the paper, once every thirteen seconds or so. */}
      <div className="gate__sheen" aria-hidden="true" />

      {/* Draws the eye to the wax while the envelope waits. It is the thing
          to press, and nothing else on screen says so. */}
      {!opening && <div className="gate__halo" aria-hidden="true" />}

      {/* Holds the middle while the envelope waits, and opens out as it
          gives. */}
      <div className="gate__vignette" aria-hidden="true" />

      {/* The frame comes up out of near-dark. */}
      <div className={`gate__curtain ${ready ? 'is-up' : ''}`} aria-hidden="true" />

      {opening && (
        <>
          <div className="gate__shock" aria-hidden="true" />
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
