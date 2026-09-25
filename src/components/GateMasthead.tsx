import { motion } from 'motion/react'

type Props = {
  /* The delays below are set against the curtain, which is clear at about two
   seconds: the heading arrives as the light finishes coming up, not behind
   it. */

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
        transition={{ duration: opening ? 0.4 : 1.3, delay: opening ? 0 : 1.5, ease: 'easeOut' }}
      >
        You are cordially invited
      </motion.p>
      {/* Drawn out from the middle, between the two lines. */}
      <motion.hr
        className="gate__flourish"
        aria-hidden="true"
        animate={{ opacity: opening ? 0 : ready ? 1 : 0, scaleX: ready && !opening ? 1 : 0 }}
        transition={{
          duration: opening ? 0.4 : 1.4,
          delay: opening ? 0 : 2.05,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
      <motion.h1
        className="gate__title"
        animate={{
          opacity: opening ? 0 : ready ? 1 : 0,
          y: opening ? -14 : 0,
          // A hair under size on the way in, so it settles into place.
          scale: ready && !opening ? 1 : 0.965,
        }}
        transition={{
          duration: opening ? 0.5 : 1.5,
          delay: opening ? 0 : 1.72,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        An Evening to Remember
      </motion.h1>
    </div>
  )
}
