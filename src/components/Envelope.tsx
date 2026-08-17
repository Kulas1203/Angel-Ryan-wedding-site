import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { couple, invitation } from '../data/content'
import { lockScroll } from '../hooks/useSmoothScroll'
import './Envelope.css'

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const

// Beats of the opening sequence, in seconds from the moment the seal is
// pressed. Every element below reads its delay from one of these.
const BAND_AT = 0.04
const BAND_DUR = 0.78
const FLAP_AT = 0.42
const FLAP_DUR = 0.85
const LETTER_AT = 0.95
const PAPER_OUT_AT = 1.7
const CURTAIN_AT = 2.05
const CURTAIN_DUR = 1.15

// The fraction of the flap's swing at which it crosses 90° — edge-on to the
// viewer. That frame is where it stops covering the envelope and starts
// lying behind it, and where the ivory face gives way to the emerald liner.
const FLAP_BEHIND_MS = (FLAP_AT + FLAP_DUR * 0.555) * 1000
const GATE_END_MS = (CURTAIN_AT + CURTAIN_DUR + 0.1) * 1000
const REDUCED_END_MS = 460

interface EnvelopeProps {
  /** Fires as the gate opens, cueing the hero to begin its choreography. */
  onReveal: () => void
}

/**
 * The site opens as a sealed invitation. Tap the envelope and the wax seal
 * breaks, the flap swings back in 3D, the card rises out, and the ground
 * parts like curtains onto the hero.
 */
export function Envelope({ onReveal }: EnvelopeProps) {
  const reduced = useReducedMotion()
  const [opening, setOpening] = useState(false)
  const [flapBehind, setFlapBehind] = useState(false)
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
      timers.push(window.setTimeout(() => setFlapBehind(true), FLAP_BEHIND_MS))
      timers.push(window.setTimeout(reveal, CURTAIN_AT * 1000))
      timers.push(window.setTimeout(() => setGone(true), GATE_END_MS))
    }

    return () => timers.forEach(clearTimeout)
  }, [opening, reduced])

  if (gone) return null

  // Reduced motion keeps the envelope — it is content, not decoration — but
  // trades the whole sequence for a plain fade.
  const fadeOut = reduced && opening
  const curtain = opening && !reduced

  return (
    <div className={`gate ${opening ? 'gate--opening' : ''}`}>
      <motion.div
        className="gate__panel gate__panel--top"
        animate={{ y: curtain ? '-100%' : '0%', opacity: fadeOut ? 0 : 1 }}
        transition={{ delay: curtain ? CURTAIN_AT : 0, duration: fadeOut ? 0.4 : CURTAIN_DUR, ease: CURTAIN_EASE }}
      />
      <motion.div
        className="gate__panel gate__panel--bottom"
        animate={{ y: curtain ? '100%' : '0%', opacity: fadeOut ? 0 : 1 }}
        transition={{ delay: curtain ? CURTAIN_AT : 0, duration: fadeOut ? 0.4 : CURTAIN_DUR, ease: CURTAIN_EASE }}
      />

      {/* Engraved rule around the whole view. */}
      <motion.div
        className="gate__frame"
        aria-hidden="true"
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.6, ease: 'easeIn' }}
      >
        <span className="gate__frame-corner gate__frame-corner--tl" />
        <span className="gate__frame-corner gate__frame-corner--tr" />
        <span className="gate__frame-corner gate__frame-corner--bl" />
        <span className="gate__frame-corner gate__frame-corner--br" />
      </motion.div>

      <div className="gate__stage">
        <div className="gate__glow" />
        {/* The lit plane the envelope is lying on. */}
        <div className="gate__surface" />

        <motion.div
          className="gate__enter"
          initial={reduced ? false : { opacity: 0, y: 44, scale: 0.9 }}
          animate={{
            opacity: fadeOut ? 0 : 1,
            // The whole arrangement settles downward as the card is drawn
            // up, so a tall card still clears the envelope without running
            // off the top of the screen. Viewport units keep the trade
            // proportional on any display.
            y: opening && !reduced ? '16vh' : 0,
            scale: 1,
          }}
          transition={{
            opacity: { duration: fadeOut ? 0.4 : 1.25, ease: EASE_OUT },
            scale: { duration: 1.25, ease: EASE_OUT },
            y:
              opening && !reduced
                ? { delay: LETTER_AT, duration: 1.15, ease: EASE_OUT }
                : { duration: 1.25, ease: EASE_OUT },
          }}
        >
          <div className="env-tilt">
          {/* No idle float: the envelope is lying on a surface with a contact
              shadow under it, and a resting object that drifts is the first
              thing to give the illusion away. */}
          <div className="env">
            <span className="env__shadow" aria-hidden="true" />
            {/* The near edge of the stock, turned toward the lens by the tilt. */}
            <span className="env__edge" aria-hidden="true" />

            {/* Only the flap needs 3D, so it gets its own perspective stage.
                Everything else stays in a flat context where z-index is
                reliable — inside preserve-3d the browser sorts by position
                in space and the card punched through the envelope. */}
            <div className={`env__flap-stage ${flapBehind ? 'is-open' : ''}`}>
            <motion.div
              className="env__flap"
              animate={
                opening && !reduced
                  ? { rotateX: [0, -14, -180], opacity: 0, y: 64 }
                  : { rotateX: 0, opacity: 1, y: 0 }
              }
              transition={{
                rotateX: {
                  delay: FLAP_AT,
                  duration: FLAP_DUR,
                  times: [0, 0.16, 1],
                  ease: [0.5, 0, 0.25, 1],
                },
                opacity: { delay: PAPER_OUT_AT + 0.15, duration: 0.55, ease: 'easeIn' },
                y: { delay: PAPER_OUT_AT, duration: 0.8, ease: 'easeIn' },
              }}
            >
              <span className="env__flap-face" />
              <span className="env__flap-liner" />
              {/* The cut edge of the stock along the flap's free sides. The
                  left one faces the key light and reads brightest; the right
                  is turned away. It rides above both faces so it survives
                  the turn, and non-scaling-stroke keeps it hairline-thin
                  even though the viewBox is stretched to the flap. */}
              <svg
                className="env__flap-edge"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  points="0.5,0.5 50,99"
                  stroke="rgba(184,224,198,0.28)"
                  fill="none"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points="99.5,0.5 50,99"
                  stroke="rgba(150,196,168,0.15)"
                  fill="none"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {/* The couple's crest, foil-stamped on the flap. */}
              <span className="env__crest" />
            </motion.div>
            </div>

            {/* Sits behind the envelope body, so it reads as tucked inside. */}
            <motion.div
              className="env__letter"
              animate={
                opening && !reduced
                  ? {
                      y: ['0%', '-66%', '-66%', '-72%'],
                      scale: [1, 1, 1, 1.28],
                      opacity: [1, 1, 1, 0],
                      filter: [
                        'blur(0px)',
                        'blur(0px)',
                        'blur(0px)',
                        'blur(14px)',
                      ],
                    }
                  : { y: '0%' }
              }
              transition={{
                delay: LETTER_AT,
                duration: 1.75,
                times: [0, 0.5, 0.58, 1],
                ease: ['easeOut', 'linear', 'easeIn'],
              }}
            >
              <p className="env__eyebrow">{invitation.opening}</p>
              <p className="env__names">{couple.names}</p>
              <span className="env__rule" />
              <p className="env__date">{couple.dateLabel}</p>
              <p className="env__venue">
                {invitation.venue} · {invitation.city}
              </p>
            </motion.div>

            <motion.div
              className="env__body"
              animate={
                opening && !reduced
                  ? { opacity: 0, y: 64, rotateX: 14 }
                  : { opacity: 1, y: 0, rotateX: 0 }
              }
              transition={{ delay: PAPER_OUT_AT, duration: 0.8, ease: 'easeIn' }}
            >
              {/* The back of a real envelope is four folded panels, not a
                  printed rectangle: the two side flaps turn in, the bottom
                  flap folds up over them, and the pointed top flap closes
                  over the lot. Each drops a shadow on the one beneath, and
                  those overlaps are what the eye reads as paper. */}
              <span className="env__panel env__panel--left" />
              <span className="env__panel env__panel--right" />
              <span className="env__panel env__panel--bottom" />

              {/* The cut edge of the stock along each fold. */}
              <svg
                className="env__seams"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Edges turned toward the key light. */}
                <polyline className="is-lit" points="0,0 50,50" />
                <polyline className="is-lit" points="50,50 0,100" />
                <polyline className="is-lit" points="22,50 78,50" />
                <polyline className="is-lit" points="0,100 22,50" />
                {/* Edges turned away from it. */}
                <polyline className="is-dim" points="100,0 50,50" />
                <polyline className="is-dim" points="50,50 100,100" />
                <polyline className="is-dim" points="100,100 78,50" />
              </svg>

              {/* Key light, the bulge of the card inside, and the cut edge
                  around the whole enclosure. */}
              <span className="env__light" />
            </motion.div>

            {/* Belly band — the device that marks a real invitation suite.
                It holds the flap shut, carries the wax, and slips off
                downward as one piece when the invitation is opened. */}
            <motion.div
              className="env__band"
              animate={
                opening && !reduced
                  ? { y: '150%', rotate: -1.6, opacity: 0 }
                  : { y: '0%', rotate: 0, opacity: 1 }
              }
              transition={{
                y: { delay: BAND_AT, duration: BAND_DUR, ease: [0.5, 0, 0.35, 1] },
                rotate: { delay: BAND_AT, duration: BAND_DUR, ease: 'easeIn' },
                opacity: { delay: BAND_AT + BAND_DUR * 0.45, duration: 0.42, ease: 'easeIn' },
              }}
            >
              <div className="env__seal-pos">
                <motion.div
                  className="env__seal"
                  animate={
                    opening && !reduced
                      ? { scale: [1, 0.94, 0.88], rotate: [0, -3, -9] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={
                    opening && !reduced
                      ? { duration: 0.55, times: [0, 0.3, 1], ease: 'easeIn' }
                      : { duration: 0.4, ease: 'easeOut' }
                  }
                >
                  <span className="env__seal-wax" aria-hidden="true" />
                  <span className="env__seal-die" aria-hidden="true" />
                  <span className="env__seal-mark">R&nbsp;&amp;&nbsp;A</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
          </div>

          <div className="gate__caption">
            <motion.p
              className="gate__script"
              animate={{ opacity: opening ? 0 : 1, y: opening ? 10 : 0 }}
              transition={{ duration: 0.45, ease: 'easeIn' }}
            >
              You’re Invited
            </motion.p>
            <motion.span
              className="gate__ornament"
              aria-hidden="true"
              animate={{ opacity: opening ? 0 : 1 }}
              transition={{ duration: 0.4, ease: 'easeIn' }}
            >
              <span className="gate__ornament-line" />
              <span className="gate__ornament-dot" />
              <span className="gate__ornament-line" />
            </motion.span>
            <motion.p
              className="gate__hint"
              animate={
                opening
                  ? { opacity: 0 }
                  : reduced
                    ? { opacity: 0.8 }
                    : { opacity: [0.45, 1, 0.45] }
              }
              transition={
                opening
                  ? { duration: 0.3, ease: 'easeIn' }
                  : { duration: 2.8, delay: 1.4, repeat: reduced ? 0 : Infinity, ease: 'easeInOut' }
              }
            >
              Tap to open
            </motion.p>
          </div>
        </motion.div>
      </div>

      {!opening && (
        <button
          className="gate__hit"
          onClick={() => setOpening(true)}
          aria-label="Open the invitation"
          autoFocus
        />
      )}
    </div>
  )
}
