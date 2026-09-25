import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { GateAmbience } from './GateAmbience'
import { GateMasthead } from './GateMasthead'
import { lockScroll } from '../hooks/useSmoothScroll'
import './Envelope.css'

// Beats of the opening, in seconds from the tap.
const FLAP_AT = 0.16
const FLAP_DUR = 0.95
const CARD_AT = 0.52
const CARD_DUR = 1.0
const REVEAL_AT = 1.6
const GATE_END_MS = 2400
const REDUCED_END_MS = 520

interface EnvelopeFlatProps {
  /** Fires as the envelope gives way, cueing the hero to begin. */
  onReveal: () => void
}

/**
 * The envelope without WebGL: the same photograph, cut with clip-paths.
 *
 * This runs when the scene cannot — no WebGL, or the guest has asked for
 * reduced motion, where a camera move and a turning flap are exactly the
 * wrong thing to serve. It is the same image file the rendered gate maps onto
 * its geometry, so the envelope a guest sees here is not a second design that
 * happens to be the same colour.
 *
 * The flap is a second copy of the photograph clipped to the flap's triangle
 * and hinged on its fold, so while it is shut it lies exactly over the pixels
 * it came from and cannot be told apart from the picture. Turning, it takes
 * those pixels with it and the envelope's inside is what is left behind.
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
      className={`gate gate--photo ${opening ? 'gate--opening' : ''}`}
      animate={{ opacity: opening ? 0 : 1 }}
      transition={{
        duration: reduced ? 0.45 : 0.9,
        // Reduced motion cuts straight to the page; otherwise the gate holds
        // while the card comes out and then dissolves into the hero.
        delay: opening && !reduced ? 1.4 : 0,
        ease: 'easeIn',
      }}
    >
      <GateAmbience ready={!gone} opening={opening} />
      <GateMasthead ready={!gone} opening={opening} />

      <div className="gate__env">
        {/* The card, behind the paper, rising until it clears the top edge.
            It never comes forward: a card floating over the pocket it is
            supposedly still inside gives the whole thing away. */}
        <motion.div
          className="gate__card"
          animate={run ? { y: '-58%' } : { y: '0%' }}
          transition={{ delay: CARD_AT, duration: CARD_DUR, ease: [0.3, 0, 0.2, 1] }}
        >
          {/* The monogram carries their names and the date already, so the
              card is the monogram and the place beneath it. */}
          <img
            className="gate__card-monogram"
            src="/images/monogram.webp"
            alt="Ryan &amp; Angel, the twenty-ninth of October twenty twenty-six"
          />
          <p className="gate__card-venue">Pavillion Watergate</p>
        </motion.div>

        {/* The envelope's inside, uncovered as the flap turns off it. */}
        <span className="gate__mouth" aria-hidden="true" />

        {/* The body: the photograph, whole. */}
        <span className="gate__photo" aria-hidden="true" />

        {/* The flap: the same photograph, clipped to the flap and hinged on
            its fold. */}
        <motion.span
          className="gate__photo-flap"
          aria-hidden="true"
          animate={run ? { rotateX: 128 } : { rotateX: 0 }}
          transition={{ delay: FLAP_AT, duration: FLAP_DUR, ease: [0.42, 0, 0.2, 1] }}
        />

        {/* Paper under the wax, so no crescent of it is left behind. */}
        <span className="gate__wax-patch" aria-hidden="true" />

        {/* The wax, which gives before anything else moves. */}
        <motion.span
          className="gate__wax"
          aria-hidden="true"
          animate={run ? { y: '140%', rotate: -38, opacity: 0 } : { y: '0%', rotate: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeIn' }}
        />
      </div>

      <motion.p
        className="gate__hint"
        animate={opening ? { opacity: 0, y: 6 } : { opacity: [0.45, 1, 0.45] }}
        transition={
          opening
            ? { duration: 0.3, ease: 'easeIn' }
            : { duration: 3, delay: 1.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        Tap to open
      </motion.p>

      {!opening && (
        <button
          className="gate__hit"
          onClick={() => setOpening(true)}
          aria-label="Open the invitation"
        />
      )}
    </motion.div>
  )
}
