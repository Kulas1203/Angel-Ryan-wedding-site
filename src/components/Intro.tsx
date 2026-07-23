import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import './Intro.css'

const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const
// The curtains part late, after the monogram's full 3D reveal + hold.
const CURTAIN_DELAY = 3.0
const CURTAIN_DURATION = 1.3
const INTRO_MS = 4500

/**
 * Film-style opening: the monogram turns in from a 3D card flip, holds with
 * a gentle float, then the screen parts like curtains to reveal the hero.
 */
export function Intro() {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (reduced) return
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      document.body.style.overflow = ''
      setDone(true)
    }, INTRO_MS)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(t)
    }
  }, [reduced])

  if (reduced || done) return null

  return (
    <div className="intro" aria-hidden="true">
      <motion.div
        className="intro__panel intro__panel--top"
        initial={{ y: 0 }}
        animate={{ y: '-100%' }}
        transition={{ delay: CURTAIN_DELAY, duration: CURTAIN_DURATION, ease: CURTAIN_EASE }}
      />
      <motion.div
        className="intro__panel intro__panel--bottom"
        initial={{ y: 0 }}
        animate={{ y: '100%' }}
        transition={{ delay: CURTAIN_DELAY, duration: CURTAIN_DURATION, ease: CURTAIN_EASE }}
      />

      {/* The stage carries the perspective; the mark rotates within it in 3D. */}
      <div className="intro__stage">
        <motion.div
          className="intro__mark"
          initial={{
            opacity: 0,
            rotateY: -92,
            rotateX: 16,
            scale: 0.82,
            filter: 'blur(14px)',
          }}
          animate={{
            opacity: [0, 1, 1, 1, 0],
            // Turn to face front, then a soft settle-and-float before the exit.
            rotateY: [-92, 0, 5, -3, 0],
            rotateX: [16, 0, -2.5, 1.5, 0],
            scale: [0.82, 1, 1.005, 1.015, 1.08],
            filter: ['blur(14px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'],
          }}
          transition={{
            duration: 3.3,
            times: [0, 0.32, 0.56, 0.8, 1],
            ease: 'easeInOut',
          }}
        >
          <img className="intro__logo" src="/images/monogram-ivory.webp" alt="" />
        </motion.div>
      </div>
    </div>
  )
}
