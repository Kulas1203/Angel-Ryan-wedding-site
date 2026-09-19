import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { EnvelopeFlat } from './EnvelopeFlat'
import { lockScroll } from '../hooks/useSmoothScroll'
import type { EnvelopeScene } from '../three/envelopeScene'
import './Envelope.css'

interface EnvelopeProps {
  /** Fires as the light takes the frame, cueing the hero to begin. */
  onReveal: () => void
}

/** Whether this browser can give us a 3D context at all. */
function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    )
  } catch {
    return false
  }
}

/**
 * The site opens inside a sealed envelope.
 *
 * The envelope is a real object in a lit scene: the flap is hinged geometry
 * that turns on its fold, the daisy is a height field the key light rakes
 * across, and the wax is a bevelled solid that drops away under its own
 * weight. Press the seal and the flap opens, the light shut inside comes up,
 * the camera eases in, and the invitation is on the other side of it.
 *
 * Where the scene cannot run — no WebGL, or reduced motion asked for — the
 * CSS envelope stands in.
 */
export function Envelope({ onReveal }: EnvelopeProps) {
  // Resolved once, before first paint, so the page never shows one envelope
  // and then swaps it for the other.
  const [mode] = useState<'scene' | 'flat'>(() => {
    if (typeof window === 'undefined') return 'flat'
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return !reduced && hasWebGL() ? 'scene' : 'flat'
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<EnvelopeScene | null>(null)
  const [opening, setOpening] = useState(false)
  const [gone, setGone] = useState(false)
  const [ready, setReady] = useState(false)

  const revealRef = useRef(onReveal)
  revealRef.current = onReveal

  // Hold the page at the top and still while the invitation is sealed.
  useEffect(() => {
    if (mode !== 'scene') return
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    lockScroll(true)
    return () => lockScroll(false)
  }, [mode])

  useEffect(() => {
    if (mode !== 'scene' || !canvasRef.current) return
    let live = true
    let scene: EnvelopeScene | null = null

    // Loaded on demand: three is the single largest thing on the page, and
    // nothing below the envelope needs it.
    import('../three/envelopeScene').then(({ createEnvelopeScene }) => {
      if (!live || !canvasRef.current) return
      scene = createEnvelopeScene(canvasRef.current, {
        onRevealed: () => {
          lockScroll(false)
          revealRef.current()
        },
        onFinished: () => setGone(true),
      })
      sceneRef.current = scene
      setReady(true)
    })

    return () => {
      live = false
      scene?.dispose()
      sceneRef.current = null
    }
  }, [mode])

  if (mode === 'flat') return <EnvelopeFlat onReveal={onReveal} />
  if (gone) return null

  return (
    <div className={`gate gate--scene ${opening ? 'gate--opening' : ''}`}>
      <motion.canvas
        ref={canvasRef}
        className="gate__canvas"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      {/* The last of the light, carried past the canvas so the hand-off to
          the hero is a wash rather than a cut. */}
      <motion.div
        className="gate__wash"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? [0, 0, 1, 0] : 0 }}
        transition={
          opening
            ? { duration: 3.2, times: [0, 0.58, 0.78, 1], ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      />

      <motion.p
        className="gate__hint"
        animate={
          opening
            ? { opacity: 0, y: 6 }
            : ready
              ? { opacity: [0.4, 0.95, 0.4] }
              : { opacity: 0 }
        }
        transition={
          opening
            ? { duration: 0.3, ease: 'easeIn' }
            : { duration: 3, delay: 1.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        Tap to open
      </motion.p>

      {!opening && ready && (
        <button
          className="gate__hit"
          onClick={() => {
            setOpening(true)
            sceneRef.current?.open()
          }}
          aria-label="Open the invitation"
          autoFocus
        />
      )}
    </div>
  )
}
