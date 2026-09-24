import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { drawSealSprig, drawSprig } from './botanical'

/**
 * The sealed envelope, as an actual object in a lit scene.
 *
 * The flap is hinged geometry that turns on its fold, the daisy is a height
 * field the key light rakes across, and the wax is a bevelled solid. None of
 * it is painted: move the camera and every highlight and shadow moves with
 * it, which is the part a stack of CSS gradients can never do.
 *
 * Units are envelope widths. The paper is 1.45 x 1.0 with a 0.62 flap, which
 * is roughly a squat invitation envelope.
 */

const W = 1.45
const H = 1.0
const T = 0.006 // paper thickness
const FLAP_DROP = 0.62 * H // how far the pointed flap reaches down
const FLAP_HINGE_Y = H / 2
const TIP_Y = FLAP_HINGE_Y - FLAP_DROP
// The mouth of the pocket: a shallow V, low at the centre. The flap's tip
// reaches below it, which is what holds a card in.

const CARD_W = W * 0.93
const CARD_H = H * 0.88

const PAPER_HEX = '#87977a'

export interface EnvelopeScene {
  open(): void
  dispose(): void
}

interface Options {
  /** Called once the light has taken the frame. */
  onRevealed?: () => void
  /** Called when the whole sequence is finished and the canvas can go. */
  onFinished?: () => void
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
 * The wax: a near-round blob with a few lobes where the drop ran further and
 * a ragged set edge, bevelled so the lip catches light. A perfect cylinder
 * reads as a stamped button rather than something poured.
 */
function waxShape(r = 0.066) {
  const pts: [number, number][] = []
  let seed = 7723
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
  const harm = [2, 3, 5].map((k) => ({ k, amp: (rnd() * 0.02 + 0.012) * (3 / k), ph: rnd() * Math.PI * 2 }))
  const lobes = [
    { at: 0.16, amp: 0.045, w: 0.07 },
    { at: 0.55, amp: 0.058, w: 0.055 },
    { at: 0.81, amp: 0.034, w: 0.085 },
  ]
  for (let i = 0; i < 64; i++) {
    const t = i / 64
    const a = t * Math.PI * 2
    let rr = 1
    for (const h of harm) rr += h.amp * Math.sin(h.k * a + h.ph)
    for (const l of lobes) {
      let d = Math.abs(t - l.at)
      d = Math.min(d, 1 - d)
      rr += l.amp * Math.exp(-((d / l.w) ** 2))
    }
    rr += (rnd() - 0.5) * 0.02
    pts.push([Math.cos(a) * r * rr, Math.sin(a) * r * rr])
  }
  return shapeFrom(pts)
}

/** A canvas of the bare stock, ready to be printed on. */
function stock(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = PAPER_HEX
  ctx.fillRect(0, 0, w, h)
  return { c, ctx }
}

function canvasTex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/**
 * The flap's face: the stock with one sprig inside the upper-left shoulder.
 *
 * The canvas is laid across the flap's bounding box, and CanvasTexture flips
 * on load, so the top of the canvas is the top of the flap and the art can be
 * placed by eye.
 */
function flapFace() {
  const w = 1400
  const h = Math.round(w * (FLAP_DROP / W))
  const { c, ctx } = stock(w, h)
  drawSprig(ctx, w * 0.135, h * 0.3, w * 0.185, -0.3, 91)
  return canvasTex(c)
}

/** The body, with the larger sprig low on the right where the flap's edge
    leaves the stock bare. */
function frontFace() {
  const w = 1400
  const h = Math.round(w * (H / W))
  const { c, ctx } = stock(w, h)

  // This is the back of the envelope — it has to be, or there would be no
  // flap to open — so the two side flaps folded in underneath show as faint
  // creases converging below the seal. Each is drawn as a shadow with a lit
  // side beside it, because that is all a crease in paper is.
  ctx.lineWidth = Math.max(1.5, w * 0.0014)
  const crease = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.strokeStyle = 'rgba(58, 70, 50, 0.16)'
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(232, 240, 220, 0.16)'
    ctx.beginPath()
    ctx.moveTo(x0, y0 + ctx.lineWidth)
    ctx.lineTo(x1, y1 + ctx.lineWidth)
    ctx.stroke()
  }
  crease(0, h * 0.29, w * 0.5, h * 0.82)
  crease(w, h * 0.29, w * 0.5, h * 0.82)

  drawSprig(ctx, w * 0.945, h * 0.95, w * 0.2, -2.05, 17)
  return canvasTex(c)
}

/** The small gold sprig struck into the middle of the wax. */
function sealEmblemTexture() {
  const s = 320
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  drawSealSprig(ctx, s * 0.5, s * 0.87, s * 0.74)
  return canvasTex(c)
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()

  // Without this every material falls back to flat diffuse shading, however
  // its roughness is set — there is simply nothing for it to reflect. A small
  // room, prefiltered, gives the stock something to pick up along its folds
  // and edges, and is most of what separates paper from clay.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.3
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40)

  // ── Textures ──────────────────────────────────────────────────
  const loader = new THREE.TextureLoader()
  const grain = loader.load('/images/paper-grain.png')
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.repeat.set(3, 2)
  grain.colorSpace = THREE.NoColorSpace

  const printed = { flap: flapFace(), front: frontFace() }

  const paperMat = new THREE.MeshPhysicalMaterial({
    map: printed.front,
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0,
    sheen: 0.35,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color(0xf6ecd8),
    specularIntensity: 0.22,
    bumpMap: grain,
    bumpScale: 0.55,
    side: THREE.DoubleSide,
  })
  // The flap carries its own sprig, so it needs its own map.
  const flapMat = new THREE.MeshPhysicalMaterial({
    map: printed.flap,
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0,
    sheen: 0.35,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color(0xf6ecd8),
    specularIntensity: 0.22,
    bumpMap: grain,
    bumpScale: 0.5,
    side: THREE.DoubleSide,
  })

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
    new THREE.MeshPhysicalMaterial({
      color: 0xfbf7ec,
      roughness: 0.7,
      metalness: 0,
      sheen: 0.8,
      sheenRoughness: 0.7,
      sheenColor: new THREE.Color(0xfffaf0),
      map: cardFace(),
      bumpMap: grain,
      bumpScale: 0.35,
      side: THREE.DoubleSide,
    }),
  )
  card.position.z = -0.02
  card.castShadow = true
  envelope.add(card)

  const front = new THREE.Mesh(
    sheet([
      [-W / 2, -H / 2],
      [W / 2, -H / 2],
      [W / 2, H / 2],
      [-W / 2, H / 2],
    ]),
    paperMat,
  )
  front.castShadow = true
  front.receiveShadow = true
  envelope.add(front)

  // ── The pointed flap, on its hinge ────────────────────────────
  const hinge = new THREE.Group()
  hinge.position.set(0, FLAP_HINGE_Y, 0.012)
  envelope.add(hinge)

  const flap = new THREE.Mesh(extrude(flapShape()), flapMat)
  flap.position.z = 0.01
  flap.castShadow = true
  flap.receiveShadow = true
  hinge.add(flap)

  // ── Wax ───────────────────────────────────────────────────────
  const waxMat = new THREE.MeshPhysicalMaterial({
    color: 0x4d6146,
    roughness: 0.34,
    metalness: 0.06,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    bumpMap: grain,
    bumpScale: 0.3,
  })
  const SEAL_R = 0.075
  const waxGeo = new THREE.ExtrudeGeometry(waxShape(SEAL_R), {
    depth: 0.012,
    bevelEnabled: true,
    bevelSize: 0.007,
    bevelThickness: 0.006,
    bevelSegments: 5,
    curveSegments: 3,
  })
  boxUVs(waxGeo)

  // The wax is one object that moves as one, so the disc, its bead and the
  // emblem are parented together rather than having their transforms copied
  // frame by frame.
  const wax = new THREE.Group()
  const waxDisc = new THREE.Mesh(waxGeo, waxMat)
  waxDisc.castShadow = true
  wax.add(waxDisc)

  // The bead: wax that squeezed out under the die and set proud of the rim.
  // It is the single feature that most distinguishes a struck seal from a
  // printed dot, so it is real geometry rather than a highlight.
  const bead = new THREE.Mesh(
    new THREE.TorusGeometry(SEAL_R * 0.845, SEAL_R * 0.125, 12, 64),
    waxMat,
  )
  bead.position.z = 0.019
  bead.castShadow = true
  wax.add(bead)

  wax.position.set(0, TIP_Y + 0.008, 0.03)
  wax.rotation.z = -0.09
  envelope.add(wax)

  // The botanical emblem, in champagne gold. Its own mesh rather than more
  // relief in the wax: the brief asks for gold on green, and a bump map can
  // only ever give a lighter shade of whatever is underneath it.
  const emblemMat = new THREE.MeshPhysicalMaterial({
    map: sealEmblemTexture(),
    transparent: true,
    depthWrite: false,
    roughness: 0.26,
    metalness: 0.85,
    clearcoat: 0.3,
  })
  const emblem = new THREE.Mesh(
    new THREE.PlaneGeometry(SEAL_R * 1.4, SEAL_R * 1.4),
    emblemMat,
  )
  emblem.position.z = 0.0205
  wax.add(emblem)

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
  const key = new THREE.DirectionalLight(0xfff3e0, 1.45)
  key.position.set(-0.8, 2.1, 3.4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 12
  key.shadow.camera.left = -2.4
  key.shadow.camera.right = 2.4
  key.shadow.camera.top = 2.4
  key.shadow.camera.bottom = -2.4
  key.shadow.bias = -0.0012
  key.shadow.radius = 7
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.16)
  fill.position.set(2.2, -0.6, 1.4)
  scene.add(fill)

  // Separates the silhouette from the ground behind it. Without a rim the
  // envelope's outline dissolves into the backdrop and it stops being an
  // object sitting in front of something.
  const rim = new THREE.DirectionalLight(0xffe2b4, 0.5)
  rim.position.set(1.6, 1.4, -2.2)
  scene.add(rim)

  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x4a3c30, 0.1))

  // The light shut inside the envelope. Dark until the flap gives.
  const inside = new THREE.PointLight(0xffcf8c, 0, 2.2, 2)
  inside.position.set(0, 0.2, -0.05)
  envelope.add(inside)

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
      wax.position.y = TIP_Y + 0.008 - ease(sealT) * 0.4
      wax.position.z = 0.03 + ease(sealT) * 0.2
      wax.rotation.z = -0.09 - ease(sealT) * 0.7
      wax.rotation.x = ease(sealT) * 1.1
      const sealFade = 1 - clamp01((t - 0.36) / 0.34)
      waxMat.transparent = true
      emblemMat.transparent = true
      waxMat.opacity = sealFade
      emblemMat.opacity = sealFade
      wax.visible = sealFade > 0.01

      // The flap lifts on its fold, stopping short of flat so it still shows
      // its face rather than turning into a line.
      const f = clamp01((t - 0.3) / 0.9)
      hinge.rotation.x = easeInOut(f) * 1.92

      // And the card rises out of the envelope.
      // The card comes up through the mouth and forward, clearing the paper
      // without climbing over the open flap behind it.
      const c = clamp01((t - 0.72) / 1.05)
      card.position.y = easeInOut(c) * 0.46
      card.position.z = -0.02 + easeInOut(c) * 0.2

      // The light shut inside comes up behind it.
      inside.intensity = clamp01((t - 0.5) / 0.7) * 1.1

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
      grain.dispose()
      renderer.dispose()
    },
  }
}
