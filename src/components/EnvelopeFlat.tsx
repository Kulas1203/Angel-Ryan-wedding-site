import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { DaisyRelief } from './DaisyRelief'
import { lockScroll } from '../hooks/useSmoothScroll'
import './Envelope.css'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

// Beats of the opening, in seconds from the tap. The envelope fills the
// frame, so there is nowhere for a card to be drawn out to — instead the
// flap lifts and the light that was shut inside floods forward and takes
// over the screen.
const SEAL_AT = 0.12
const SEAL_DUR = 0.66
const FLAP_AT = 0.34
const FLAP_DUR = 1.05
const BLOOM_AT = 0.62
const PUSH_AT = 0.3
const REVEAL_AT = 1.85
const GATE_END_MS = 2700
const REDUCED_END_MS = 520

interface EnvelopeFlatProps {
  /** Fires as the light takes the frame, cueing the hero to begin. */
  onReveal: () => void
}

/**
 * The envelope drawn in CSS: folded planes, clip-paths and gradients.
 *
 * This is what runs when the scene cannot — no WebGL, or the guest has asked
 * for reduced motion, where a camera move and a turning flap are exactly the
 * wrong thing to serve. It is a picture of the same envelope rather than the
 * object, and it stands in without comment.
 */
export function EnvelopeFlat({ onReveal }: EnvelopeFlatProps) {
  const reduced = useReducedMotion()
  const [opening, setOpening] = useState(false)
  const [gone, setGone] = useState(false)

  // Kept in a ref so a fresh inline callback from App never restarts the
  // sequence partway through.
  const revealRef = useRef(onReveal)
  revealRef.current = onReveal

  // Hold the page at the top and still while the invitation is sealed.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    lockScroll(true)
    return () => lockScroll(false)
  }, [])

  useEffect(() => {
    if (!opening) return
    const timers: number[] = []
    const reveal = () => {
      lockScroll(false)
      revealRef.current()
    }

    if (reduced) {
      reveal()
      timers.push(window.setTimeout(() => setGone(true), REDUCED_END_MS))
    } else {
      timers.push(window.setTimeout(reveal, REVEAL_AT * 1000))
      timers.push(window.setTimeout(() => setGone(true), GATE_END_MS))
    }

    return () => timers.forEach(clearTimeout)
  }, [opening, reduced])

  if (gone) return null

  // Reduced motion keeps the envelope — it is content, not decoration — but
  // trades the whole sequence for a plain fade.
  const run = opening && !reduced

  return (
    <motion.div
      className={`gate ${opening ? 'gate--opening' : ''}`}
      animate={{ opacity: opening && reduced ? 0 : 1 }}
      transition={{ duration: 0.45, ease: 'easeIn' }}
    >
      {/* The camera eases in as the flap gives, so the paper grows past the
          frame and the viewer ends up inside the envelope rather than
          watching it from across a room. */}
      <motion.div
        className="gate__push"
        initial={reduced ? false : { scale: 1.06, opacity: 0 }}
        animate={{ scale: run ? 1.42 : 1, opacity: 1 }}
        transition={{
          scale: run
            ? { delay: PUSH_AT, duration: 2.1, ease: [0.3, 0, 0.2, 1] }
            : { duration: 1.6, ease: EASE_OUT },
          opacity: { duration: 1.1, ease: 'easeOut' },
        }}
      >
        {/* On a portrait screen the envelope runs wider than the frame, so
            the fold lines enter from off-screen and the paper is the page.
            On a landscape one it becomes a portrait panel on a warm ground —
            an envelope stretched to a 16:9 width would have a fold so
            shallow it stops reading as an envelope at all. */}
        <div className="gate__env">
          {/* The inside: warmer, deeper stock, seen only through the opening
              once the flap lifts. */}
          <span className="gate__inside" aria-hidden="true" />
          {/* The two lower walls, turned a little away from the key so the
              flap reads as lying on top of them. */}
          <span className="gate__wall gate__wall--left" aria-hidden="true" />
          <span className="gate__wall gate__wall--right" aria-hidden="true" />
          <span className="gate__wall gate__wall--foot" aria-hidden="true" />

        {/* The pointed flap. Hinged along the top edge, it lifts away from the
            viewer — the way a real one does — rather than folding toward the
            camera, which would sweep it across the lens. */}
          <motion.div
            className="gate__flap"
            animate={run ? { rotateX: -64, y: '-5%', opacity: 0.15 } : { rotateX: 0, y: '0%', opacity: 1 }}
            transition={{
              rotateX: { delay: FLAP_AT, duration: FLAP_DUR, ease: [0.42, 0, 0.2, 1] },
              y: { delay: FLAP_AT, duration: FLAP_DUR, ease: [0.42, 0, 0.2, 1] },
              opacity: { delay: BLOOM_AT + 0.5, duration: 0.8, ease: 'easeIn' },
            }}
          >
            <span className="gate__flap-face" aria-hidden="true" />
            <span className="gate__flap-edge" aria-hidden="true" />
            <div className="gate__flower">
              <DaisyRelief />
            </div>
          </motion.div>

          {/* Wax, struck with the couple's mark inside a ring of petals. It
              gives first: the light catches it, then it loosens off the paper. */}
          <motion.div
            className="gate__seal-pos"
            animate={
              run
                ? { scale: 0.84, y: '46%', rotate: -11, opacity: 0 }
                : { scale: 1, y: '0%', rotate: 0, opacity: 1 }
            }
            transition={{ delay: SEAL_AT, duration: SEAL_DUR, ease: 'easeIn' }}
          >
            <div className="gate__seal">
              <span className="gate__seal-rim" aria-hidden="true" />
              <span className="gate__seal-field" aria-hidden="true" />
              {/* The die's flower, struck into the well — the same bloom that
                  is embossed on the flap above, pressed small. */}
              <svg className="gate__seal-die" viewBox="0 0 100 100" aria-hidden="true">
                <g className="gate__seal-petal">
                  {Array.from({ length: 18 }, (_, i) => (
                    <ellipse
                      key={i}
                      cx="50"
                      cy="27"
                      rx="3.7"
                      ry="17"
                      transform={`rotate(${i * 20} 50 50)`}
                    />
                  ))}
                </g>
                <circle className="gate__seal-eye" cx="50" cy="50" r="8.4" />
              </svg>
            </div>
          </motion.div>

          <span className="gate__light" aria-hidden="true" />
        </div>


        {/* The light that was shut inside. It sits above every layer, so it
            floods the frame rather than being clipped to the opening. */}
        <motion.div
          className="gate__bloom"
          animate={
            run
              ? { opacity: [0, 0.5, 1, 1], scale: [0.3, 0.85, 2.4, 6] }
              : { opacity: 0, scale: 0.3 }
          }
          transition={{
            delay: BLOOM_AT,
            duration: 1.8,
            times: [0, 0.24, 0.64, 1],
            ease: ['easeOut', 'easeIn', 'easeIn'],
          }}
        />

        <motion.p
          className="gate__hint"
          animate={
            opening
              ? { opacity: 0, y: 6 }
              : reduced
                ? { opacity: 0.85 }
                : { opacity: [0.4, 0.95, 0.4] }
          }
          transition={
            opening
              ? { duration: 0.3, ease: 'easeIn' }
              : {
                  duration: 3,
                  delay: 1.6,
                  repeat: reduced ? 0 : Infinity,
                  ease: 'easeInOut',
                }
          }
        >
          Tap to open
        </motion.p>
      </motion.div>

      {!opening && (
        <button
          className="gate__hit"
          onClick={() => setOpening(true)}
          aria-label="Open the invitation"
          autoFocus
        />
      )}
    </motion.div>
  )
}
