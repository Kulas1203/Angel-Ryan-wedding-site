import { details, dressCode, couple } from '../data/content'
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

        <Reveal delay={0.2}>
          <div className="details__attire">
            <p className="details__label">{dressCode.label}</p>
            <p className="details__attire-value">{dressCode.value}</p>
            <p className="details__note">{dressCode.note}</p>
            <p className="details__hashtag">{couple.hashtag}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
