import { calendarEvent } from '../data/content'

/**
 * Builds the .ics the "Add to calendar" button hands over.
 *
 * Written out by hand rather than pulled from a library: the file is thirteen
 * lines, and the three things that actually break it — CRLF endings, escaping
 * in text values, and folding long lines — are each a couple of lines of code.
 * Outlook in particular will reject the file outright over any of them rather
 * than degrade, so they are not optional.
 */

/** RFC 5545 wants UTC stamps as YYYYMMDDTHHMMSSZ, with no punctuation. */
function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Commas, semicolons and backslashes are delimiters inside a text value. */
function escape(s: string) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Lines run to 75 octets, continued by CRLF plus one leading space. Measured
 * in octets, not characters — the names here are plain ASCII, but the venue
 * and description are not guaranteed to be.
 */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let cur = ''
  let len = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    if (len + n > (out.length === 0 ? 75 : 74)) {
      out.push(cur)
      cur = ''
      len = 0
    }
    cur += ch
    len += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

export function weddingIcs(): string {
  const { start, end, title, location, description, url, uid } = calendarEvent
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ryan and Angel//Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(description)}`,
    `URL:${escape(url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Hands the file to the browser, which on a phone opens the calendar app. */
export function downloadWeddingIcs() {
  const blob = new Blob([weddingIcs()], { type: 'text/calendar;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = 'ryan-and-angel-wedding.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoked on the next tick: Safari needs the URL to outlive the click.
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
