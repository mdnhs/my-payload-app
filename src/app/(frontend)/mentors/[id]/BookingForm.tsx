'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

interface Slot {
  id: string
  startTime: string
  endTime: string
}

interface BookingFormProps {
  mentorId: string
  mentorName: string
  hourlyRate: number
  introCallFree: boolean
}

function formatSlotDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function slotDurationMin(slot: Slot) {
  return Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000)
}

// Group slots by calendar day
function groupByDay(slots: Slot[]): { day: string; slots: Slot[] }[] {
  const map = new Map<string, Slot[]>()
  for (const s of slots) {
    const day = new Date(s.startTime).toDateString()
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(s)
  }
  return Array.from(map.entries()).map(([day, slots]) => ({
    day,
    slots,
  }))
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
  .bf-textarea:focus {
    border-color: rgba(201,255,71,0.5);
  }

  .bf-input::placeholder,
  .bf-textarea::placeholder {
    color: rgba(245,245,245,0.18);
  }

  .bf-textarea {
    resize: none;
    height: 80px;
  }

  /* ── Slot picker ── */
  .bf-day-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: rgba(245,245,245,0.3);
    margin-bottom: 6px;
  }

  .bf-slots-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 10px;
  }

  .bf-slot-btn {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 7px 13px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(245,245,245,0.65);
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;
    line-height: 1.35;
  }

  .bf-slot-btn:hover {
    border-color: rgba(201,255,71,0.35);
    background: rgba(201,255,71,0.06);
    color: #F5F5F5;
  }

  .bf-slot-btn.selected {
    border-color: #C9FF47;
    background: rgba(201,255,71,0.1);
    color: #C9FF47;
    box-shadow: 0 0 14px rgba(201,255,71,0.15);
  }

  .bf-slot-time { display: block; }
  .bf-slot-dur {
    font-size: 0.68rem;
    font-weight: 600;
    opacity: 0.55;
    margin-top: 1px;
    display: block;
  }

  .bf-no-slots {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.83rem;
    color: rgba(245,245,245,0.35);
    text-align: center;
    padding: 16px 0 8px;
    border: 1px dashed rgba(255,255,255,0.08);
    border-radius: 12px;
  }

  .bf-slots-loading {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem;
    color: rgba(245,245,245,0.3);
    text-align: center;
    padding: 12px 0;
  }

  /* ── Price row ── */
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

  .bf-price-meta {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem;
    color: rgba(245,245,245,0.3);
    margin-top: 3px;
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
  introCallFree,
}: BookingFormProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/availability?mentorId=${mentorId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSlots(data)
      })
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
  }, [mentorId])

  const durationMin = selectedSlot ? slotDurationMin(selectedSlot) : 0
  const price = selectedSlot
    ? Math.round((hourlyRate * durationMin) / 60 * 100) / 100
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!topic.trim()) {
      setError('Please enter a topic for the session.')
      return
    }
    if (!selectedSlot) {
      setError('Please select an available time slot.')
      return
    }

    setLoading(true)
    try {
      // Step 1: Create the booking
      const bookRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          topic: topic.trim(),
          description: description.trim(),
          scheduledAt: selectedSlot.startTime,
          duration: durationMin,
          slotId: selectedSlot.id,
        }),
      })

      const bookData = await bookRes.json()
      if (!bookRes.ok) {
        setError(bookData.error || 'Failed to book session')
        return
      }

      const bookingId: string = bookData.session?.id

      // Step 2: Free sessions skip payment
      if (price === 0) {
        router.push('/sessions?booked=1')
        return
      }

      // Step 3: Paid sessions — redirect to Stripe
      const payRes = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      const payData = await payRes.json()
      if (!payRes.ok || !payData.url) {
        setError(payData.error || 'Failed to start payment. Please try again.')
        return
      }

      window.location.href = payData.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const grouped = groupByDay(slots)

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
            {/* Topic */}
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

            {/* Description */}
            <div className="bf-field">
              <label className="bf-label">Description (optional)</label>
              <textarea
                className="bf-textarea"
                placeholder="What would you like to discuss?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Slot picker */}
            <div className="bf-field">
              <label className="bf-label">Choose a Time Slot</label>

              {slotsLoading ? (
                <div className="bf-slots-loading">Loading available slots…</div>
              ) : slots.length === 0 ? (
                <div className="bf-no-slots">
                  No available slots right now.<br />
                  <span style={{ opacity: 0.55, fontSize: '0.75rem' }}>Check back later or message the mentor.</span>
                </div>
              ) : (
                grouped.map(({ day, slots: daySlots }) => (
                  <div key={day}>
                    <div className="bf-day-label">{formatSlotDate(daySlots[0].startTime)}</div>
                    <div className="bf-slots-row">
                      {daySlots.map((slot) => {
                        const dur = slotDurationMin(slot)
                        const isSelected = selectedSlot?.id === slot.id
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className={`bf-slot-btn${isSelected ? ' selected' : ''}`}
                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                          >
                            <span className="bf-slot-time">
                              {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                            </span>
                            <span className="bf-slot-dur">{dur} min</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price */}
            {selectedSlot && (
              <div className="bf-price-row">
                <div>
                  <div className="bf-price-label">Session Price</div>
                  <div className="bf-price-meta">{durationMin} min session</div>
                  {introCallFree && price === 0 && (
                    <div className="bf-price-free">Free intro call included</div>
                  )}
                </div>
                <div className="bf-price-val">
                  {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
                </div>
              </div>
            )}

            {error && <div className="bf-error">{error}</div>}

            <button
              type="submit"
              className="bf-submit"
              disabled={loading || slots.length === 0}
            >
              {loading
                ? price === 0 ? 'Booking…' : 'Redirecting to payment…'
                : !selectedSlot
                  ? 'Select a slot to continue'
                  : price === 0
                    ? 'Book Free Session'
                    : `Pay & Book — $${price.toFixed(2)}`}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
