import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MagneticButton } from './MagneticButton'
import { couple } from '../data/content'
import './Rsvp.css'

type Status = 'idle' | 'submitting' | 'success' | 'error'

// RSVPs are emailed to the couple via FormSubmit (no backend needed).
// Replies go to the primary address below and are CC'd to the second.
const RSVP_ENDPOINT = 'https://formsubmit.co/ajax/rysarsuelo2@gmail.com'
const RSVP_CC = 'calumbaangel@gmail.com'

interface RsvpProps {
  open: boolean
  onClose: () => void
}

export function Rsvp({ open, onClose }: RsvpProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [attending, setAttending] = useState<'yes' | 'no'>('yes')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Reset the form a moment after closing so the exit animation stays clean.
  useEffect(() => {
    if (open) return
    const id = setTimeout(() => setStatus('idle'), 500)
    return () => clearTimeout(id)
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'submitting') return
    const data = new FormData(e.currentTarget)
    setStatus('submitting')
    try {
      const res = await fetch(RSVP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'New RSVP — Angel & Ryan Wedding',
          _template: 'table',
          _cc: RSVP_CC,
          name: data.get('name'),
          email: data.get('email'),
          attending:
            data.get('attending') === 'yes' ? 'Joyfully accepts' : 'Regretfully declines',
          guests: data.get('guests') ?? '—',
          dietary: data.get('dietary') || '—',
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="rsvp"
          role="dialog"
          aria-modal="true"
          aria-label="RSVP"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
        >
          <motion.div
            className="rsvp__panel"
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="rsvp__close" onClick={onClose} aria-label="Close RSVP form">
              ✕
            </button>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  className="rsvp__success"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <svg viewBox="0 0 64 64" className="rsvp__check" aria-hidden="true">
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill="none"
                      stroke="var(--emerald)"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                    <motion.path
                      d="M20 33 L28.5 41.5 L45 24"
                      fill="none"
                      stroke="var(--emerald)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
                    />
                  </svg>
                  <h3>
                    {attending === 'yes' ? 'We cannot wait to see you' : 'You will be missed'}
                  </h3>
                  <p>
                    {attending === 'yes'
                      ? `Your reply is in. October 29, 2026 — see you there.`
                      : 'Thank you for letting us know. You will be in our hearts.'}
                  </p>
                  <button className="rsvp__done" onClick={onClose}>
                    Close
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  className="rsvp__form"
                  onSubmit={handleSubmit}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="eyebrow">Kindly reply</p>
                  <h3 className="rsvp__title">RSVP</h3>
                  <p className="rsvp__sub">
                    {couple.names} · {couple.dateLabel}
                  </p>

                  <label className="rsvp__field">
                    <span>Full name</span>
                    <input type="text" name="name" required autoComplete="name" placeholder="Your name" />
                  </label>

                  <label className="rsvp__field">
                    <span>Email</span>
                    <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
                  </label>

                  <fieldset className="rsvp__attend">
                    <legend>Will you be attending?</legend>
                    <div className="rsvp__attend-options">
                      <label className={attending === 'yes' ? 'is-active' : ''}>
                        <input
                          type="radio"
                          name="attending"
                          value="yes"
                          checked={attending === 'yes'}
                          onChange={() => setAttending('yes')}
                        />
                        Joyfully accepts
                      </label>
                      <label className={attending === 'no' ? 'is-active' : ''}>
                        <input
                          type="radio"
                          name="attending"
                          value="no"
                          checked={attending === 'no'}
                          onChange={() => setAttending('no')}
                        />
                        Regretfully declines
                      </label>
                    </div>
                  </fieldset>

                  {attending === 'yes' && (
                    <div className="rsvp__row">
                      <label className="rsvp__field">
                        <span>Guests</span>
                        <select name="guests" defaultValue="1">
                          <option value="1">Just me</option>
                          <option value="2">Two of us</option>
                        </select>
                      </label>
                      <label className="rsvp__field">
                        <span>Dietary notes</span>
                        <input type="text" name="dietary" placeholder="Optional" />
                      </label>
                    </div>
                  )}

                  <MagneticButton
                    type="submit"
                    className="rsvp__submit"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? (
                      <span className="rsvp__spinner" aria-label="Sending" />
                    ) : status === 'error' ? (
                      'Try again'
                    ) : (
                      'Send reply'
                    )}
                  </MagneticButton>

                  {status === 'error' && (
                    <p className="rsvp__error" role="alert">
                      We couldn’t send your reply just now. Please try again in a
                      moment — or message the couple directly.
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Floating pill that summons the RSVP modal. */
export function RsvpFab({ onOpen, visible }: { onOpen: () => void; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="rsvp-fab"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <MagneticButton className="rsvp-fab__btn" onClick={onOpen} strength={0.45}>
            RSVP
          </MagneticButton>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
