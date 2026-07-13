import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const goTo = (target: string) => {
    setMenuOpen(false)
    // Let the scroll lock release before Lenis takes over.
    setTimeout(() => scrollToSection(target), 60)
  }

  return (
    <>
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
          R<span>·</span>A
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

        <div className="nav__actions">
          <button className="nav__rsvp" onClick={onRsvp}>
            RSVP
          </button>
          <button
            className="nav__burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button
              className="menu__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>

            <img className="menu__monogram" src="/images/monogram-ivory.webp" alt="" />

            <nav className="menu__links" aria-label="Sections">
              {links.map((link, i) => (
                <motion.button
                  key={link.target}
                  className="menu__link"
                  onClick={() => goTo(link.target)}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {link.label}
                </motion.button>
              ))}
            </nav>

            <motion.button
              className="menu__rsvp"
              onClick={() => {
                setMenuOpen(false)
                onRsvp()
              }}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Kindly RSVP
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
