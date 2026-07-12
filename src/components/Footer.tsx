import { couple } from '../data/content'
import { Reveal } from './Reveal'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer grain">
      <Reveal>
        <div className="footer__inner">
          <img
            className="footer__monogram-img"
            src="/images/monogram-ivory.webp"
            alt="Ryan & Angel monogram"
            loading="lazy"
          />
          <p className="footer__names">{couple.names}</p>
          <p className="footer__date">{couple.dateLabel}</p>
          <span className="footer__rule" aria-hidden="true" />
          <p className="footer__tag">{couple.hashtag}</p>
        </div>
      </Reveal>
    </footer>
  )
}
