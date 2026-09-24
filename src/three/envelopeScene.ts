import * as THREE from 'three'

/**
 * The sealed envelope: the photograph itself, mapped onto geometry that can
 * open.
 *
 * The stock, the printed gold, the wax and every highlight on them are the
 * supplied image — nothing here redraws any of it. What the scene adds is the
 * one thing a photograph cannot do: the flap is its own mesh on a hinge, the
 * seal is its own sprite, and the card slides out from behind the paper.
 *
 * Sealed, the flap samples exactly the pixels it covers, so its outline is
 * invisible and the frame is the image. The parts the photograph cannot show
 * — the inside of the envelope, and the paper beneath the wax — are the only
 * places anything is invented, and both are hidden until the seal breaks.
 *
 * Units are envelope widths, taken from the image.
 */

// The envelope's rectangle inside the photograph, in its own pixels, and the
// landmarks measured off it.
const ART = {
  url: '/images/envelope.webp',
  x: 160,
  y: 113,
  w: 1218,
  h: 799,
  /** The flap's point, as a fraction of the envelope's height. */
  flapDrop: 0.6997,
  /** Its rounded shoulders, as a fraction of the width. */
  shoulder: 0.072,
  /** The wax, centred on the flap's point. */
  sealX: 768,
  sealY: 573,
  sealR: 105,
  /** The ground it was photographed on. */
  ground: '#dcd5cc',
}

const W = ART.w / ART.h
const H = 1.0
const T = 0.006 // paper thickness
const FLAP_DROP = ART.flapDrop * H
const FLAP_HINGE_Y = H / 2

const CARD_W = W * 0.9
const CARD_H = H * 0.86

export interface EnvelopeScene {
  open(): void
  dispose(): void
}

interface Options {
  /** Called once the photograph has loaded and the first frame is drawn. */
  onReady?: () => void
  /** Called once the light has taken the frame. */
  onRevealed?: () => void
  /** Called when the whole sequence is finished and the canvas can go. */
  onFinished?: () => void
}

/**
 * Maps a geometry onto the photograph by where it sits on the envelope, not
 * by its own extent. Two meshes that overlap in envelope space therefore
 * sample the same pixels — which is what lets the closed flap vanish into the
 * paper behind it.
 */
function artUVs(geo: THREE.BufferGeometry, offsetY = 0) {
  const pos = geo.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + W / 2) / W
    uv[i * 2 + 1] = (pos.getY(i) + offsetY + H / 2) / H
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

/** Maps a geometry's UVs onto its own bounding box, 0..1 in both axes. */
function boxUVs(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  const sx = bb.max.x - bb.min.x
  const sy = bb.max.y - bb.min.y
  const pos = geo.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / sx
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / sy
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

/** A closed shape from a list of points. */
function shapeFrom(pts: [number, number][]) {
  const s = new THREE.Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1])
  s.closePath()
  return s
}

/**
 * The flap: a wide shallow triangle whose two shoulders and whose point are
 * all rounded, with the long edges bowed very slightly outward. A flap cut
 * to sharp corners reads as a paper dart; the radii are what make it read as
 * stock that was folded.
 */
function flapShape(w = W, drop = FLAP_DROP) {
  const hw = w / 2
  const rc = w * 0.045 // the two top shoulders
  const rt = w * 0.032 // the point
  const len = Math.hypot(hw, drop)
  const ux = -hw / len // along the right edge, corner → point
  const uy = -drop / len
  const nx = -uy // and outward from it
  const ny = ux
  const bow = w * 0.011

  // Where the shoulder rejoins the slanted edge, and where the point's own
  // radius begins.
  const cx = hw + ux * rc
  const cy = uy * rc
  const px = hw + ux * (len - rt)
  const py = uy * (len - rt)
  const mx = (cx + px) / 2 + nx * bow
  const my = (cy + py) / 2 + ny * bow

  const s = new THREE.Shape()
  s.moveTo(-hw + rc, 0)
  s.lineTo(hw - rc, 0)
  s.quadraticCurveTo(hw, 0, cx, cy)
  s.quadraticCurveTo(mx, my, px, py)
  s.quadraticCurveTo(0, -drop, -px, py)
  s.quadraticCurveTo(-mx, my, -cx, cy)
  s.quadraticCurveTo(-hw, 0, -hw + rc, 0)
  s.closePath()
  return s
}

function extrude(shape: THREE.Shape, depth = T) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.0016,
    bevelThickness: 0.0016,
    bevelSegments: 2,
    curveSegments: 14,
  })
  boxUVs(geo)
  return geo
}

function sheet(pts: [number, number][], depth = T) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), {
    depth,
    bevelEnabled: true,
    bevelSize: 0.0016,
    bevelThickness: 0.0016,
    bevelSegments: 2,
    curveSegments: 6,
  })
  boxUVs(geo)
  return geo
}

/**
 * Cuts the photograph into the pieces the scene needs.
 *
 * Three things come out of it:
 *
 *   paper   the envelope, with the wax painted out — the flap and the body
 *           both sample this, so while the flap is shut it is invisible
 *   seal    the wax on its own, with a soft round alpha, free to lift away
 *   mouth   the inside, which the photograph cannot show and which is
 *           therefore the one invented surface, hidden until the flap moves
 *
 * Painting the wax out matters: it straddles the flap's point and the body,
 * so left in the texture it would tear in half the moment the flap turned.
 * The patch is a radial smear from a ring of real pixels just outside the
 * wax, which on paper this even is indistinguishable from the stock.
 */
function cutArt(img: HTMLImageElement) {
  const { x, y, w, h, sealX, sealY, sealR } = ART

  const paper = document.createElement('canvas')
  paper.width = w
  paper.height = h
  const pc = paper.getContext('2d')!
  pc.drawImage(img, x, y, w, h, 0, 0, w, h)

  // The wax, lifted before it is painted over. It is taken with room around
  // it, because the wax casts a shadow onto the paper and the shadow has to
  // travel with it — left behind, it would sit there as a grey ring after the
  // seal had gone.
  const KEEP = sealR * 1.34 // how much of the photograph goes with the wax
  const PATCH = sealR * 1.3 // how much of the paper is repainted
  const RING = sealR * 1.5 // where the paper is sampled from
  const sd = Math.ceil(KEEP * 2)
  const seal = document.createElement('canvas')
  seal.width = seal.height = sd
  const sc = seal.getContext('2d')!
  sc.drawImage(img, sealX - sd / 2, sealY - sd / 2, sd, sd, 0, 0, sd, sd)
  sc.globalCompositeOperation = 'destination-in'
  const fade = sc.createRadialGradient(sd / 2, sd / 2, PATCH, sd / 2, sd / 2, KEEP)
  fade.addColorStop(0, 'rgba(0,0,0,1)')
  fade.addColorStop(1, 'rgba(0,0,0,0)')
  sc.fillStyle = fade
  sc.fillRect(0, 0, sd, sd)

  // Now the patch. Sample a ring of paper outside the wax and sweep each
  // sample inward; then blur what that produced and lay it back inside a
  // feathered circle. The smear alone leaves spokes — the paper around the
  // wax is not one flat colour — and the blur is what turns them back into
  // stock, which under a seal is all this ever needs to be.
  const cx = sealX - x
  const cy = sealY - y
  const spokes = 720
  const patch = document.createElement('canvas')
  patch.width = patch.height = Math.ceil(PATCH * 2)
  const qc = patch.getContext('2d')!
  qc.translate(PATCH, PATCH)
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    const sx2 = Math.max(0, Math.min(w - 1, Math.round(cx + ux * RING)))
    const sy2 = Math.max(0, Math.min(h - 1, Math.round(cy + uy * RING)))
    const d = pc.getImageData(sx2, sy2, 1, 1).data
    qc.strokeStyle = `rgb(${d[0]},${d[1]},${d[2]})`
    qc.lineWidth = (Math.PI * 2 * PATCH) / spokes + 3
    qc.lineCap = 'round'
    qc.beginPath()
    qc.moveTo(ux * PATCH, uy * PATCH)
    qc.lineTo(-ux * 2, -uy * 2)
    qc.stroke()
  }
  qc.setTransform(1, 0, 0, 1, 0, 0)
  qc.globalCompositeOperation = 'destination-in'
  const soft = qc.createRadialGradient(PATCH, PATCH, PATCH * 0.62, PATCH, PATCH, PATCH)
  soft.addColorStop(0, 'rgba(0,0,0,1)')
  soft.addColorStop(1, 'rgba(0,0,0,0)')
  qc.fillStyle = soft
  qc.fillRect(0, 0, PATCH * 2, PATCH * 2)
  pc.save()
  pc.filter = `blur(${Math.round(sealR * 0.2)}px)`
  pc.drawImage(patch, cx - PATCH, cy - PATCH)
  pc.restore()

  // The inside of the envelope: the same stock, in shadow, darkest at the
  // fold where the least light reaches.
  const mouth = document.createElement('canvas')
  mouth.width = 64
  mouth.height = 256
  const mc = mouth.getContext('2d')!
  const g = mc.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#3c4835')
  g.addColorStop(0.45, '#4e5c45')
  g.addColorStop(1, '#67765b')
  mc.fillStyle = g
  mc.fillRect(0, 0, 64, 256)

  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  return { paper: tex(paper), seal: tex(seal), mouth: tex(mouth) }
}

/** The invitation's printed face, so the card that rises out says something. */
function cardFace() {
  const w = 1024
  const h = Math.round(w * (CARD_H / CARD_W))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = '#fbf7ec'
  g.fillRect(0, 0, w, h)

  // A champagne rule inside the trim, the way a card is bordered.
  g.strokeStyle = 'rgba(201, 168, 92, 0.85)'
  g.lineWidth = 3
  g.strokeRect(w * 0.05, h * 0.07, w * 0.9, h * 0.86)
  g.strokeStyle = 'rgba(201, 168, 92, 0.35)'
  g.lineWidth = 2
  g.strokeRect(w * 0.065, h * 0.092, w * 0.87, h * 0.816)

  g.textAlign = 'center'
  g.fillStyle = '#7c7a63'
  g.font = `500 ${Math.round(h * 0.052)}px Jost, system-ui, sans-serif`
  g.letterSpacing = `${Math.round(h * 0.024)}px`
  g.fillText('TOGETHER WITH THEIR FAMILIES', w / 2, h * 0.26)

  g.letterSpacing = '0px'
  g.fillStyle = '#30362f'
  g.font = `400 ${Math.round(h * 0.17)}px 'Cormorant Garamond', Georgia, serif`
  g.fillText('Ryan & Angel', w / 2, h * 0.5)

  g.strokeStyle = 'rgba(201, 168, 92, 0.8)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(w * 0.4, h * 0.585)
  g.lineTo(w * 0.6, h * 0.585)
  g.stroke()

  g.fillStyle = '#65785d'
  g.font = `500 ${Math.round(h * 0.062)}px Jost, system-ui, sans-serif`
  g.letterSpacing = `${Math.round(h * 0.03)}px`
  g.fillText('OCTOBER 29, 2026', w / 2, h * 0.7)
  g.font = `400 ${Math.round(h * 0.046)}px Jost, system-ui, sans-serif`
  g.fillStyle = '#7c7a63'
  g.fillText('PAVILLION WATERGATE', w / 2, h * 0.8)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}


/**
 * Renders an image to a canvas through a blur, and hands back a texture.
 *
 * A bump map shades from the gradient of its height field. Feed it hard
 * edges and you get hard lines with dead flat interiors — scratched line
 * art. The blur puts a ramp on every edge, which is the bevel a press
 * actually leaves in the stock.
 */
export function createEnvelopeScene(
  canvas: HTMLCanvasElement,
  opts: Options = {},
): EnvelopeScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // No tone mapping and no relighting. The photograph already carries its own
  // light, and any second pass over it would be a second opinion about how
  // the paper looked — the colour on screen is the colour in the file.
  renderer.toneMapping = THREE.NoToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40)

  // ── The photograph, in pieces ─────────────────────────────────
  // Unlit throughout, so every mesh shows its pixels exactly. Meshes still
  // cast shadows: the shadow pass uses depth, not the surface material.
  const paperMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  const flapMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  const mouthMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })

  // Two nested groups: the outer one holds the resting attitude and the
  // drift, the inner one is the envelope's own space so the opening maths
  // stays in plain XY.
  const pose = new THREE.Group()
  pose.rotation.set(-0.055, -0.105, 0.02)
  scene.add(pose)

  const envelope = new THREE.Group()
  pose.add(envelope)

  // ── The envelope, front on ─────────────────────────────────────
  // Three sheets and nothing else:
  //
  //   card   the invitation, behind the front and hidden by it
  //   front  one plain panel, so there is no seam for the interior to
  //          show through — every gap bug in this scene came from modelling
  //          the folded back and then looking at it square on
  //   flap   hinged at the top edge, lying over the front when shut
  //
  // The brief's own diagram is an outline, a flap and a seal, and the reveal
  // it asks for is the card rising out. None of that needs the four-flap
  // back, and the back was costing a class of bug it could not pay for.

  const card = new THREE.Mesh(
    sheet([
      [-CARD_W / 2, -CARD_H / 2],
      [CARD_W / 2, -CARD_H / 2],
      [CARD_W / 2, CARD_H / 2],
      [-CARD_W / 2, CARD_H / 2],
    ]),
    new THREE.MeshBasicMaterial({ map: cardFace(), side: THREE.DoubleSide }),
  )
  card.position.z = -0.02
  card.castShadow = true
  envelope.add(card)

  const frontGeo = sheet([
    [-W / 2, -H / 2],
    [W / 2, -H / 2],
    [W / 2, H / 2],
    [-W / 2, H / 2],
  ])
  artUVs(frontGeo)
  const front = new THREE.Mesh(frontGeo, paperMat)
  front.castShadow = true
  envelope.add(front)

  // The inside, over the area the flap covers. Transparent until the flap
  // starts to turn, then it is what the photograph could not show.
  const mouthGeo = extrude(flapShape(), 0.001)
  const mouth = new THREE.Mesh(mouthGeo, mouthMat)
  mouth.position.set(0, FLAP_HINGE_Y, T + 0.003)
  envelope.add(mouth)

  // ── The pointed flap, on its hinge ────────────────────────────
  const hinge = new THREE.Group()
  hinge.position.set(0, FLAP_HINGE_Y, 0.012)
  envelope.add(hinge)

  const flapGeo = extrude(flapShape())
  // Offset by the hinge, because the flap's own coordinates start there.
  artUVs(flapGeo, FLAP_HINGE_Y)
  const flap = new THREE.Mesh(flapGeo, flapMat)
  flap.position.z = 0.01
  flap.castShadow = true
  flap.receiveShadow = true
  hinge.add(flap)

  // ── Wax ───────────────────────────────────────────────────────
  // Lifted straight out of the photograph and given a plane of its own, so it
  // can break away while the paper it was holding down stays put.
  const SEAL_R = (ART.sealR * 1.34) / ART.h
  const waxMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })
  const wax = new THREE.Mesh(new THREE.PlaneGeometry(SEAL_R * 2, SEAL_R * 2), waxMat)
  const SEAL_X = ((ART.sealX - ART.x) / ART.w) * W - W / 2
  const SEAL_Y = H / 2 - ((ART.sealY - ART.y) / ART.h) * H
  wax.position.set(SEAL_X, SEAL_Y, 0.03)
  envelope.add(wax)

  // ── The surface behind, so the envelope has something to sit on
  // and cast onto. On a phone the crop is tight enough that it never
  // shows; on a desktop it is most of the frame.
  // Only the shadow, never the surface. A lit plane behind the envelope has
  // to be lit correctly or it goes muddy, and it can never match the page
  // around the canvas; a shadow-only material is transparent everywhere else,
  // so the ivory of the page itself becomes the stationery the envelope is
  // lying on and the two can never drift apart.
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.ShadowMaterial({ opacity: 0.11 }),
  )
  backdrop.position.z = -0.32
  backdrop.receiveShadow = true
  scene.add(backdrop)

  // ── Light ─────────────────────────────────────────────────────
  // One warm key from the upper left decides every shadow in the frame.
  // One light, and only so the envelope casts. Nothing in the scene is lit
  // by it — the photograph brought its own.
  const key = new THREE.DirectionalLight(0xffffff, 0)
  key.position.set(-0.8, 2.1, 3.4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 0.4
  key.shadow.camera.far = 9
  key.shadow.camera.left = -2.4
  key.shadow.camera.right = 2.4
  key.shadow.camera.top = 2.4
  key.shadow.camera.bottom = -2.4
  key.shadow.bias = -0.0012
  key.shadow.radius = 7
  scene.add(key)

  // ── Framing ───────────────────────────────────────────────────
  // Fit by height, always. On a portrait screen that crops the envelope's
  // width hard — which is exactly the close-in framing the whole thing is
  // built around — and on a landscape one it leaves the surface visible
  // around it.
  // The whole envelope, with room around it, sized as a share of the
  // viewport's width rather than cropped to its height. On a tall phone that
  // leaves a lot of space above and below, which is what the masthead and the
  // cue are for.
  const LOOK_Y = 0.095
  let baseZ = 3
  function frame() {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    const aspect = w / h
    camera.aspect = aspect
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360)

    // The brief sizes the envelope against the viewport's width and names
    // devices, not aspect ratios — about seven eighths of a phone easing to
    // under two thirds of a desktop.
    const t = Math.min(1, Math.max(0, (w - 480) / 720))
    const share = 0.88 + (0.62 - 0.88) * t
    baseZ = W / share / (2 * tanHalf * aspect)

    // Two guards. On a very tall frame the width fit alone would leave the
    // envelope a stamp in the middle; on a short wide one it would grow until
    // it crowded the masthead and the cue off the screen. On a window short
    // enough for the two to disagree, height wins and the envelope comes in
    // under its width share — losing the heading is the worse trade.
    baseZ = Math.min(baseZ, H / 0.24 / (2 * tanHalf))
    baseZ = Math.max(baseZ, H / 0.65 / (2 * tanHalf))

    camera.position.set(0, LOOK_Y, baseZ * zoom)
    camera.lookAt(0, LOOK_Y, 0)
    camera.updateProjectionMatrix()
  }

  // ── Sequence ──────────────────────────────────────────────────
  let zoom = 1
  let t0 = 0
  let opening = false
  let revealed = false
  let finished = false
  let raf = 0
  const clock = new THREE.Clock()

  const ease = (x: number) => 1 - Math.pow(1 - x, 3)
  const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

  // A little parallax while it waits, so the object has volume before
  // anything is pressed.
  let px = 0
  let py = 0
  let tx = 0
  let ty = 0
  const onPointer = (e: PointerEvent) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2
    ty = (e.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  function tick() {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(clock.getDelta(), 0.05)

    px += (tx - px) * Math.min(1, dt * 2.6)
    py += (ty - py) * Math.min(1, dt * 2.6)

    // Left alone it keeps moving, slowly and off-rhythm on each axis so the
    // loop never announces itself. This is most of what makes the thing feel
    // held rather than printed.
    const now = performance.now() / 1000
    const idle = opening ? 0 : 1
    pose.rotation.x = -0.055 + (py * 0.1 + Math.sin(now * 0.41) * 0.022) * idle
    pose.rotation.y = -0.105 + (px * 0.22 + Math.sin(now * 0.29 + 1.3) * 0.03) * idle
    pose.rotation.z = 0.02 + Math.sin(now * 0.23 + 2.1) * 0.012 * idle
    pose.position.y = Math.sin(now * 0.35) * 0.012 * idle

    if (opening) {
      const t = (performance.now() - t0) / 1000

      // The envelope squares up on its vertical axis and tips its top toward
      // the viewer, which is what brings the raised flap up into the frame
      // behind the mouth. Square on, the flap opens straight away from the
      // camera and disappears behind the body, and then nothing on screen
      // says "envelope" at the moment it is supposed to say it most.
      const settle = ease(clamp01(t / 0.8))
      pose.rotation.x = -0.055 + (0.3 - -0.055) * settle
      pose.rotation.y = -0.105 * (1 - settle)
      pose.rotation.z = 0.02 * (1 - settle)
      pose.position.y = 0

      // The wax gives first, then falls away.
      const sealT = clamp01((t - 0.05) / 0.5)
      wax.position.y = SEAL_Y - ease(sealT) * 0.4
      wax.position.z = 0.03 + ease(sealT) * 0.22
      wax.rotation.z = -ease(sealT) * 0.7
      wax.rotation.x = ease(sealT) * 1.1
      const sealFade = 1 - clamp01((t - 0.36) / 0.34)
      waxMat.opacity = sealFade
      wax.visible = sealFade > 0.01

      // The flap lifts on its fold, stopping short of flat so it still shows
      // its face rather than turning into a line.
      const f = clamp01((t - 0.3) / 0.9)
      hinge.rotation.x = easeInOut(f) * 1.92

      // Behind it, the inside comes up. It has to arrive before the flap has
      // turned far enough to show what is under it, or the paper the flap was
      // lying on is briefly its own photograph again.
      mouthMat.opacity = clamp01((t - 0.3) / 0.22)
      // And the flap's face goes into shade as it turns away from the light
      // the photograph was lit by.
      const shade = 1 - easeInOut(f) * 0.42
      flapMat.color.setRGB(shade, shade, shade)

      // And the card rises out of the envelope.
      // The card rises without ever coming forward, so it stays inside the
      // envelope: what shows is the part that has cleared the top edge, and
      // the rest is behind the paper where it belongs. Bringing it toward the
      // camera instead makes it cross in front of the envelope's own inside,
      // and a card that floats over the pocket it is supposedly still in is
      // the one thing that gives the whole illusion away.
      const c = clamp01((t - 0.72) / 1.05)
      card.position.y = easeInOut(c) * 0.62

      // The camera gives a little ground so the card has somewhere to go.
      zoom = 1 + ease(clamp01((t - 0.3) / 1.1)) * 0.42

      if (!revealed && t > 1.95) {
        revealed = true
        opts.onRevealed?.()
      }
      if (!finished && t > 2.6) {
        finished = true
        opts.onFinished?.()
      }
    }

    // The pose carries the parallax now, so the camera only ever dollies.
    // Moving both at once reads as drift rather than depth.
    camera.position.x = 0
    camera.position.y = LOOK_Y
    camera.position.z = baseZ * zoom
    camera.lookAt(0, LOOK_Y, 0)

    renderer.render(scene, camera)
  }

  // Nothing is shown until the photograph is here: an envelope that arrives
  // as flat colour and then becomes a picture is worse than one that waits.
  const img = new Image()
  img.decoding = 'async'
  img.onload = () => {
    const art = cutArt(img)
    paperMat.map = art.paper
    flapMat.map = art.paper
    mouthMat.map = art.mouth
    waxMat.map = art.seal
    paperMat.needsUpdate = true
    flapMat.needsUpdate = true
    mouthMat.needsUpdate = true
    waxMat.needsUpdate = true
    opts.onReady?.()
  }
  img.src = ART.url

  const onResize = () => frame()
  window.addEventListener('resize', onResize)
  frame()
  tick()

  return {
    open() {
      if (opening) return
      opening = true
      t0 = performance.now()
    },
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      renderer.dispose()
    },
  }
}
