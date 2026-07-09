export const WEDDING_DATE = new Date('2026-10-29T15:00:00')

export const couple = {
  names: 'Angel & Ryan',
  dateLabel: 'October 29, 2026',
  hashtag: '#AngelAndRyan2026',
}

export interface TimelineEntry {
  index: string
  year: string
  title: string
  body: string
  image: string
}

export const timeline: TimelineEntry[] = [
  {
    index: '01',
    year: '2019',
    title: 'A Chance Encounter',
    body: 'It began the way the best stories do — unplanned. A mutual friend, a crowded room, and a conversation neither of them wanted to end.',
    image: '/images/story-1.svg',
  },
  {
    index: '02',
    year: '2021',
    title: 'The First Adventure',
    body: 'A spontaneous road trip with a broken playlist and no itinerary. Somewhere along the coast, "you and me" quietly became "us."',
    image: '/images/story-2.svg',
  },
  {
    index: '03',
    year: '2024',
    title: 'Building a Life',
    body: 'Keys to a first home, a kitchen that always smells like something burning, and the certainty that home was never the address — it was each other.',
    image: '/images/story-3.svg',
  },
  {
    index: '04',
    year: '2025',
    title: 'She Said Yes',
    body: 'At golden hour, with trembling hands and a ring hidden for three long months, Ryan asked. Angel cried before he finished the question.',
    image: '/images/story-4.svg',
  },
]

export interface GalleryItem {
  src: string
  alt: string
  caption: string
}

export const gallery: GalleryItem[] = [
  { src: '/images/gallery-1.svg', alt: 'Engagement portrait', caption: 'The engagement · I' },
  { src: '/images/gallery-2.svg', alt: 'Golden hour walk', caption: 'Golden hour' },
  { src: '/images/gallery-3.svg', alt: 'City evening', caption: 'City lights' },
  { src: '/images/gallery-4.svg', alt: 'Quiet moment', caption: 'A quiet moment' },
  { src: '/images/gallery-5.svg', alt: 'The ring', caption: 'The ring' },
  { src: '/images/gallery-6.svg', alt: 'Coastal trip', caption: 'The coast, 2021' },
  { src: '/images/gallery-7.svg', alt: 'Dancing', caption: 'First dance rehearsal' },
  { src: '/images/gallery-8.svg', alt: 'Home', caption: 'Home' },
  { src: '/images/gallery-9.svg', alt: 'Together', caption: 'Always' },
]

export const details = [
  {
    label: 'The Ceremony',
    time: 'Three o’clock in the afternoon',
    venue: 'The Glasshouse Conservatory',
    address: 'One Garden Terrace',
    note: 'Doors open at half past two. The ceremony begins promptly.',
  },
  {
    label: 'The Reception',
    time: 'Six o’clock in the evening',
    venue: 'The Meridian Ballroom',
    address: 'Twelve Vine & Main',
    note: 'Dinner, toasts, and dancing until midnight.',
  },
] as const

export const dressCode = {
  label: 'Attire',
  value: 'Formal · Black tie optional',
  note: 'We kindly invite you to dress in evening elegance — deep neutrals warmly encouraged.',
}
