// Downloads the site photos from the GitHub repo when they aren't present
// locally — used by connector-based deployments that ship source files only.
// Locally (and in a full git checkout) the files already exist, so this is
// a no-op. Runs automatically via the `prebuild` npm script.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const RAW_BASE =
  'https://raw.githubusercontent.com/Kulas1203/Angel-Ryan-wedding-site/claude/angel-ralph-wedding-site-emn6u0/public/images'

const photos = [
  'photo-bouquet.jpg',
  'photo-garden-bench.jpg',
  'photo-hiraya.jpg',
  'photo-overlook-portrait.jpg',
  'photo-overlook-view.jpg',
]

const dir = new URL('../public/images/', import.meta.url).pathname
mkdirSync(dir, { recursive: true })

for (const name of photos) {
  const dest = `${dir}${name}`
  if (existsSync(dest)) continue
  const res = await fetch(`${RAW_BASE}/${name}`)
  if (!res.ok) throw new Error(`Failed to fetch ${name}: HTTP ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  console.log('fetched', name)
}
