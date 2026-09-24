import { useState } from 'react'
import { venue } from '../data/content'
import { downloadWeddingIcs } from '../lib/calendar'
import { Reveal, StaggerText } from './Reveal'
import './Location.css'

/**
 * Where the day happens: the venue in words, and the same place on a map.
 *
 * The map is Google's keyless embed, and it loads on a tap rather than on
 * arrival. A blocked or unreachable embed renders as a browser error page
 * that nothing can be drawn over, so the choice is between a designed panel
 * the guest opts into and a grey broken frame for everyone whose network or
 * extensions do not allow it. The address and the directions link sit
 * outside the frame either way, so the section works even if the map never
 * loads at all.
 */
export function Location() {
  const [mapShown, setMapShown] = useState(false)

  return (
    <section className="section location" id="location">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">№ 05 — The Venue</p>
          </Reveal>
          <h2>
            <StaggerText text="How to" />{' '}
            <em>
              <StaggerText text="find us" delay={0.25} />
            </em>
          </h2>
          <Reveal delay={0.2}>
            <span className="rule" />
          </Reveal>
        </div>

        <div className="location__layout">
          <Reveal className="location__aside">
            <h3 className="location__name">{venue.name}</h3>
            <address className="location__address">{venue.address}</address>
            <span className="location__divider" aria-hidden="true" />
            <p className="location__note">{venue.note}</p>
            <div className="location__actions">
              <a
                className="location__action location__action--primary"
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
              <button className="location__action" onClick={downloadWeddingIcs}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3.5" y="5" width="17" height="15" rx="2.2" />
                  <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
                </svg>
                Add to calendar
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="location__map">
            {mapShown ? (
              <iframe
                className="location__frame"
                title={`Map showing ${venue.name}, ${venue.city}`}
                src={venue.embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <button
                className="location__placeholder"
                onClick={() => setMapShown(true)}
                aria-label={`Show the map of ${venue.name}`}
              >
                {/* A few streets and a river, drawn rather than loaded — the
                    suggestion of a map, not a claim to be one. */}
                <svg
                  className="location__sketch"
                  viewBox="0 0 320 220"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M-10 58h150M-10 148h130M96 -10v240M212 -10v240M150 58l62 90" />
                  <path className="location__river" d="M-10 196c60-8 76-52 128-64s94 4 140-26" />
                </svg>
                <span className="location__pin" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.6" />
                  </svg>
                </span>
                <span className="location__placeholder-label">Show map</span>
              </button>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
