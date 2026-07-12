import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { scrollToSection } from '../hooks/useSmoothScroll'
import './Nav.css'

const links = [
  { label: 'Invitation', target: '#invitation' },
  { label: 'Our Story', target: '#story' },
  { label: 'Details', target: '#details' },
  { label: 'Gallery', target: '#gallery' },
]

interface NavProps {
  onRsvp: () => void
}

export function Nav({ onRsvp }: NavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      className={`nav ${scrolled ? 'nav--solid' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 3.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        className="nav__monogram"
        onClick={() => scrollToSection('#top')}
        aria-label="Back to top"
      >
        A<span>·</span>R
      </button>

      <nav className="nav__links" aria-label="Sections">
        {links.map((link) => (
          <button
            key={link.target}
            className="nav__link"
            onClick={() => scrollToSection(link.target)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <button className="nav__rsvp" onClick={onRsvp}>
        RSVP
      </button>
    </motion.header>
  )
}
