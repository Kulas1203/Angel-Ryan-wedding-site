import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { timeline } from '../data/content'
import { Reveal, StaggerText } from './Reveal'
import './Story.css'

export function Story() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 75%', 'end 60%'],
  })
  const lineScale = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  })

  return (
    <section className="section story" id="story">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">№ 01 — Our Story</p>
          </Reveal>
          <h2>
            <StaggerText text="A love written" />{' '}
            <em>
              <StaggerText text="in chapters" delay={0.25} />
            </em>
          </h2>
          <Reveal delay={0.2}>
            <span className="rule" />
          </Reveal>
        </div>

        <div className="story__track" ref={trackRef}>
          <div className="story__spine" aria-hidden="true">
            <motion.div className="story__spine-fill" style={{ scaleY: lineScale }} />
          </div>

          {timeline.map((entry, i) => {
            const flipped = i % 2 === 1
            return (
              <article
                key={entry.index}
                className={`story__item ${flipped ? 'story__item--flipped' : ''}`}
              >
                <Reveal x={flipped ? 48 : -48} y={0} className="story__text">
                  <span className="story__index">{entry.index}</span>
                  <span className="story__year">{entry.year}</span>
                  <h3 className="story__title">{entry.title}</h3>
                  <p className="story__body">{entry.body}</p>
                </Reveal>

                <div className="story__node" aria-hidden="true">
                  <motion.span
                    className="story__node-dot"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: '-20% 0px' }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <div className="story__media">
                  <motion.div
                    className="story__media-mask"
                    initial={{ clipPath: 'inset(0 0 100% 0)' }}
                    whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
                    viewport={{ once: true, margin: '-15% 0px' }}
                    transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img src={entry.image} alt={entry.title} loading="lazy" />
                  </motion.div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
