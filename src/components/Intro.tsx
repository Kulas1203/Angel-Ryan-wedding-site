import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import './Intro.css'

const CURTAIN_EASE = [0.76, 0, 0.24, 1] as const
const INTRO_MS = 3000

/**
 * Film-style opening: a dark title card with the monogram easing into
 * focus, then the screen parts like curtains to reveal the hero.
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
        transition={{ delay: 1.75, duration: 1.15, ease: CURTAIN_EASE }}
      />
      <motion.div
        className="intro__panel intro__panel--bottom"
        initial={{ y: 0 }}
        animate={{ y: '100%' }}
        transition={{ delay: 1.75, duration: 1.15, ease: CURTAIN_EASE }}
      />

      <motion.div
        className="intro__mark"
        initial={{ opacity: 0, scale: 0.94, filter: 'blur(14px)' }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.94, 1, 1.01, 1.06],
          filter: ['blur(14px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'],
        }}
        transition={{ duration: 2.0, times: [0, 0.35, 0.78, 1], ease: 'easeInOut' }}
      >
        <img className="intro__logo" src="/images/monogram-ivory.webp" alt="" />
      </motion.div>
    </div>
  )
}
