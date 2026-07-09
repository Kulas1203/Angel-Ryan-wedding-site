import { useEffect, useState } from 'react'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Countdown } from './components/Countdown'
import { Story } from './components/Story'
import { Details } from './components/Details'
import { Gallery } from './components/Gallery'
import { Rsvp, RsvpFab } from './components/Rsvp'
import { Footer } from './components/Footer'

export default function App() {
  useSmoothScroll()
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [fabVisible, setFabVisible] = useState(false)

  // The floating RSVP pill appears once the hero has scrolled away.
  useEffect(() => {
    const onScroll = () => setFabVisible(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <Nav onRsvp={() => setRsvpOpen(true)} />
      <main>
        <Hero />
        <Countdown />
        <Story />
        <Details />
        <Gallery />
      </main>
      <Footer />
      <RsvpFab visible={fabVisible && !rsvpOpen} onOpen={() => setRsvpOpen(true)} />
      <Rsvp open={rsvpOpen} onClose={() => setRsvpOpen(false)} />
    </>
  )
}
