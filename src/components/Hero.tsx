import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import { couple } from '../data/content'
import { scrollToSection } from '../hooks/useSmoothScroll'
import './Hero.css'

const EASE = [0.16, 1, 0.3, 1] as const

interface HeroProps {
  /** True once the envelope has been opened; cues the opening choreography. */
  revealed: boolean
}

export function Hero({ revealed }: HeroProps) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  // Spring-smooth the scroll progress once, then derive every parallax value
  // from it — the background and title drift with a gentle lag instead of
  // snapping frame-for-frame to the scrollbar.
  const progress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  })
  const bgY = useTransform(progress, [0, 1], ['0%', '22%'])
  const contentY = useTransform(progress, [0, 1], ['0%', '60%'])
  const fade = useTransform(progress, [0, 0.7], [1, 0])

  // Every delay below is measured from the moment the envelope's curtains
  // begin to part, so the names arrive with the reveal rather than on a
  // fixed clock the guest never sees.
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
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.2, delay: 0.35, ease: EASE }}
        >
          Together with their families
        </motion.p>

        <h1 className="hero__names" aria-label={couple.names}>
          <span className="hero__line">
            <motion.span
              initial={{ y: '105%', filter: 'blur(12px)' }}
              animate={
                revealed
                  ? { y: '0%', filter: 'blur(0px)' }
                  : { y: '105%', filter: 'blur(12px)' }
              }
              transition={{ duration: 1.6, delay: 0.55, ease: EASE }}
            >
              {first}
            </motion.span>
          </span>
          <motion.span
            className="hero__amp"
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
            animate={
              revealed
                ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                : { opacity: 0, scale: 0.85, filter: 'blur(8px)' }
            }
            transition={{ duration: 1.5, delay: 1.3, ease: EASE }}
          >
            &amp;
          </motion.span>
          <span className="hero__line">
            <motion.span
              initial={{ y: '105%', filter: 'blur(12px)' }}
              animate={
                revealed
                  ? { y: '0%', filter: 'blur(0px)' }
                  : { y: '105%', filter: 'blur(12px)' }
              }
              transition={{ duration: 1.6, delay: 0.85, ease: EASE }}
            >
              {second}
            </motion.span>
          </span>
        </h1>

        <motion.div
          className="hero__date"
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={
            revealed
              ? { opacity: 1, letterSpacing: '0.34em' }
              : { opacity: 0, letterSpacing: '0.5em' }
          }
          transition={{ duration: 1.8, delay: 1.65, ease: EASE }}
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
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ delay: 2.35, duration: 1.2 }}
      >
        <span className="hero__scroll-label">Scroll</span>
        <span className="hero__scroll-line" />
      </motion.button>
    </section>
  )
}
