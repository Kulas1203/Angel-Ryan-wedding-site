import { useEffect } from 'react'
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
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let rafId: number
    const raf = (time: number) => {
      lenis?.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis?.destroy()
      lenis = null
    }
  }, [])
}
