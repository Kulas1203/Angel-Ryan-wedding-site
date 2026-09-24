// Three in the afternoon in Butuan City. The offset is explicit on purpose:
// without it the browser reads the string in its own timezone, so a guest
// watching from abroad gets a countdown to three o'clock where they are
// standing rather than to the ceremony.
export const WEDDING_DATE = new Date('2026-10-29T15:00:00+08:00')

/** Everything the "Add to calendar" button needs. */
export const calendarEvent = {
  title: 'Ryan & Angel’s Wedding',
  start: WEDDING_DATE,
  // Ceremony at three, dinner and dancing after; five hours covers the day.
  end: new Date('2026-10-29T20:00:00+08:00'),
  location: 'Pavillion Watergate, Butuan City, Philippines',
  description:
    'Together with their families, Ryan & Angel invite you to celebrate their wedding. Ceremony at three o’clock, with dinner and dancing to follow at the same venue.',
  url: 'https://ryan-angel-wedding.vercel.app/',
  uid: 'ryan-angel-wedding-2026-10-29@ryan-angel-wedding.vercel.app',
}

export const venue = {
  name: 'Pavillion Watergate',
  city: 'Butuan City',
  // A search link rather than a dropped pin: it resolves in the Maps app on
  // a phone and on the web, and does not depend on coordinates that have not
  // been confirmed.
  address: 'Pavillion Watergate, Butuan City, Agusan del Norte, Philippines',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Pavillion Watergate, Butuan City, Philippines'),
  // The same search, rendered inline. Keyless, so there is no API key to
  // leak or to expire the week of the wedding.
  embedUrl:
    'https://www.google.com/maps?output=embed&q=' +
    encodeURIComponent('Pavillion Watergate, Butuan City, Philippines'),
  note:
    'Parking is available on site. The ceremony and the reception are both held here, so there is no travel between them.',
}

export const rsvp = {
  deadlineLabel: 'the twenty-ninth of August',
  deadlineShort: 'August 29, 2026',
  note: 'Kindly reply by August 29, 2026 so we can plan the day around you.',
}

export const couple = {
  names: 'Ryan & Angel',
  dateLabel: 'October 29, 2026',
  hashtag: '#RyanAndAngel2026',
}

export const invitation = {
  opening: 'Together with their families',
  body: 'request the honor of your presence as they exchange vows and celebrate the beginning of their forever',
  date: 'Thursday, the twenty-ninth of October',
  year: 'Two thousand twenty-six',
  time: 'Three o’clock in the afternoon',
  venue: 'Pavillion Watergate',
  city: 'Butuan City',
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
    venue: 'Pavillion Watergate',
    address: 'Butuan City',
    note: 'Doors open at half past two. The ceremony begins promptly.',
  },
  {
    label: 'The Reception',
    time: 'To follow the ceremony',
    venue: 'Pavillion Watergate',
    address: 'Butuan City',
    note: 'Dinner, toasts, and dancing to follow at the same venue.',
  },
] as const

export type ProgramEntry = {
  time: string
  /** 24-hour, for the <time> element a screen reader and a search engine read. */
  iso: string
  title: string
  note: string
}

/** The order of the day. Doors and ceremony are fixed; the hours after them
    are the couple's intended shape for the evening and are easy to adjust. */
export const program: ProgramEntry[] = [
  {
    time: 'Half past two',
    iso: '14:30',
    title: 'Doors open',
    note: 'Guests are welcomed and seated. Please arrive with time to spare.',
  },
  {
    time: 'Three o’clock',
    iso: '15:00',
    title: 'The ceremony',
    note: 'Ryan and Angel are married. The ceremony begins promptly.',
  },
  {
    time: 'Four o’clock',
    iso: '16:00',
    title: 'Cocktails & photographs',
    note: 'Drinks on the terrace while the family portraits are taken.',
  },
  {
    time: 'Half past five',
    iso: '17:30',
    title: 'Dinner & toasts',
    note: 'Guests are seated for dinner, followed by the speeches.',
  },
  {
    time: 'Seven o’clock',
    iso: '19:00',
    title: 'The first dance',
    note: 'The floor opens to everyone once the first dance is done.',
  },
  {
    time: 'Eight o’clock',
    iso: '20:00',
    title: 'Last song',
    note: 'A send-off for the newlyweds to close the evening.',
  },
]

export const dressCode = {
  // The four the dress-code card names, kept as text as well as in the
  // artwork: a guest choosing a dress needs to be able to read them, and the
  // picture may never load.
  palette: ['Sage green', 'Emerald green', 'Beige', 'Cream'],
  label: 'Attire',
  value: 'Formal · Sage, emerald & earth tones',
  note: 'We kindly invite you to dress in garden elegance — sage green, emerald, and warm rustic neutrals are warmly encouraged.',
}
