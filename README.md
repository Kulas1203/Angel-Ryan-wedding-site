# Angel & Ryan — Wedding Site

A luxury, editorial-style wedding landing page for **Angel & Ryan**, celebrating
**October 29, 2026**.

## Stack

- **Vite + React 18 + TypeScript** — fast SPA build
- **Framer Motion** — scroll-triggered reveals, staggered text, magnetic buttons, lightbox & modal transitions
- **Lenis** — buttery smooth scrolling (respects `prefers-reduced-motion`)
- **Playfair Display + Jost** — serif display / geometric sans pairing
- Palette: ivory, alabaster, charcoal ink, with a bronze accent

## Sections

1. **Cinematic hero** — slow-zoom background, parallax on scroll, staggered name reveal
2. **Live countdown** to the wedding day
3. **Our Story** — animated vertical timeline with a scroll-progress spine and alternating image reveals
4. **The Day** — ceremony & reception cards, attire note
5. **Gallery** — fluid masonry grid, lazy-loaded, with keyboard-navigable lightbox
6. **RSVP** — floating pill + modal form with loading state and animated success checkmark

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build
```

## Deploy

`vercel.json` is pre-configured (Vite framework preset, SPA rewrites, immutable
asset caching). Import the repo in Vercel — or run `npx vercel` — and it deploys
with zero extra setup.

## Before launch

- The current photos (`public/images/photo-*.jpg`) are temporary — swap in the
  prenuptial shoot photography when it's ready (keep the same filenames, or
  update `src/data/content.ts` and the hero image in `src/components/Hero.tsx`).
- Edit venue names, times, and story copy in `src/data/content.ts`.
- Wire the RSVP form to a real endpoint (Formspree, Google Forms, or an API
  route) — see the note in `src/components/Rsvp.tsx`; it currently simulates
  submission on the front end.
