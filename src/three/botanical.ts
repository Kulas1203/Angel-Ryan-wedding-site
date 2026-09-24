/**
 * The gold botanical line art printed on the stock.
 *
 * Everything here is drawn as outline, never filled: on the reference the
 * sage shows through the middle of every leaf, which is what makes it read as
 * a fine gold line struck onto paper rather than a gold shape sitting on top
 * of it. Leaves carry a midrib and hang off a short petiole, the sprays end
 * in open berries, and the whole sprig fans from one base — three stems of
 * different lengths, because two reads as a pair and four as a bouquet.
 *
 * It is drawn onto a 2D canvas rather than modelled, because the envelope's
 * panels are flat and a texture costs one draw where geometry would cost
 * several thousand triangles of leaf outline.
 */

type Ctx = CanvasRenderingContext2D

export const GOLD = '#c8a763'

/** Small deterministic PRNG, so the same sprig is drawn every reload. */
export function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One leaf: a petiole, an almond blade in outline, and a midrib. */
function leaf(ctx: Ctx, x: number, y: number, ang: number, len: number, wid: number) {
  const ux = Math.cos(ang)
  const uy = Math.sin(ang)
  const nx = -uy
  const ny = ux
  const bx = x + ux * len * 0.16
  const by = y + uy * len * 0.16
  const tx = x + ux * len
  const ty = y + uy * len
  // Widest a little past halfway, which is what gives a leaf its shoulder.
  const mx = bx + (tx - bx) * 0.44
  const my = by + (ty - by) * 0.44

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(bx, by)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.quadraticCurveTo(mx + nx * wid, my + ny * wid, tx, ty)
  ctx.quadraticCurveTo(mx - nx * wid, my - ny * wid, bx, by)
  ctx.stroke()

  // The midrib stops short of the tip; run it all the way and the leaf
  // closes into a spearhead.
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx + (tx - bx) * 0.86, by + (ty - by) * 0.86)
  ctx.stroke()
}

/** A spray of open berries on hair-thin stalks. */
function berries(
  ctx: Ctx,
  x: number,
  y: number,
  ang: number,
  len: number,
  n: number,
  r: number,
  rnd: () => number,
) {
  for (let i = 0; i < n; i++) {
    const a = ang + (i / (n - 1) - 0.5) * 1.15 + (rnd() - 0.5) * 0.18
    const l = len * (0.5 + rnd() * 0.55)
    const ex = x + Math.cos(a) * l
    const ey = y + Math.sin(a) * l
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.cos(ang) * l * 0.45,
      y + Math.sin(ang) * l * 0.45,
      ex,
      ey,
    )
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(ex, ey, r * (0.75 + rnd() * 0.5), 0, Math.PI * 2)
    ctx.stroke()
  }
}

/** A curving stem with leaves paired along it, smaller toward the tip. */
function stem(
  ctx: Ctx,
  x: number,
  y: number,
  ang: number,
  len: number,
  curl: number,
  count: number,
  rnd: () => number,
) {
  const ux = Math.cos(ang)
  const uy = Math.sin(ang)
  const nx = -uy
  const ny = ux
  const p0x = x
  const p0y = y
  const p2x = x + ux * len + nx * curl * len
  const p2y = y + uy * len + ny * curl * len
  const p1x = x + ux * len * 0.5 + nx * curl * len * 0.18
  const p1y = y + uy * len * 0.5 + ny * curl * len * 0.18

  ctx.beginPath()
  ctx.moveTo(p0x, p0y)
  ctx.quadraticCurveTo(p1x, p1y, p2x, p2y)
  ctx.stroke()

  for (let i = 0; i < count; i++) {
    const t = 0.26 + (i / Math.max(1, count - 1)) * 0.7
    const it = 1 - t
    const lx = it * it * p0x + 2 * it * t * p1x + t * t * p2x
    const ly = it * it * p0y + 2 * it * t * p1y + t * t * p2y
    const ta = Math.atan2(
      2 * it * (p1y - p0y) + 2 * t * (p2y - p1y),
      2 * it * (p1x - p0x) + 2 * t * (p2x - p1x),
    )
    const side = i % 2 ? 1 : -1
    // Leaves shorten along the stem, so the sprig tapers instead of ending
    // in a blunt cluster.
    const l = len * 0.42 * (1 - t * 0.46) * (0.88 + rnd() * 0.24)
    leaf(ctx, lx, ly, ta + side * (0.52 + rnd() * 0.14), l, l * 0.23)
  }
}

/**
 * One botanical sprig, fanned from (x, y) and pointing along `angle`.
 * `scale` is the length of its longest stem.
 */
export function drawSprig(
  ctx: Ctx,
  x: number,
  y: number,
  scale: number,
  angle: number,
  seed: number,
  colour = GOLD,
) {
  const rnd = rng(seed)
  ctx.save()
  ctx.strokeStyle = colour
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1, scale * 0.0075)

  const stems = [
    { off: -0.5, len: 0.74, curl: 0.22, n: 4 },
    { off: -0.02, len: 1.0, curl: -0.13, n: 5 },
    { off: 0.46, len: 0.64, curl: -0.28, n: 4 },
  ]
  for (const s of stems) {
    stem(ctx, x, y, angle + s.off, scale * s.len, s.curl, s.n, rnd)
  }

  // The berry sprays sit between the stems, on a finer line than the leaves.
  ctx.lineWidth = Math.max(1, scale * 0.0055)
  berries(
    ctx,
    x + Math.cos(angle - 0.26) * scale * 0.3,
    y + Math.sin(angle - 0.26) * scale * 0.3,
    angle - 0.62,
    scale * 0.42,
    5,
    scale * 0.018,
    rnd,
  )
  berries(
    ctx,
    x + Math.cos(angle + 0.34) * scale * 0.2,
    y + Math.sin(angle + 0.34) * scale * 0.2,
    angle + 0.66,
    scale * 0.34,
    4,
    scale * 0.016,
    rnd,
  )
  ctx.restore()
}

/**
 * The single small sprig struck into the wax: one stem, five leaves, no
 * berries. At the size of a seal anything busier turns to mush.
 */
export function drawSealSprig(
  ctx: Ctx,
  x: number,
  y: number,
  scale: number,
  colour = GOLD,
) {
  const rnd = rng(4211)
  ctx.save()
  ctx.strokeStyle = colour
  ctx.fillStyle = colour
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1, scale * 0.04)

  // Upright, leaning very slightly, with the blades filled rather than
  // outlined — at this size an outline closes up into a blob anyway.
  const ang = -Math.PI / 2 + 0.12
  const ux = Math.cos(ang)
  const uy = Math.sin(ang)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + ux * scale * 0.4, y + uy * scale * 0.4, x + ux * scale, y + uy * scale)
  ctx.stroke()

  for (let i = 0; i < 5; i++) {
    const t = 0.24 + (i / 4) * 0.68
    const lx = x + ux * scale * t
    const ly = y + uy * scale * t
    const side = i % 2 ? 1 : -1
    const l = scale * 0.44 * (1 - t * 0.38)
    const a = ang + side * 0.72
    const cx = Math.cos(a)
    const cy = Math.sin(a)
    const nx = -cy
    const ny = cx
    const wid = l * 0.3
    ctx.beginPath()
    ctx.moveTo(lx, ly)
    ctx.quadraticCurveTo(
      lx + cx * l * 0.45 + nx * wid,
      ly + cy * l * 0.45 + ny * wid,
      lx + cx * l,
      ly + cy * l,
    )
    ctx.quadraticCurveTo(
      lx + cx * l * 0.45 - nx * wid,
      ly + cy * l * 0.45 - ny * wid,
      lx,
      ly,
    )
    ctx.fill()
    rnd()
  }
  ctx.restore()
}
