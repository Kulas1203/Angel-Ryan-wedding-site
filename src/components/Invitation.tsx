import { couple, invitation } from '../data/content'
import { MagneticButton } from './MagneticButton'
import { Reveal, StaggerText } from './Reveal'
import './Invitation.css'

// An arch with shouldered springing points, top and bottom. Stretched by
// preserveAspectRatio to the card's proportions, it reads as the elongated
// cartouche a formal invitation is set inside.
const ARCH =
  'M50 0.9C66 0.9 78 5.6 84.2 12.8C88.4 17.7 88.6 21.6 88.6 26.2' +
  'L88.6 73.8C88.6 78.4 88.4 82.3 84.2 87.2C78 94.4 66 99.1 50 99.1' +
  'C34 99.1 22 94.4 15.8 87.2C11.6 82.3 11.4 78.4 11.4 73.8' +
  'L11.4 26.2C11.4 21.6 11.6 17.7 15.8 12.8C22 5.6 34 0.9 50 0.9Z'

const ARCH_INNER =
  'M50 3.6C64.6 3.6 75.6 7.9 81.3 14.5C85.1 19 85.3 22.6 85.3 26.8' +
  'L85.3 73.2C85.3 77.4 85.1 81 81.3 85.5C75.6 92.1 64.6 96.4 50 96.4' +
  'C35.4 96.4 24.4 92.1 18.7 85.5C14.9 81 14.7 77.4 14.7 73.2' +
  'L14.7 26.8C14.7 22.6 14.9 19 18.7 14.5C24.4 7.9 35.4 3.6 50 3.6Z'

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
            {/* The cartouche. Drawn rather than bordered, because a rule that
                follows an arch cannot be a border-radius: the shoulders and
                the two springing points have to be one continuous line.
                non-scaling-stroke keeps it hairline while the shape stretches
                to whatever height the text needs. */}
            <span className="invitation__arch" aria-hidden="true">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <path className="invitation__arch-outer" d={ARCH} />
                <path className="invitation__arch-inner" d={ARCH_INNER} />
              </svg>
            </span>

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

              <span className="invitation__ornament" aria-hidden="true">
                <span className="invitation__ornament-rule" />
                <span className="invitation__ornament-dot" />
                <span className="invitation__ornament-rule" />
              </span>

              <p className="invitation__date">{invitation.date}</p>
              <p className="invitation__year">{invitation.year}</p>
              <p className="invitation__time">
                <span className="invitation__time-rule" aria-hidden="true" />
                {invitation.time}
                <span className="invitation__time-rule" aria-hidden="true" />
              </p>

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
