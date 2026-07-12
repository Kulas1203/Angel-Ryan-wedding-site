import { couple, invitation } from '../data/content'
import { MagneticButton } from './MagneticButton'
import { Reveal, StaggerText } from './Reveal'
import './Invitation.css'

interface InvitationProps {
  onRsvp: () => void
}

export function Invitation({ onRsvp }: InvitationProps) {
  return (
    <section className="section invitation" id="invitation">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">№ 01 — The Invitation</p>
          </Reveal>
          <h2>
            <StaggerText text="You are cordially" />{' '}
            <em>
              <StaggerText text="invited" delay={0.25} />
            </em>
          </h2>
          <Reveal delay={0.2}>
            <span className="rule" />
          </Reveal>
        </div>

        <Reveal>
          <div className="invitation__card">
            <div className="invitation__card-inner">
              <img
                className="invitation__monogram"
                src="/images/monogram.webp"
                alt="Ryan & Angel monogram"
              />
              <p className="invitation__opening">{invitation.opening}</p>
              <p className="invitation__names">
                Ryan <span>&amp;</span> Angel
              </p>
              <p className="invitation__body">{invitation.body}</p>

              <span className="invitation__leaf" aria-hidden="true">
                ❧
              </span>

              <p className="invitation__date">{invitation.date}</p>
              <p className="invitation__year">{invitation.year}</p>
              <p className="invitation__time">{invitation.time}</p>

              <span className="invitation__divider" aria-hidden="true" />

              <p className="invitation__venue">{invitation.venue}</p>
              <p className="invitation__city">{invitation.city}</p>

              <MagneticButton className="invitation__cta" onClick={onRsvp}>
                Kindly RSVP
              </MagneticButton>
              <p className="invitation__hashtag">{couple.hashtag}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
