// Downloads binary assets (photos, monogram, self-hosted font) from the
// GitHub repo when they aren't present locally — used by connector-based
// deployments that ship text source files only. Locally (and in a full git
// checkout) the files already exist, so this is a no-op. Runs automatically
// via the `prebuild` npm script.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const RAW_BASE =
  'https://raw.githubusercontent.com/Kulas1203/Angel-Ryan-wedding-site/claude/angel-ralph-wedding-site-emn6u0/public'

// Paths relative to public/.
const assets = [
  'images/monogram.webp',
  'images/monogram-ivory.webp',
  'images/og.jpg',
  'images/paper-grain.png',
  'images/photo-bouquet.jpg',
  'images/photo-garden-bench.jpg',
  'images/photo-hiraya.jpg',
  'images/photo-overlook-portrait.jpg',
  'images/photo-overlook-view.jpg',
  'fonts/alex-brush-latin.woff2',
]

const publicDir = new URL('../public/', import.meta.url).pathname

for (const rel of assets) {
  const dest = `${publicDir}${rel}`
  if (existsSync(dest)) continue
  mkdirSync(dirname(dest), { recursive: true })
  const res = await fetch(`${RAW_BASE}/${rel}`)
  if (!res.ok) throw new Error(`Failed to fetch ${rel}: HTTP ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  console.log('fetched', rel)
}
