import { useEffect } from 'react'
import { cancelFrame, frame } from 'motion/react'
import Lenis from 'lenis'

let lenis: Lenis | null = null

// Clearance for the fixed navbar so anchored sections land below it.
const NAV_OFFSET = -72

export function scrollToSection(selector: string) {
  const el = document.querySelector(selector)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el as HTMLElement, { offset: NAV_OFFSET, duration: 1.6 })
  } else {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

export function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReduced) return

    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    // Drive Lenis from Motion's frame loop so smooth scrolling and every
    // scroll-linked animation (hero parallax, timeline spine) advance on the
    // exact same tick — no cross-loop drift or micro-jitter.
    const update = (data: { timestamp: number }) => lenis?.raf(data.timestamp)
    frame.update(update, true)

    return () => {
      cancelFrame(update)
      lenis?.destroy()
      lenis = null
    }
  }, [])
}
