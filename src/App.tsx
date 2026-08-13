import { useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { Nav } from './components/Nav'
import { Envelope } from './components/Envelope'
import { Hero } from './components/Hero'
import { Countdown } from './components/Countdown'
import { Invitation } from './components/Invitation'
import { Story } from './components/Story'
import { Details } from './components/Details'
import { Gallery } from './components/Gallery'
import { Rsvp, RsvpFab } from './components/Rsvp'
import { Footer } from './components/Footer'

export default function App() {
  useSmoothScroll()
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [fabVisible, setFabVisible] = useState(false)
  const [invitationInView, setInvitationInView] = useState(false)
  // The site waits behind the sealed envelope; the hero and navbar hold
  // their opening frame until the guest breaks the seal.
  const [revealed, setRevealed] = useState(false)

  // The floating RSVP pill appears once the hero has scrolled away.
  useEffect(() => {
    const onScroll = () => setFabVisible(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The invitation section carries its own RSVP call-to-action, so the
  // floating pill steps aside while it is on screen.
  useEffect(() => {
    const target = document.querySelector('#invitation')
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => setInvitationInView(entry.isIntersecting),
      { rootMargin: '-15% 0px -15% 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    // A single smooth default easing for every unspecified transition, and
    // Motion honours the OS "reduce motion" setting app-wide.
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Envelope onReveal={() => setRevealed(true)} />
      <Nav onRsvp={() => setRsvpOpen(true)} revealed={revealed} />
      <main>
        <Hero revealed={revealed} />
        <Countdown />
        <Invitation onRsvp={() => setRsvpOpen(true)} />
        <Story />
        <Details />
        <Gallery />
      </main>
      <Footer />
      <RsvpFab
        visible={fabVisible && !rsvpOpen && !invitationInView}
        onOpen={() => setRsvpOpen(true)}
      />
      <Rsvp open={rsvpOpen} onClose={() => setRsvpOpen(false)} />
    </MotionConfig>
  )
}
