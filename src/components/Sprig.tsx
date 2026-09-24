import { useEffect, useRef } from 'react'
import { drawSealSprig, drawSprig } from '../three/botanical'

type Props = {
  /** 'leaf' is the fanned sprig printed on the stock; 'seal' is the single
      small one struck into the wax. */
  kind?: 'leaf' | 'seal'
  className?: string
  /** Where the sprig is rooted in its own box, and which way it fans, as
      fractions of the box and radians — the same figures the rendered
      envelope paints onto its panels. */
  ox?: number
  oy?: number
  angle?: number
  scale?: number
  seed?: number
}

/**
 * The same gold line art the rendered envelope prints, drawn onto a canvas so
 * the CSS envelope carries it too.
 *
 * Both gates read from one drawing routine on purpose: a guest on the
 * fallback should be looking at the same stationery as everyone else, not a
 * second design that happens to be the same colour.
 *
 * The box is sized entirely by CSS; the canvas measures itself and matches
 * its backing store to that, so the art holds its place on the paper at every
 * width instead of being pinned to a pixel size that only suits one.
 */
export function Sprig({
  kind = 'leaf',
  className,
  ox = 0.12,
  oy = 0.3,
  angle = -0.3,
  scale = 0.62,
  seed = 91,
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return

    const paint = () => {
      const w = c.clientWidth
      const h = c.clientHeight
      if (!w || !h) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (kind === 'seal') drawSealSprig(ctx, w * 0.5, h * 0.86, h * 0.72)
      else drawSprig(ctx, w * ox, h * oy, w * scale, angle, seed)
    }

    paint()
    // The envelope is sized in viewport units, so the box changes with the
    // window and the backing store has to be redrawn, not just stretched.
    const ro = new ResizeObserver(paint)
    ro.observe(c)
    return () => ro.disconnect()
  }, [kind, ox, oy, angle, scale, seed])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
