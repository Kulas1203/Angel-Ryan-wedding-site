import { motion } from 'motion/react'

type Props = {
  /** Held back until the envelope itself is on screen, so the words and the
      paper arrive together rather than the heading landing on an empty page. */
  ready: boolean
  opening: boolean
}

/**
 * The words above the envelope. Shared by both gates: whether a guest gets
 * the rendered envelope or the CSS one, they are invited in the same voice.
 */
export function GateMasthead({ ready, opening }: Props) {
  return (
    <div className="gate__masthead">
      <motion.p
        className="gate__eyebrow"
        animate={{ opacity: opening ? 0 : ready ? 1 : 0, y: opening ? -6 : 0 }}
        transition={{ duration: opening ? 0.4 : 1, delay: opening ? 0 : 0.2, ease: 'easeOut' }}
      >
        You are cordially invited
      </motion.p>
      <motion.h1
        className="gate__title"
        animate={{ opacity: opening ? 0 : ready ? 1 : 0, y: opening ? -10 : 0 }}
        transition={{ duration: opening ? 0.45 : 1.2, delay: opening ? 0 : 0.34, ease: 'easeOut' }}
      >
        An Evening to Remember
      </motion.h1>
    </div>
  )
}
