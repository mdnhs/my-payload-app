'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

interface BookingFormProps {
  mentorId: string
  mentorName: string
  hourlyRate: number
  sessionDurations: string[]
  introCallFree: boolean
}

const css = `
  .bf-card {
    position: sticky;
    top: 90px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 22px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .bf-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #C9FF47, transparent 70%);
    border-radius: 22px 22px 0 0;
  }

  .bf-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: 1.15rem;
    color: #F5F5F5;
    letter-spacing: -0.02em;
  }

  .bf-subtitle {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    color: rgba(245,245,245,0.35);
    margin-top: 2px;
  }

  .bf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bf-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: rgba(245,245,245,0.35);
  }

  .bf-input,
  .bf-select,
  .bf-textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 11px 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.88rem;
    color: #F5F5F5;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .bf-input:focus,
  .bf-select:focus,
  .bf-textarea:focus {
    border-color: rgba(201,255,71,0.5);
  }

  .bf-input::placeholder,
  .bf-textarea::placeholder {
    color: rgba(245,245,245,0.18);
  }

  .bf-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(245,245,245,0.3)'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
    cursor: pointer;
  }

  .bf-select option {
    background: #111;
    color: #F5F5F5;
  }

  .bf-textarea {
    resize: none;
    height: 80px;
  }

  .bf-price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: rgba(201,255,71,0.05);
    border: 1px solid rgba(201,255,71,0.12);
    border-radius: 14px;
  }

  .bf-price-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem;
    color: rgba(245,245,245,0.5);
    font-weight: 500;
  }

  .bf-price-val {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: 1.4rem;
    color: #C9FF47;
    letter-spacing: -0.02em;
  }

  .bf-price-free {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem;
    color: rgba(201,255,71,0.6);
    text-align: right;
  }

  .bf-submit {
    width: 100%;
    padding: 14px;
    background: #C9FF47;
    border: none;
    border-radius: 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 700;
    font-size: 0.92rem;
    color: #080808;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0 28px rgba(201,255,71,0.2);
  }

  .bf-submit:hover:not(:disabled) {
    background: #D8FF60;
    transform: translateY(-1px);
    box-shadow: 0 0 40px rgba(201,255,71,0.4);
  }

  .bf-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .bf-error {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    color: #FF2D6E;
    background: rgba(255,45,110,0.08);
    border: 1px solid rgba(255,45,110,0.2);
    border-radius: 10px;
    padding: 10px 14px;
  }

  .bf-login-msg {
    text-align: center;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.85rem;
    color: rgba(245,245,245,0.4);
  }

  .bf-login-link {
    color: #C9FF47;
    font-weight: 700;
    text-decoration: none;
  }

  .bf-login-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 840px) {
    .bf-card {
      position: static;
    }
  }
`

export default function BookingForm({
  mentorId,
  mentorName,
  hourlyRate,
  sessionDurations,
  introCallFree,
}: BookingFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(sessionDurations[0] || '60')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const durationMin = parseInt(duration, 10)
  const price = Math.round((hourlyRate * durationMin) / 60 * 100) / 100

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!topic.trim()) {
      setError('Please enter a topic for the session.')
      return
    }
    if (!scheduledAt) {
      setError('Please select a date and time.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          topic: topic.trim(),
          description: description.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
          duration: durationMin,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to book session')
        return
      }

      router.push('/sessions')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="bf-card">
        <div>
          <div className="bf-title">Book a Session</div>
          <div className="bf-subtitle">with {mentorName}</div>
        </div>

        {!session?.user ? (
          <p className="bf-login-msg">
            <a href="/login" className="bf-login-link">Sign in</a> to book a session.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="bf-field">
              <label className="bf-label">Topic</label>
              <input
                className="bf-input"
                type="text"
                placeholder="e.g. University application review"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="bf-field">
              <label className="bf-label">Description (optional)</label>
              <textarea
                className="bf-textarea"
                placeholder="What would you like to discuss?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="bf-field">
              <label className="bf-label">Date & Time</label>
              <input
                className="bf-input"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div className="bf-field">
              <label className="bf-label">Duration</label>
              <select
                className="bf-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                {sessionDurations.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>

            <div className="bf-price-row">
              <div>
                <div className="bf-price-label">Session Price</div>
                {introCallFree && price === 0 && (
                  <div className="bf-price-free">Free intro call included</div>
                )}
              </div>
              <div className="bf-price-val">
                {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
              </div>
            </div>

            {error && <div className="bf-error">{error}</div>}

            <button
              type="submit"
              className="bf-submit"
              disabled={loading}
            >
              {loading
                ? 'Booking...'
                : price === 0
                  ? 'Book Free Session'
                  : `Book Session — $${price.toFixed(2)} (Dummy Payment)`}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
