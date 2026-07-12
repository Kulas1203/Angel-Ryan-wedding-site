import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { couple } from '../data/content'
import { scrollToSection } from '../hooks/useSmoothScroll'
import './Hero.css'

const EASE = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '60%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // With motion enabled the opening title card plays first; the hero's own
  // choreography starts as the curtains part (~1.75s in).
  const t = reduced ? 0 : 1.5

  const [first, second] = couple.names.split(' & ')

  return (
    <section ref={ref} className="hero grain" id="top">
      <motion.div className="hero__bg" style={reduced ? undefined : { y: bgY }}>
        <div
          className="hero__bg-zoom"
          style={{ backgroundImage: 'url(/images/photo-overlook-view.jpg)' }}
        />
        <div className="hero__scrim" />
      </motion.div>

      <motion.div
        className="hero__content"
        style={reduced ? undefined : { y: contentY, opacity: fade }}
      >
        <motion.p
          className="eyebrow hero__eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: t + 0.5, ease: EASE }}
        >
          Together with their families
        </motion.p>

        <h1 className="hero__names" aria-label={couple.names}>
          <span className="hero__line">
            <motion.span
              initial={{ y: '105%', filter: 'blur(12px)' }}
              animate={{ y: '0%', filter: 'blur(0px)' }}
              transition={{ duration: 1.6, delay: t + 0.7, ease: EASE }}
            >
              {first}
            </motion.span>
          </span>
          <motion.span
            className="hero__amp"
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, delay: t + 1.5, ease: EASE }}
          >
            &amp;
          </motion.span>
          <span className="hero__line">
            <motion.span
              initial={{ y: '105%', filter: 'blur(12px)' }}
              animate={{ y: '0%', filter: 'blur(0px)' }}
              transition={{ duration: 1.6, delay: t + 1.0, ease: EASE }}
            >
              {second}
            </motion.span>
          </span>
        </h1>

        <motion.div
          className="hero__date"
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.34em' }}
          transition={{ duration: 1.8, delay: t + 1.9, ease: EASE }}
        >
          <span className="hero__date-rule" />
          <span>{couple.dateLabel}</span>
          <span className="hero__date-rule" />
        </motion.div>
      </motion.div>

      <motion.button
        className="hero__scroll-cue"
        onClick={() => scrollToSection('#invitation')}
        aria-label="Scroll to the invitation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: t + 2.7, duration: 1.2 }}
      >
        <span className="hero__scroll-label">Scroll</span>
        <span className="hero__scroll-line" />
      </motion.button>
    </section>
  )
}
