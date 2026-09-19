import * as THREE from 'three'
import { DAISY_BUMP_URL } from './daisyBump'

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
const MOUTH_MID_Y = 0.26
const MOUTH_SIDE_Y = H / 2
const POCKET_Z = -0.055 // how deep the envelope is

const PAPER = 0xe6d8c6
const PAPER_BACK = 0xdac9b5

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

function sheet(pts: [number, number][], depth = T) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), {
    depth,
    bevelEnabled: false,
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
function waxShape(r = 0.048) {
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

/** The die's flower, as a height field drawn straight to a canvas. */
function waxDieTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#6e6e6e'
  g.fillRect(0, 0, 512, 512)
  // A ring of petals around a clear centre.
  g.translate(256, 256)
  for (let i = 0; i < 18; i++) {
    g.save()
    g.rotate((i * Math.PI * 2) / 18)
    g.beginPath()
    g.ellipse(0, -118, 26, 84, 0, 0, Math.PI * 2)
    g.fillStyle = '#d2d2d2'
    g.fill()
    g.lineWidth = 3
    g.strokeStyle = '#5a5a5a'
    g.stroke()
    g.restore()
  }
  g.beginPath()
  g.arc(0, 0, 44, 0, Math.PI * 2)
  g.fillStyle = '#e6e6e6'
  g.fill()
  g.lineWidth = 3
  g.strokeStyle = '#5a5a5a'
  g.stroke()
  // Same reason as the flower: a ridge needs a ramp, not a cliff.
  const blurred = document.createElement('canvas')
  blurred.width = blurred.height = 512
  const bg = blurred.getContext('2d')!
  bg.filter = 'blur(3px)'
  bg.drawImage(c, 0, 0)
  const tex = new THREE.CanvasTexture(blurred)
  tex.colorSpace = THREE.NoColorSpace
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
function blurredTexture(url: string, w: number, h: number, blur: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  // Mid-grey is the flat plane; it must also back the blur so the edges of
  // the patch do not fall away into black.
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.NoColorSpace
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    g.filter = `blur(${blur}px)`
    g.drawImage(img, 0, 0, w, h)
    g.filter = 'none'
    tex.needsUpdate = true
  }
  img.src = url
  return tex
}

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
  renderer.toneMappingExposure = 0.97
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40)

  // ── Textures ──────────────────────────────────────────────────
  const loader = new THREE.TextureLoader()
  const grain = loader.load('/images/paper-grain.png')
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.repeat.set(3, 2)
  grain.colorSpace = THREE.NoColorSpace

  const daisy = blurredTexture(DAISY_BUMP_URL, 1024, 1331, 4)
  // One bloom, centred across the flap, sitting above the tip where the wax
  // holds it down. Nothing outside that patch should be embossed.
  daisy.wrapS = daisy.wrapT = THREE.ClampToEdgeWrapping
  const dW = 0.245 // fraction of the flap's width the flower occupies
  const dH = 0.76 // ...and of its height
  daisy.repeat.set(1 / dW, 1 / dH)
  daisy.offset.set(-(1 - dW) / 2 / dW, -0.1 / dH)

  const paperMat = new THREE.MeshStandardMaterial({
    color: PAPER,
    roughness: 0.94,
    metalness: 0,
    bumpMap: grain,
    bumpScale: 0.7,
    side: THREE.DoubleSide,
  })
  const backMat = new THREE.MeshStandardMaterial({
    color: PAPER_BACK,
    roughness: 0.96,
    metalness: 0,
    bumpMap: grain,
    bumpScale: 0.6,
    side: THREE.DoubleSide,
  })
  // The flap carries the flower as well as the tooth of the stock.
  const flapMat = new THREE.MeshStandardMaterial({
    color: PAPER,
    roughness: 0.93,
    metalness: 0,
    bumpMap: daisy,
    bumpScale: 5.5,
    side: THREE.DoubleSide,
  })

  const envelope = new THREE.Group()
  scene.add(envelope)

  // ── The envelope as a pocket ──────────────────────────────────
  // An envelope is not a slab. It is two walls with a gap between them, and
  // opening the flap has to reveal that gap — otherwise the flap lifts off a
  // solid sheet and the whole thing reads as a card with a triangle on it.
  //
  //   far wall   the other side of the envelope, seen through the mouth
  //   near wall  the side flaps and bottom flap, glued into a pocket
  //   flap       hinged at the top edge, lying over the mouth when shut

  const far = new THREE.Mesh(
    sheet([
      [-W / 2, -H / 2],
      [W / 2, -H / 2],
      [W / 2, H / 2],
      [-W / 2, H / 2],
    ]),
    new THREE.MeshStandardMaterial({
      color: 0x8c775f,
      roughness: 0.99,
      metalness: 0,
      bumpMap: grain,
      bumpScale: 0.5,
      side: THREE.DoubleSide,
    }),
  )
  far.position.z = POCKET_Z
  far.receiveShadow = true
  scene.add(far)

  // The near wall's top edge is the mouth: a shallow V, low at the centre,
  // which is where a card is pushed in.
  const near = new THREE.Mesh(
    sheet([
      [-W / 2, -H / 2],
      [W / 2, -H / 2],
      [W / 2, MOUTH_SIDE_Y],
      [0.006, MOUTH_MID_Y],
      [-W / 2, MOUTH_SIDE_Y],
    ]),
    backMat,
  )
  near.castShadow = true
  near.receiveShadow = true
  envelope.add(near)

  // The side flaps' inner edges, which give the back its two diagonals.
  const sideL = new THREE.Mesh(
    sheet([
      [-W / 2, MOUTH_SIDE_Y],
      [-0.008, TIP_Y - 0.03],
      [-W / 2, -H / 2],
    ]),
    paperMat,
  )
  sideL.position.z = T
  sideL.castShadow = true
  sideL.receiveShadow = true
  envelope.add(sideL)

  const sideR = new THREE.Mesh(
    sheet([
      [W / 2, MOUTH_SIDE_Y],
      [0.01, TIP_Y - 0.036],
      [W / 2, -H / 2],
    ]),
    paperMat,
  )
  sideR.position.z = T
  sideR.castShadow = true
  sideR.receiveShadow = true
  envelope.add(sideR)

  // The bottom flap folds up last, over both of them.
  const bottom = new THREE.Mesh(
    sheet([
      [-W / 2, -H / 2],
      [W / 2, -H / 2],
      [W * 0.3, TIP_Y - 0.06],
      [-W * 0.3, TIP_Y - 0.066],
    ]),
    paperMat,
  )
  bottom.position.z = T * 2
  bottom.castShadow = true
  bottom.receiveShadow = true
  envelope.add(bottom)

  // ── The pointed flap, on its hinge ────────────────────────────
  // Built with the fold at y = 0 so the group simply turns on X. Rotating
  // forward swings the tip up and back, which is the way a real flap opens.
  const hinge = new THREE.Group()
  hinge.position.set(0, FLAP_HINGE_Y, 0.014)
  envelope.add(hinge)

  const flap = new THREE.Mesh(
    sheet([
      [-W / 2, 0],
      [W / 2, 0],
      [0.016, -FLAP_DROP],
      [-0.016, -FLAP_DROP],
    ]),
    flapMat,
  )
  flap.position.z = 0.012
  flap.castShadow = true
  flap.receiveShadow = true
  hinge.add(flap)

  // ── Wax ───────────────────────────────────────────────────────
  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xb08a55,
    roughness: 0.48,
    metalness: 0.22,
    bumpMap: waxDieTexture(),
    bumpScale: 2.6,
  })
  const waxGeo = new THREE.ExtrudeGeometry(waxShape(), {
    depth: 0.01,
    bevelEnabled: true,
    bevelSize: 0.009,
    bevelThickness: 0.008,
    bevelSegments: 5,
    curveSegments: 3,
  })
  boxUVs(waxGeo)
  const wax = new THREE.Mesh(waxGeo, waxMat)
  wax.position.set(0, TIP_Y + 0.008, 0.032)
  wax.rotation.z = -0.09
  wax.castShadow = true
  envelope.add(wax)

  // ── The surface behind, so the envelope has something to sit on
  // and cast onto. On a phone the crop is tight enough that it never
  // shows; on a desktop it is most of the frame.
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.MeshStandardMaterial({ color: 0x322a23, roughness: 1 }),
  )
  backdrop.position.z = -1.9
  backdrop.receiveShadow = true
  scene.add(backdrop)

  // ── Light ─────────────────────────────────────────────────────
  // One warm key from the upper left decides every shadow in the frame.
  const key = new THREE.DirectionalLight(0xfff0d8, 2.5)
  key.position.set(-1.7, 2.1, 2.6)
  key.castShadow = true
  key.shadow.mapSize.set(768, 768)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 9
  key.shadow.camera.left = -1.6
  key.shadow.camera.right = 1.6
  key.shadow.camera.top = 1.6
  key.shadow.camera.bottom = -1.6
  key.shadow.bias = -0.0012
  key.shadow.radius = 3
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.35)
  fill.position.set(2.2, -0.6, 1.4)
  scene.add(fill)

  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x4a3c30, 0.55))

  // The light shut inside the envelope. Dark until the flap gives.
  const inside = new THREE.PointLight(0xffcf8c, 0, 2.2, 2)
  inside.position.set(0, 0.24, POCKET_Z / 2)
  envelope.add(inside)

  // ── Framing ───────────────────────────────────────────────────
  // Fit by height, always. On a portrait screen that crops the envelope's
  // width hard — which is exactly the close-in framing the whole thing is
  // built around — and on a landscape one it leaves the surface visible
  // around it.
  const LOOK_Y = 0.093
  let baseZ = 3
  function frame() {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const coverH = H * 0.82
    baseZ = coverH / 2 / Math.tan((camera.fov * Math.PI) / 360)
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

    px += (tx - px) * Math.min(1, dt * 3)
    py += (ty - py) * Math.min(1, dt * 3)

    if (opening) {
      const t = (performance.now() - t0) / 1000

      // The wax gives first, then falls away.
      const s = clamp01((t - 0.1) / 0.62)
      wax.position.y = TIP_Y + 0.01 - ease(s) * 0.42
      wax.position.z = T * 4 + ease(s) * 0.22
      wax.rotation.z = -0.09 - ease(s) * 0.7
      wax.rotation.x = ease(s) * 1.1
      waxMat.opacity = 1 - clamp01((t - 0.42) / 0.4)
      waxMat.transparent = true
      wax.visible = waxMat.opacity > 0.01

      // The flap turns back on its fold.
      const f = clamp01((t - 0.46) / 1.5)
      hinge.rotation.x = easeInOut(f) * 2.1

      // And the light that was shut inside comes up.
      inside.intensity = clamp01((t - 0.5) / 0.9) * 3.4

      // The camera gives ground first, so the flap is actually watched
      // opening, and only then dives through the mouth. Pushing in from the
      // start would hold the fold above the top of the frame the whole way.
      const out = ease(clamp01((t - 0.28) / 1.05))
      const dive = ease(clamp01((t - 1.5) / 1.3))
      zoom = 1 + out * 0.24 - dive * 0.78

      if (!revealed && t > 2.25) {
        revealed = true
        opts.onRevealed?.()
      }
      if (!finished && t > 3.2) {
        finished = true
        opts.onFinished?.()
      }
    }

    // Parallax is held back once the sequence is running — two motions
    // fighting over the camera reads as drift, not depth.
    const damp = opening ? 0 : 1
    camera.position.x = px * 0.07 * damp
    camera.position.y = LOOK_Y - py * 0.05 * damp
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
      daisy.dispose()
      renderer.dispose()
    },
  }
}
