import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
        initial={{ opacity: 0, scale: 0.96, filter: 'blur(14px)' }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.96, 1, 1.01, 1.05],
          filter: ['blur(14px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'],
        }}
        transition={{ duration: 2.0, times: [0, 0.35, 0.78, 1], ease: 'easeInOut' }}
      >
        <span className="intro__names">
          A <em>&amp;</em> R
        </span>
        <motion.span
          className="intro__rule"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <span className="intro__date">10 · 29 · 2026</span>
      </motion.div>
    </div>
  )
}
