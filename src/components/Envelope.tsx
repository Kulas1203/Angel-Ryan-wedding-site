import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { couple, invitation } from '../data/content'
import { lockScroll } from '../hooks/useSmoothScroll'
import './Envelope.css'

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const

// Beats of the opening sequence, in seconds from the moment the seal is
// pressed. Every element below reads its delay from one of these.
const FLAP_AT = 0.16
const FLAP_DUR = 0.9
const LETTER_AT = 0.8
const PAPER_OUT_AT = 1.55
const CURTAIN_AT = 1.9
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

      <div className="gate__stage">
        <div className="gate__glow" />

        <motion.div
          className="gate__enter"
          initial={reduced ? false : { opacity: 0, y: 44, scale: 0.9 }}
          animate={{ opacity: fadeOut ? 0 : 1, y: 0, scale: 1 }}
          transition={{ duration: fadeOut ? 0.4 : 1.25, ease: EASE_OUT }}
        >
          <motion.div
            className="env"
            animate={
              reduced || opening
                ? { y: 0, rotate: 0 }
                : { y: [0, -9, 0], rotate: [0, 0.55, 0] }
            }
            transition={
              reduced || opening
                ? { duration: 0.5, ease: 'easeOut' }
                : { duration: 6.5, delay: 1.1, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            {/* Hinged at the top edge; swings back and lies behind the body. */}
            <motion.div
              className={`env__flap ${flapBehind ? 'is-open' : ''}`}
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
            </motion.div>

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
            />

            <div className="env__seal-pos">
              <motion.div
                className="env__seal"
                animate={
                  opening && !reduced
                    ? { scale: [1, 0.9, 0.62], rotate: [0, -4, -19], y: [0, 2, 40], opacity: [1, 1, 0] }
                    : reduced
                      ? { scale: 1 }
                      : { scale: [1, 1.035, 1] }
                }
                transition={
                  opening && !reduced
                    ? { duration: 0.6, times: [0, 0.22, 1], ease: 'easeIn' }
                    : { duration: 3.2, repeat: reduced ? 0 : Infinity, ease: 'easeInOut' }
                }
              >
                <span className="env__seal-mark">R&nbsp;&amp;&nbsp;A</span>
              </motion.div>
            </div>
          </motion.div>

          <div className="gate__caption">
            <motion.p
              className="gate__script"
              animate={{ opacity: opening ? 0 : 1, y: opening ? 10 : 0 }}
              transition={{ duration: 0.45, ease: 'easeIn' }}
            >
              You’re Invited
            </motion.p>
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
