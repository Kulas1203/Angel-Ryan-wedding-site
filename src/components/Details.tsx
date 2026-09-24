import { details, dressCode, couple, venue } from '../data/content'
import { downloadWeddingIcs } from '../lib/calendar'
import { Reveal, StaggerText } from './Reveal'
import './Details.css'

export function Details() {
  return (
    <section className="section details grain" id="details">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow details__eyebrow">№ 03 — The Day</p>
          </Reveal>
          <h2>
            <StaggerText text="An evening of" />{' '}
            <em>
              <StaggerText text="celebration" delay={0.25} />
            </em>
          </h2>
          <Reveal delay={0.2}>
            <span className="rule details__rule" />
          </Reveal>
        </div>

        <div className="details__grid">
          {details.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.15} className="details__card">
              <div className="details__card-inner">
                <p className="details__label">{item.label}</p>
                <p className="details__time">{item.time}</p>
                <h3 className="details__venue">{item.venue}</h3>
                <p className="details__address">{item.address}</p>
                <span className="details__divider" aria-hidden="true" />
                <p className="details__note">{item.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Both halves of the day are at the same address, so the two things
            a guest actually needs from this section sit once, under the pair,
            rather than twice over. */}
        <Reveal delay={0.3}>
          <div className="details__actions">
            <a
              className="details__action"
              href={venue.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.6" />
              </svg>
              Get directions
            </a>
            <button className="details__action" onClick={downloadWeddingIcs}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15" rx="2.2" />
                <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
              </svg>
              Add to calendar
            </button>
          </div>
        </Reveal>

        {/* The dress-code card carries its own heading, palette and closing
            line, so nothing is set around it that would say the same thing
            twice. The colours are repeated underneath as text because a guest
            picking out a dress has to be able to read them, and because an
            image that never loads would otherwise take the whole dress code
            with it. */}
        <Reveal delay={0.2}>
          <div className="details__attire">
            <figure className="details__dress">
              <img
                className="details__dress-img"
                src="/images/dress-code.webp"
                alt={`Dress code: we would love to see you in our theme colours — ${dressCode.palette
                  .join(', ')
                  .toLowerCase()} — shown on illustrated guests in suits and gowns.`}
                width={1312}
                height={1199}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="details__dress-caption">
                {dressCode.palette.join(' · ')}
              </figcaption>
            </figure>
            <p className="details__hashtag">{couple.hashtag}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
