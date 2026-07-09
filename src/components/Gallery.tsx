import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gallery } from '../data/content'
import { Reveal, StaggerText } from './Reveal'
import './Gallery.css'

export function Gallery() {
  const [active, setActive] = useState<number | null>(null)

  const close = useCallback(() => setActive(null), [])
  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((cur) =>
        cur === null ? cur : (cur + dir + gallery.length) % gallery.length,
      ),
    [],
  )

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active, close, step])

  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">№ 03 — Gallery</p>
          </Reveal>
          <h2>
            <StaggerText text="Moments," />{' '}
            <em>
              <StaggerText text="framed" delay={0.2} />
            </em>
          </h2>
          <Reveal delay={0.2}>
            <span className="rule" />
          </Reveal>
        </div>

        <div className="gallery__grid">
          {gallery.map((item, i) => (
            <Reveal key={item.src} delay={(i % 3) * 0.12} className="gallery__cell">
              <button
                className="gallery__item"
                onClick={() => setActive(i)}
                aria-label={`View ${item.caption}`}
              >
                <img src={item.src} alt={item.alt} loading="lazy" />
                <span className="gallery__caption">{item.caption}</span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={gallery[active].caption}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={close}
          >
            <motion.figure
              className="lightbox__figure"
              key={active}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={gallery[active].src} alt={gallery[active].alt} />
              <figcaption>
                <span>{gallery[active].caption}</span>
                <span className="lightbox__count">
                  {active + 1} / {gallery.length}
                </span>
              </figcaption>
            </motion.figure>

            <button
              className="lightbox__nav lightbox__nav--prev"
              onClick={(e) => {
                e.stopPropagation()
                step(-1)
              }}
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              className="lightbox__nav lightbox__nav--next"
              onClick={(e) => {
                e.stopPropagation()
                step(1)
              }}
              aria-label="Next image"
            >
              →
            </button>
            <button className="lightbox__close" onClick={close} aria-label="Close gallery">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
