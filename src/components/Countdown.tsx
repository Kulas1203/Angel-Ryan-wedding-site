import { useEffect, useState } from 'react'
import { WEDDING_DATE } from '../data/content'
import { Reveal } from './Reveal'
import './Countdown.css'

interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function remaining(): Remaining {
  const diff = Math.max(0, WEDDING_DATE.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  }
}

export function Countdown() {
  const [time, setTime] = useState<Remaining>(remaining)

  useEffect(() => {
    const id = setInterval(() => setTime(remaining()), 1000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ]

  return (
    <section className="countdown" aria-label="Countdown to the wedding">
      <Reveal>
        <div className="countdown__inner">
          {units.map((unit, i) => (
            <div key={unit.label} className="countdown__unit">
              {i > 0 && <span className="countdown__divider" aria-hidden="true" />}
              <div className="countdown__cell">
                <span className="countdown__value">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="countdown__label">{unit.label}</span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
