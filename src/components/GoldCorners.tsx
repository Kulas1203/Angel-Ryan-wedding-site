/**
 * Champagne botanical line art at the four corners of the invitation.
 *
 * One sprig, drawn once and mirrored into each corner, so the frame reads as
 * a set rather than four unrelated drawings. Kept to hairlines at low opacity:
 * the brief is a decorated corner, not a border, and the envelope has to stay
 * the thing you look at.
 */

const SPRIG =
  'M4 4C22 9 36 20 46 35M4 4C9 22 20 36 35 46' +
  'M14 11C20 12 25 16 28 22M11 14C12 20 16 25 22 28'

const LEAF = (x: number, y: number, r: number) =>
  `M${x} ${y}c5 -3 11 -1 14 4c-5 3 -11 1 -14 -4Z`.replace(
    /^M/,
    `M`,
  ) + `|${r}`

/** A few leaves hung off the sprig, each at its own angle. */
const LEAVES: [number, number, number][] = [
  [30, 18, -18],
  [44, 30, -6],
  [18, 30, 52],
  [30, 44, 66],
]

export function GoldCorners() {
  return (
    <div className="corners" aria-hidden="true">
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <svg key={corner} className={`corners__sprig corners__sprig--${corner}`} viewBox="0 0 60 60">
          <path className="corners__stem" d={SPRIG} />
          {LEAVES.map(([x, y, rot], i) => {
            const [d] = LEAF(x, y, rot).split('|')
            return (
              <path
                key={i}
                className="corners__leaf"
                d={d}
                transform={`rotate(${rot} ${x} ${y})`}
              />
            )
          })}
        </svg>
      ))}
    </div>
  )
}
