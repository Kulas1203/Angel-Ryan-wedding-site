import { motion, useReducedMotion } from 'motion/react'
import { program } from '../data/content'
import { Reveal, StaggerText } from './Reveal'
import './Program.css'

/**
 * The order of the day, as an ordered list on a single rule.
 *
 * It is a list of times, so it is marked up as one: an <ol> whose items carry
 * <time> elements. The rule down the middle and the markers on it are drawn
 * by CSS and hidden from the accessibility tree — read aloud, this is six
 * times and six headings, in order, and nothing else.
 *
 * The rows reveal on scroll like every other section, but they animate as
 * <li> elements rather than through Reveal, which would put a <div> between
 * the list and its items.
 */
export function Program() {
  const reduced = useReducedMotion()

  return (
    <section className="section program grain" id="program">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">№ 04 — The Programme</p>
          </Reveal>
          <h2>
            <StaggerText text="The order of" />{' '}
            <em>
              <StaggerText text="the day" delay={0.25} />
            </em>
          </h2>
          <Reveal delay={0.2}>
            <span className="rule" />
          </Reveal>
        </div>

        <ol className="program__list">
          {program.map((item, i) => (
            <motion.li
              key={item.iso}
              className="program__row"
              initial={reduced ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{
                duration: 0.9,
                // The stagger stops compounding after a few rows, so the last
                // entry does not wait a second and a half for its turn.
                delay: Math.min(i, 4) * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="program__marker" aria-hidden="true" />
              <time className="program__time" dateTime={item.iso}>
                {item.time}
              </time>
              <div className="program__body">
                <h3 className="program__title">{item.title}</h3>
                <p className="program__note">{item.note}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
