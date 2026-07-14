import { Fragment } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  x?: number
  duration?: number
  className?: string
  once?: boolean
}

/** Scroll-triggered fade/slide reveal. */
export function Reveal({
  children,
  delay = 0,
  y = 36,
  x = 0,
  duration = 1.1,
  className,
  once = true,
}: RevealProps) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: '-12% 0px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerTextProps {
  text: string
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'p' | 'span'
}

/** Splits text into words and reveals them with a stagger. */
export function StaggerText({ text, className, delay = 0 }: StaggerTextProps) {
  const reduced = useReducedMotion()
  const words = text.split(' ')
  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block' }}
      initial={reduced ? undefined : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ staggerChildren: 0.08, delayChildren: delay }}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'bottom',
              // Room for calligraphy descenders/flourishes in emphasis words;
              // the negative margin keeps the baseline where it was.
              paddingBottom: '0.16em',
              marginBottom: '-0.16em',
            }}
          >
            <motion.span
            style={{ display: 'inline-block' }}
            variants={{
              hidden: { y: '110%', opacity: 0 },
              visible: {
                y: '0%',
                opacity: 1,
                transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            {word}
            </motion.span>
          </span>
          {/* The space must live outside the overflow-hidden box as a real
              text node — a no-break space inside the box rendered
              inconsistently across browsers, joining words together. */}
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </motion.span>
  )
}
