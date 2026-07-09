export const WEDDING_DATE = new Date('2026-10-29T15:00:00')

export const couple = {
  names: 'Angel & Ryan',
  dateLabel: 'October 29, 2026',
  hashtag: '#AngelAndRyan2026',
}

export const storyQuote =
  'From a simple meeting in faith to a lifetime of love.'

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
    year: 'Pinamanculan, Butuan City',
    title: 'Rooted in Faith',
    body: 'It began where the best journeys do — in faith. At a humble church in Pinamanculan, Butuan City, friendly hellos and shared moments of worship quietly blossomed into something much deeper.',
    image: '/images/photo-overlook-portrait.jpg',
  },
  {
    index: '02',
    year: 'The Courtship',
    title: 'The First Yes',
    body: 'Ryan knew right away that Angel was someone truly special, so he took the leap and courted her. Asking her to be his was the best decision he ever made — and his heart soared when she finally said yes.',
    image: '/images/photo-hiraya.jpg',
  },
  {
    index: '03',
    year: 'Eleven Years & Ten Months',
    title: 'Growing Up Together',
    body: 'They navigated life side by side — growing up together, supporting each other’s dreams, and building a foundation of trust, laughter, and unbreakable companionship. Through every high and low, their love only deepened.',
    image: '/images/photo-garden-bench.jpg',
  },
  {
    index: '04',
    year: 'Angel’s Birthday',
    title: 'The Easiest Yes',
    body: 'After nearly a dozen years of beautiful memories, Ryan waited for a very special day. On Angel’s birthday, he got down on one knee and asked his best friend to marry him. She said yes — all over again.',
    image: '/images/photo-bouquet.jpg',
  },
]

export const storyClosing = {
  label: 'The Next Chapter',
  body: 'From that church in Butuan City to the wedding altar, our journey has been nothing short of a blessing. On October 29, 2026, we will stand together and vow to spend the rest of our lives as husband and wife — and we can’t wait to celebrate with all of our family and friends.',
}

export interface GalleryItem {
  src: string
  alt: string
  caption: string
}

export const gallery: GalleryItem[] = [
  {
    src: '/images/photo-overlook-view.jpg',
    alt: 'Angel and Ryan gazing at the mountains',
    caption: 'Looking ahead, together',
  },
  {
    src: '/images/photo-hiraya.jpg',
    alt: 'Angel and Ryan at the Hiraya sign',
    caption: 'Hiraya',
  },
  {
    src: '/images/photo-bouquet.jpg',
    alt: 'White bouquet with eucalyptus',
    caption: 'The bouquet',
  },
  {
    src: '/images/photo-overlook-portrait.jpg',
    alt: 'Angel and Ryan at the mountain overlook',
    caption: 'Above the valley',
  },
  {
    src: '/images/photo-garden-bench.jpg',
    alt: 'Angel and Ryan in the garden',
    caption: 'A quiet moment',
  },
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
