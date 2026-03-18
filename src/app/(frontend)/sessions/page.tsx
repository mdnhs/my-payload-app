'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type TabKey = 'upcoming' | 'completed' | 'cancelled'

interface SessionDoc {
  id: string
  topic: string
  description?: string
  status: string
  scheduledAt: string
  duration: number
  hourlyRate: number
  amountCharged: number
  paymentStatus: string
  meetingLink?: string
  rating?: number
  review?: string
  mentor?: { id: string; user?: { name?: string } }
  mentee?: { id: string; user?: { name?: string } }
  mentorUser?: string | { id: string; name?: string }
  menteeUser?: string | { id: string; name?: string }
}

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'upcoming', label: 'Upcoming', color: '#C9FF47' },
  { key: 'completed', label: 'Completed', color: '#00E5FF' },
  { key: 'cancelled', label: 'Cancelled', color: '#FF2D6E' },
]

const COLORS = ['#C9FF47', '#00E5FF', '#FF2D6E', '#A78BFA', '#FFA94D', '#4ADE80', '#F472B6']

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: '0.75rem', color: i < rating ? '#C9FF47' : 'rgba(245,245,245,0.15)' }}>★</span>
      ))}
    </span>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

function getMentorName(session: SessionDoc) {
  if (session.mentor && typeof session.mentor === 'object' && session.mentor.user && typeof session.mentor.user === 'object') {
    return session.mentor.user.name || 'Mentor'
  }
  return 'Mentor'
}

function getMenteeName(session: SessionDoc) {
  if (session.mentee && typeof session.mentee === 'object' && session.mentee.user && typeof session.mentee.user === 'object') {
    return session.mentee.user.name || 'Mentee'
  }
  return 'Mentee'
}

export default function SessionsPage() {
  const { data: authSession, isPending } = useSession()
  const user = authSession?.user as { id?: string; name?: string; role?: string } | null | undefined
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useQueryState('tab', parseAsStringLiteral(['upcoming', 'completed', 'cancelled'] as const).withDefault('upcoming'))
  const [sessions, setSessions] = useState<SessionDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewOpen, setReviewOpen] = useState<string | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [payingSessionId, setPayingSessionId] = useState('')
  // unread counts keyed by sessionId
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  // mentor earnings / withdraw
  const [mentorBalance, setMentorBalance] = useState<number | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')
  // availability management (mentor only)
  const [slots, setSlots] = useState<{ id: string; startTime: string; endTime: string; isBooked: boolean }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [slotStartDT, setSlotStartDT] = useState('')
  const [slotDurMin, setSlotDurMin] = useState(30)
  const [slotError, setSlotError] = useState('')
  const [slotSubmitting, setSlotSubmitting] = useState(false)
  const [mentorProfileId, setMentorProfileId] = useState('')

  // Show toast if redirected back from payment
  const paymentStatus = searchParams.get('payment')
  const bookedNew = searchParams.get('booked')

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const fetchMentorBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/mentor/profile')
      if (res.ok) {
        const data = await res.json()
        setMentorBalance(data.totalEarningsUSD ?? 0)
        setMentorProfileId(data.id ?? '')
      }
    } catch { /* ignore */ }
  }, [])

  const fetchSlots = useCallback(async (profileId: string) => {
    if (!profileId) return
    setSlotsLoading(true)
    try {
      // fetch all upcoming slots (my own view — includes booked)
      const res = await fetch(`/api/availability?mentorId=${profileId}&all=1`)
      if (res.ok) setSlots(await res.json())
    } catch { /* ignore */ }
    setSlotsLoading(false)
  }, [])

  useEffect(() => {
    if (mentorProfileId) fetchSlots(mentorProfileId)
  }, [mentorProfileId, fetchSlots])

  const fetchUnreadCounts = useCallback(async (sessionList: SessionDoc[]) => {
    const confirmed = sessionList.filter(s => s.status === 'confirmed')
    const counts: Record<string, number> = {}
    await Promise.all(
      confirmed.map(async (s) => {
        try {
          const res = await fetch(`/api/sessions/${s.id}/messages/unread`)
          if (res.ok) {
            const data = await res.json()
            counts[s.id] = data.unread ?? 0
          }
        } catch { /* ignore */ }
      }),
    )
    setUnreadCounts(counts)
  }, [])

  useEffect(() => {
    if (!isPending && user) {
      // If redirected back from Stripe with success, verify payment before loading sessions
      const payParam = searchParams.get('payment')
      const sessionId = searchParams.get('id')
      if (payParam === 'success' && sessionId) {
        fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: sessionId }),
        }).finally(() => fetchSessions())
      } else {
        fetchSessions()
      }
      if ((user as { role?: string }).role === 'mentor') fetchMentorBalance()
    } else if (!isPending) setLoading(false)
  }, [isPending, user, fetchSessions, fetchMentorBalance, searchParams])

  useEffect(() => {
    if (sessions.length > 0) fetchUnreadCounts(sessions)
  }, [sessions, fetchUnreadCounts])

  async function handleAddSlot() {
    setSlotError('')
    if (!slotStartDT) { setSlotError('Select a start date and time.'); return }
    if (slotDurMin < 10 || slotDurMin > 30) { setSlotError('Duration must be between 10 and 30 minutes.'); return }
    const startTime = new Date(slotStartDT).toISOString()
    const endTime = new Date(new Date(slotStartDT).getTime() + slotDurMin * 60000).toISOString()
    setSlotSubmitting(true)
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime, endTime }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowAddSlot(false)
        setSlotStartDT(''); setSlotDurMin(30)
        fetchSlots(mentorProfileId)
      } else {
        setSlotError(data.error || 'Failed to add slot.')
      }
    } catch { setSlotError('Network error.') }
    setSlotSubmitting(false)
  }

  async function handleDeleteSlot(slotId: string) {
    try {
      await fetch(`/api/availability/${slotId}`, { method: 'DELETE' })
      setSlots((prev) => prev.filter((s) => s.id !== slotId))
    } catch { /* ignore */ }
  }

  // Try to verify existing Stripe payment first; if not paid, redirect to checkout
  async function handleVerifyOrPay(sessionId: string) {
    setPayingSessionId(sessionId)
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: sessionId }),
      })
      const verifyData = await verifyRes.json()
      if (verifyData.paid || verifyData.alreadyPaid) {
        // Payment confirmed — just reload sessions
        await fetchSessions()
        setPayingSessionId('')
        return
      }
    } catch { /* fall through to checkout */ }
    // Not paid yet — go to Stripe
    await handlePay(sessionId)
  }

  async function handlePay(sessionId: string) {
    setPayingSessionId(sessionId)
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: sessionId }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      }
    } catch { /* ignore */ }
    setPayingSessionId('')
  }

  async function handleWithdraw() {
    setWithdrawError('')
    setWithdrawSuccess('')
    const amt = parseFloat(withdrawAmount)
    if (!amt || amt <= 0) { setWithdrawError('Enter a valid amount.'); return }
    setWithdrawing(true)
    try {
      const res = await fetch('/api/mentor/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, note: withdrawNote }),
      })
      const data = await res.json()
      if (res.ok) {
        setWithdrawSuccess(`Withdrawal request of $${amt.toFixed(2)} submitted successfully!`)
        setWithdrawAmount('')
        setWithdrawNote('')
        fetchMentorBalance()
      } else {
        setWithdrawError(data.error || 'Failed to submit withdrawal.')
      }
    } catch { setWithdrawError('Network error. Please try again.') }
    setWithdrawing(false)
  }

  function categorize(s: SessionDoc): TabKey {
    if (s.status === 'completed') return 'completed'
    if (s.status === 'cancelled') return 'cancelled'
    return 'upcoming' // pending + confirmed
  }

  const filtered = useMemo(() => sessions.filter(s => categorize(s) === activeTab), [activeTab, sessions])

  const counts = useMemo(() => ({
    upcoming: sessions.filter(s => categorize(s) === 'upcoming').length,
    completed: sessions.filter(s => categorize(s) === 'completed').length,
    cancelled: sessions.filter(s => categorize(s) === 'cancelled').length,
  }), [sessions])

  const totalHours = useMemo(() =>
    sessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.duration, 0) / 60,
    [sessions]
  )

  const isMentor = (s: SessionDoc) => {
    const mentorUserId = typeof s.mentorUser === 'string' ? s.mentorUser : s.mentorUser?.id
    return user?.id === mentorUserId
  }

  async function handleStatusChange(sessionId: string, status: string) {
    setActionLoading(`${sessionId}-${status}`)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) await fetchSessions()
    } catch { /* ignore */ }
    setActionLoading('')
  }

  void paymentStatus
  void bookedNew

  async function submitReview() {
    if (!reviewOpen) return
    setReviewSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${reviewOpen}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, review: reviewText }),
      })
      if (res.ok) {
        setReviewOpen(null)
        await fetchSessions()
      }
    } catch { /* ignore */ }
    setReviewSubmitting(false)
  }

  if (isPending || loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(201,255,71,0.15)', borderTopColor: '#C9FF47', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontFamily: "var(--font-dm-sans),sans-serif", color: 'rgba(245,245,245,0.5)', fontSize: '1rem' }}>Sign in to view your sessions.</p>
      <a href="/login" style={{ fontFamily: "var(--font-dm-sans),sans-serif", background: '#C9FF47', color: '#080808', borderRadius: 100, padding: '10px 28px', fontWeight: 700, textDecoration: 'none' }}>Sign In</a>
    </div>
  )

  return (
    <>
      <style>{`
        .sess-wrap {
          max-width: 860px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }
        .sess-header { margin-bottom: 36px; }
        .sess-label {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #C9FF47; background: rgba(201,255,71,0.1);
          border: 1px solid rgba(201,255,71,0.22);
          border-radius: 100px; padding: 4px 14px; margin-bottom: 14px;
        }
        .sess-title {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 2.2rem; color: #F5F5F5; line-height: 1.1; margin-bottom: 8px;
        }
        .sess-subtitle {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.95rem; color: rgba(245,245,245,0.4);
        }
        .sess-summary {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 32px;
        }
        .sess-summary-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 18px 16px 14px;
          position: relative; overflow: hidden;
        }
        .sess-summary-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .sess-summary-val {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 1.8rem; color: #F5F5F5; line-height: 1; margin-bottom: 4px;
        }
        .sess-summary-lbl {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.7rem;
          font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(245,245,245,0.32);
        }
        .sess-tabs {
          display: flex; gap: 4px; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 100px;
          padding: 4px; margin-bottom: 24px; width: fit-content;
        }
        .sess-tab {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.83rem;
          font-weight: 600; padding: 8px 22px; border-radius: 100px;
          border: none; background: transparent; color: rgba(245,245,245,0.45);
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 7px;
        }
        .sess-tab:hover { color: #F5F5F5; }
        .sess-tab.active { background: rgba(255,255,255,0.08); color: #F5F5F5; }
        .sess-tab-count {
          font-size: 0.68rem; font-weight: 700; padding: 2px 7px;
          border-radius: 100px; background: rgba(255,255,255,0.08);
          color: rgba(245,245,245,0.5); line-height: 1.4;
        }
        .sess-tab.active .sess-tab-count { background: rgba(201,255,71,0.15); color: #C9FF47; }
        .sess-list { display: flex; flex-direction: column; gap: 14px; }
        .sess-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 22px 24px;
          transition: border-color 0.2s, background 0.2s; position: relative; overflow: hidden;
        }
        .sess-card:hover { border-color: rgba(255,255,255,0.13); background: rgba(255,255,255,0.04); }
        .sess-card.today-card { border-color: rgba(201,255,71,0.2); background: rgba(201,255,71,0.03); }
        .sess-card-top { display: flex; align-items: flex-start; gap: 16px; }
        .sess-mentor-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 0.8rem; color: #080808; flex-shrink: 0;
        }
        .sess-card-main { flex: 1; min-width: 0; }
        .sess-card-title-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; margin-bottom: 6px; flex-wrap: wrap;
        }
        .sess-card-title {
          font-family: var(--font-syne), sans-serif; font-weight: 700;
          font-size: 1rem; color: #F5F5F5; line-height: 1.2;
        }
        .sess-status-pill {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.65rem;
          font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 3px 11px; border-radius: 100px; flex-shrink: 0;
        }
        .sess-card-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .sess-meta-item {
          display: flex; align-items: center; gap: 5px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.8rem;
          color: rgba(245,245,245,0.4);
        }
        .sess-meta-icon { font-size: 0.75rem; opacity: 0.6; }
        .sess-topic-tag {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.68rem;
          font-weight: 600; letter-spacing: 0.05em; padding: 2px 10px;
          border-radius: 100px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08); color: rgba(245,245,245,0.45);
        }
        .sess-card-actions {
          display: flex; align-items: center; gap: 8px; margin-top: 16px;
          padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap;
        }
        .sess-btn {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          font-weight: 700; padding: 8px 20px; border-radius: 100px;
          border: none; cursor: pointer; transition: all 0.2s; text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .sess-btn-primary { background: #C9FF47; color: #080808; }
        .sess-btn-primary:hover { opacity: 0.9; }
        .sess-btn-ghost {
          background: transparent; border: 1px solid rgba(255,255,255,0.12);
          color: rgba(245,245,245,0.6);
        }
        .sess-btn-ghost:hover { border-color: rgba(255,255,255,0.22); color: #F5F5F5; }
        .sess-btn-danger {
          background: transparent; border: 1px solid rgba(255,45,110,0.2);
          color: rgba(255,45,110,0.7);
        }
        .sess-btn-danger:hover {
          border-color: #FF2D6E; color: #FF2D6E; background: rgba(255,45,110,0.06);
        }
        .sess-btn-confirm {
          background: rgba(201,255,71,0.12); border: 1px solid rgba(201,255,71,0.3);
          color: #C9FF47;
        }
        .sess-btn-confirm:hover { background: rgba(201,255,71,0.2); }
        .sess-btn-complete {
          background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.25);
          color: #00E5FF;
        }
        .sess-btn-complete:hover { background: rgba(0,229,255,0.18); }
        .sess-today-badge {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.65rem;
          font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: #C9FF47; background: rgba(201,255,71,0.12);
          border: 1px solid rgba(201,255,71,0.22); padding: 3px 11px;
          border-radius: 100px; margin-left: auto;
        }
        .sess-note {
          margin-top: 14px; padding: 12px 16px;
          background: rgba(255,255,255,0.03); border-radius: 12px;
          border-left: 2px solid rgba(201,255,71,0.3);
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.83rem;
          line-height: 1.6; color: rgba(245,245,245,0.5); font-style: italic;
        }
        .review-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .review-modal {
          background: #111; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 32px; width: 100%; max-width: 440px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .review-title {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 1.2rem; color: #F5F5F5; margin-bottom: 6px;
        }
        .review-sub {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: rgba(245,245,245,0.4); margin-bottom: 24px;
        }
        .review-stars { display: flex; gap: 8px; margin-bottom: 20px; justify-content: center; }
        .review-star-btn {
          font-size: 1.8rem; background: none; border: none;
          cursor: pointer; transition: transform 0.15s, filter 0.15s;
          filter: grayscale(1) brightness(0.5); padding: 0; line-height: 1;
        }
        .review-star-btn.lit { filter: none; transform: scale(1.1); }
        .review-textarea {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          padding: 14px 16px; font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem; line-height: 1.6; color: #F5F5F5;
          resize: none; outline: none; height: 100px;
          transition: border-color 0.2s; margin-bottom: 20px; box-sizing: border-box;
        }
        .review-textarea:focus { border-color: #C9FF47; }
        .review-textarea::placeholder { color: rgba(245,245,245,0.22); }
        .review-actions { display: flex; gap: 10px; }
        .sess-empty { text-align: center; padding: 64px 24px; }
        .sess-empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.4; }
        .sess-empty-text {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.95rem;
          color: rgba(245,245,245,0.35); margin-bottom: 20px;
        }
        .sess-unread-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 5px;
          background: #FF2D6E; border-radius: 100px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 700; color: #fff; line-height: 1;
        }
        .sess-btn-pay {
          background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.3);
          color: #00E5FF;
        }
        .sess-btn-pay:hover { background: rgba(0,229,255,0.2); }
        .sess-btn-withdraw {
          background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.3);
          color: #A78BFA;
        }
        .sess-btn-withdraw:hover { background: rgba(167,139,250,0.2); }
        .earnings-panel {
          background: rgba(167,139,250,0.05); border: 1px solid rgba(167,139,250,0.15);
          border-radius: 20px; padding: 20px 24px; margin-bottom: 28px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          flex-wrap: wrap;
        }
        .earnings-panel-left { display: flex; flex-direction: column; gap: 4px; }
        .earnings-panel-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; color: rgba(167,139,250,0.6);
        }
        .earnings-panel-val {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 1.9rem; color: #A78BFA; line-height: 1;
        }
        .earnings-panel-sub {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem;
          color: rgba(245,245,245,0.35); margin-top: 2px;
        }
        .withdraw-modal {
          background: #111; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 32px; width: 100%; max-width: 420px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
        .withdraw-title {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 1.2rem; color: #F5F5F5; margin-bottom: 6px;
        }
        .withdraw-sub {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: rgba(245,245,245,0.4); margin-bottom: 20px;
        }
        .withdraw-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          padding: 11px 14px; font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem; color: #F5F5F5; outline: none;
          transition: border-color 0.2s; box-sizing: border-box; margin-bottom: 12px;
        }
        .withdraw-input:focus { border-color: rgba(167,139,250,0.5); }
        .withdraw-input::placeholder { color: rgba(245,245,245,0.2); }
        .withdraw-error {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.8rem;
          color: #FF2D6E; background: rgba(255,45,110,0.08);
          border: 1px solid rgba(255,45,110,0.2); border-radius: 10px;
          padding: 10px 14px; margin-bottom: 14px;
        }
        .withdraw-success {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          color: #C9FF47; background: rgba(201,255,71,0.08);
          border: 1px solid rgba(201,255,71,0.2); border-radius: 10px;
          padding: 10px 14px; margin-bottom: 14px;
        }
        .sess-payment-pending-badge {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.68rem; font-weight: 600;
          color: rgba(255,169,77,0.7); background: rgba(255,169,77,0.06);
          border: 1px solid rgba(255,169,77,0.15); border-radius: 8px;
          padding: 4px 10px; margin-top: 8px; display: inline-block;
        }
        /* ── Availability panel ── */
        .avail-panel {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 20px 24px; margin-bottom: 28px;
        }
        .avail-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
        }
        .avail-title {
          font-family: var(--font-syne), sans-serif; font-weight: 700;
          font-size: 0.95rem; color: #F5F5F5;
        }
        .avail-subtitle {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.75rem;
          color: rgba(245,245,245,0.35); margin-top: 2px;
        }
        .avail-slot-list { display: flex; flex-direction: column; gap: 8px; }
        .avail-slot {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 10px 14px; gap: 12px;
        }
        .avail-slot-info { flex: 1; }
        .avail-slot-day {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase; color: rgba(245,245,245,0.35);
        }
        .avail-slot-time {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.88rem; font-weight: 600;
          color: #F5F5F5; margin-top: 2px;
        }
        .avail-slot-dur {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem;
          color: rgba(245,245,245,0.4); margin-top: 2px;
        }
        .avail-slot-booked {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; color: #C9FF47;
          background: rgba(201,255,71,0.08); border: 1px solid rgba(201,255,71,0.2);
          border-radius: 100px; padding: 2px 10px;
        }
        .avail-del-btn {
          background: transparent; border: 1px solid rgba(255,45,110,0.2);
          color: rgba(255,45,110,0.5); border-radius: 8px; padding: 5px 10px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem;
          font-weight: 700; cursor: pointer; transition: all 0.18s; flex-shrink: 0;
        }
        .avail-del-btn:hover { border-color: #FF2D6E; color: #FF2D6E; background: rgba(255,45,110,0.06); }
        .avail-empty {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.83rem;
          color: rgba(245,245,245,0.3); text-align: center; padding: 14px 0;
        }
        .avail-add-form {
          margin-top: 16px; padding: 16px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; display: flex; flex-direction: column; gap: 12px;
        }
        .avail-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .avail-form-field { display: flex; flex-direction: column; gap: 4px; }
        .avail-form-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.66rem; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase; color: rgba(245,245,245,0.3);
        }
        .avail-form-input {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 9px 12px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: #F5F5F5; outline: none; width: 100%; box-sizing: border-box;
          transition: border-color 0.2s; colorScheme: dark;
        }
        .avail-form-input:focus { border-color: rgba(201,255,71,0.4); }
        .avail-form-actions { display: flex; gap: 8px; }
        .avail-form-error {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem;
          color: #FF2D6E; background: rgba(255,45,110,0.08);
          border: 1px solid rgba(255,45,110,0.15); border-radius: 8px; padding: 8px 12px;
        }
        @media (max-width: 520px) {
          .avail-form-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .sess-summary { grid-template-columns: repeat(2, 1fr); }
          .sess-tabs { width: 100%; justify-content: space-between; }
          .sess-tab { padding: 8px 14px; font-size: 0.78rem; }
          .sess-title { font-size: 1.7rem; }
          .sess-card-title-row { flex-direction: column; }
        }
      `}</style>

      <div className="sess-wrap">
        <div className="sess-header">
          <div className="sess-label">My Sessions</div>
          <div className="sess-title">Session History</div>
          <div className="sess-subtitle">Track your learning journey with every mentor call.</div>
        </div>

        <div className="sess-summary">
          {[
            { label: 'Total Sessions', value: sessions.length, color: '#C9FF47' },
            { label: 'Hours Learned', value: `${totalHours.toFixed(1)}h`, color: '#00E5FF' },
            { label: 'Upcoming', value: counts.upcoming, color: '#A78BFA' },
            { label: 'Completed', value: counts.completed, color: '#FF2D6E' },
          ].map((s) => (
            <div className="sess-summary-card" key={s.label}>
              <div className="sess-summary-bar" style={{ background: s.color }} />
              <div className="sess-summary-val">{s.value}</div>
              <div className="sess-summary-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mentor earnings panel */}
        {user?.role === 'mentor' && mentorBalance !== null && (
          <div className="earnings-panel">
            <div className="earnings-panel-left">
              <div className="earnings-panel-label">Available Balance</div>
              <div className="earnings-panel-val">${mentorBalance.toFixed(2)}</div>
              <div className="earnings-panel-sub">Earnings from completed sessions</div>
            </div>
            <button
              className="sess-btn sess-btn-withdraw"
              onClick={() => { setWithdrawOpen(true); setWithdrawError(''); setWithdrawSuccess('') }}
              disabled={mentorBalance <= 0}
            >
              💸 Withdraw
            </button>
          </div>
        )}

        {/* Mentor availability management */}
        {user?.role === 'mentor' && mentorProfileId && (
          <div className="avail-panel">
            <div className="avail-header">
              <div>
                <div className="avail-title">My Availability</div>
                <div className="avail-subtitle">Slots mentees can book from your profile</div>
              </div>
              <button
                className="sess-btn sess-btn-ghost"
                style={{ fontSize: '0.8rem', padding: '7px 16px' }}
                onClick={() => { setShowAddSlot((v) => !v); setSlotError(''); setSlotStartDT(''); setSlotDurMin(30) }}
              >
                {showAddSlot ? '✕ Cancel' : '+ Add Slot'}
              </button>
            </div>

            {showAddSlot && (
              <div className="avail-add-form">
                <div className="avail-form-row">
                  <div className="avail-form-field">
                    <label className="avail-form-label">Start Date & Time</label>
                    <input
                      className="avail-form-input"
                      type="datetime-local"
                      value={slotStartDT}
                      onChange={(e) => setSlotStartDT(e.target.value)}
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      step="600"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="avail-form-field">
                    <label className="avail-form-label">Duration (min)</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[10, 15, 20, 25, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSlotDurMin(d)}
                          style={{
                            flex: 1, minWidth: 38,
                            padding: '9px 4px',
                            borderRadius: 10,
                            border: slotDurMin === d ? '1px solid #C9FF47' : '1px solid rgba(255,255,255,0.1)',
                            background: slotDurMin === d ? 'rgba(201,255,71,0.1)' : 'rgba(255,255,255,0.04)',
                            color: slotDurMin === d ? '#C9FF47' : 'rgba(245,245,245,0.55)',
                            fontFamily: 'var(--font-dm-sans),sans-serif',
                            fontSize: '0.82rem', fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {slotError && <div className="avail-form-error">{slotError}</div>}
                <div className="avail-form-actions">
                  <button
                    className="sess-btn sess-btn-primary"
                    style={{ padding: '8px 20px' }}
                    onClick={handleAddSlot}
                    disabled={slotSubmitting}
                  >
                    {slotSubmitting ? 'Adding…' : `Add ${slotDurMin}-min Slot`}
                  </button>
                </div>
              </div>
            )}

            <div className="avail-slot-list" style={{ marginTop: showAddSlot ? 12 : 0 }}>
              {slotsLoading ? (
                <div className="avail-empty">Loading…</div>
              ) : slots.length === 0 ? (
                <div className="avail-empty">No upcoming slots. Add one above.</div>
              ) : slots.map((slot) => {
                const dur = Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000)
                const d = new Date(slot.startTime)
                const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                const timeRange = `${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${new Date(slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                return (
                  <div key={slot.id} className="avail-slot">
                    <div className="avail-slot-info">
                      <div className="avail-slot-day">{day}</div>
                      <div className="avail-slot-time">{timeRange}</div>
                      <div className="avail-slot-dur">{dur} min</div>
                    </div>
                    {slot.isBooked ? (
                      <span className="avail-slot-booked">Booked</span>
                    ) : (
                      <button className="avail-del-btn" onClick={() => handleDeleteSlot(slot.id)}>Delete</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="sess-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`sess-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              <span className="sess-tab-count">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="sess-list">
          {filtered.length === 0 ? (
            <div className="sess-empty">
              <div className="sess-empty-icon">
                {activeTab === 'upcoming' ? '🗓' : activeTab === 'completed' ? '✅' : '❌'}
              </div>
              <div className="sess-empty-text">
                {activeTab === 'upcoming'
                  ? 'No upcoming sessions. Book a mentor to get started!'
                  : activeTab === 'completed'
                  ? 'No completed sessions yet.'
                  : 'No cancelled sessions.'}
              </div>
              {activeTab === 'upcoming' && (
                <Link href="/mentors" className="sess-btn sess-btn-primary">Find a Mentor →</Link>
              )}
            </div>
          ) : filtered.map((s) => {
            const today = activeTab === 'upcoming' && isToday(s.scheduledAt)
            const otherName = isMentor(s) ? getMenteeName(s) : getMentorName(s)
            const otherRole = isMentor(s) ? 'Mentee' : 'Mentor'
            const color = getColor(otherName)
            const initials = getInitials(otherName)
            const isMyMentor = isMentor(s)

            return (
              <div key={s.id} className={`sess-card${today ? ' today-card' : ''}`}>
                <div className="sess-card-top">
                  <div
                    className="sess-mentor-avatar"
                    style={{ background: color, boxShadow: `0 0 16px ${color}40` }}
                  >
                    {initials}
                  </div>
                  <div className="sess-card-main">
                    <div className="sess-card-title-row">
                      <div className="sess-card-title">{s.topic}</div>
                      {s.status === 'pending' && (
                        <span className="sess-status-pill" style={{ background: 'rgba(255,169,77,0.1)', border: '1px solid rgba(255,169,77,0.22)', color: '#FFA94D' }}>
                          Pending
                        </span>
                      )}
                      {s.status === 'awaiting_payment' && (
                        <span className="sess-status-pill" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
                          Awaiting Payment
                        </span>
                      )}
                      {s.status === 'confirmed' && (
                        <span className="sess-status-pill" style={{ background: 'rgba(201,255,71,0.12)', border: '1px solid rgba(201,255,71,0.22)', color: '#C9FF47' }}>
                          Confirmed
                        </span>
                      )}
                      {s.status === 'completed' && (
                        <span className="sess-status-pill" style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
                          Completed
                        </span>
                      )}
                      {s.status === 'cancelled' && (
                        <span className="sess-status-pill" style={{ background: 'rgba(255,45,110,0.1)', border: '1px solid rgba(255,45,110,0.2)', color: '#FF2D6E' }}>
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div className="sess-card-meta">
                      <span className="sess-meta-item">
                        <span className="sess-meta-icon">👤</span>
                        {otherName} ({otherRole})
                      </span>
                      <span className="sess-meta-item">
                        <span className="sess-meta-icon">📅</span>
                        {formatDate(s.scheduledAt)} · {formatTime(s.scheduledAt)}
                      </span>
                      <span className="sess-meta-item">
                        <span className="sess-meta-icon">⏱</span>
                        {s.duration} min
                      </span>
                      {s.amountCharged === 0 && (
                        <span className="sess-topic-tag" style={{ color: '#C9FF47', borderColor: 'rgba(201,255,71,0.2)', background: 'rgba(201,255,71,0.07)' }}>Free</span>
                      )}
                      {s.amountCharged > 0 && (
                        <span className="sess-topic-tag">${s.amountCharged}</span>
                      )}
                      {today && <span className="sess-today-badge">Today</span>}
                    </div>

                    {s.status === 'completed' && s.rating && (
                      <div style={{ marginTop: 8 }}>
                        <StarRating rating={s.rating} />
                      </div>
                    )}

                    {s.review && <div className="sess-note">&ldquo;{s.review}&rdquo;</div>}
                  </div>
                </div>

                {/* Actions */}
                {(categorize(s) === 'upcoming' || s.status === 'completed') && (
                  <div className="sess-card-actions">
                    {/* Chat link — only for confirmed sessions (FR-20) */}
                    {s.status === 'confirmed' && (
                      <Link href={`/sessions/${s.id}/chat`} className="sess-btn sess-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        💬 Chat
                        {/* FR-23: unread indicator */}
                        {(unreadCounts[s.id] ?? 0) > 0 && (
                          <span className="sess-unread-badge">{unreadCounts[s.id]}</span>
                        )}
                      </Link>
                    )}

                    {/* Video call — only for confirmed sessions (FR-25) */}
                    {s.status === 'confirmed' && (
                      <Link href={`/sessions/${s.id}/call`} className="sess-btn sess-btn-ghost">
                        📹 Video Call
                      </Link>
                    )}

                    {/* Mentor: confirm pending session (payment already collected at booking) */}
                    {isMyMentor && s.status === 'pending' && s.paymentStatus === 'paid' && (
                      <button
                        className="sess-btn sess-btn-confirm"
                        onClick={() => handleStatusChange(s.id, 'confirmed')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === `${s.id}-confirmed` ? '...' : '✓ Accept & Confirm'}
                      </button>
                    )}

                    {/* Mentor: pending but payment not yet received — show info */}
                    {isMyMentor && s.status === 'pending' && s.paymentStatus !== 'paid' && (
                      <span className="sess-payment-pending-badge">⏳ Awaiting student payment</span>
                    )}

                    {/* Mentee: pending + unpaid — verify first, then redirect to Stripe if still unpaid */}
                    {!isMyMentor && s.status === 'pending' && s.paymentStatus !== 'paid' && (
                      <button
                        className="sess-btn sess-btn-pay"
                        onClick={() => handleVerifyOrPay(s.id)}
                        disabled={payingSessionId === s.id}
                      >
                        {payingSessionId === s.id ? 'Checking...' : '💳 Complete Payment'}
                      </button>
                    )}

                    {/* Mentor: complete confirmed sessions */}
                    {isMyMentor && s.status === 'confirmed' && (
                      <button
                        className="sess-btn sess-btn-complete"
                        onClick={() => handleStatusChange(s.id, 'completed')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === `${s.id}-completed` ? '...' : '✓ Complete'}
                      </button>
                    )}

                    {/* Cancel for upcoming */}
                    {categorize(s) === 'upcoming' && (
                      <button
                        className="sess-btn sess-btn-danger"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => handleStatusChange(s.id, 'cancelled')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === `${s.id}-cancelled` ? '...' : 'Cancel'}
                      </button>
                    )}

                    {/* Completed: review + view chat */}
                    {s.status === 'completed' && !s.rating && !isMentor(s) && (
                      <button
                        className="sess-btn sess-btn-primary"
                        onClick={() => { setReviewOpen(s.id); setReviewRating(5); setReviewText('') }}
                      >
                        ⭐ Leave Review
                      </button>
                    )}
                    {s.status === 'completed' && (
                      <Link href={`/sessions/${s.id}/chat`} className="sess-btn sess-btn-ghost">
                        💬 View Chat
                      </Link>
                    )}
                  </div>
                )}
                {s.status === 'cancelled' && (
                  <div className="sess-card-actions">
                    <Link href="/mentors" className="sess-btn sess-btn-ghost">Find Another Mentor</Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Withdraw modal */}
      {withdrawOpen && (
        <div className="review-overlay" onClick={() => setWithdrawOpen(false)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-title">Withdraw Earnings</div>
            <div className="withdraw-sub">
              Available: <strong style={{ color: '#A78BFA' }}>${(mentorBalance ?? 0).toFixed(2)}</strong>
            </div>
            {withdrawError && <div className="withdraw-error">{withdrawError}</div>}
            {withdrawSuccess && <div className="withdraw-success">{withdrawSuccess}</div>}
            {!withdrawSuccess && (
              <>
                <input
                  className="withdraw-input"
                  type="number"
                  min="1"
                  step="0.01"
                  max={mentorBalance ?? undefined}
                  placeholder="Amount (USD)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <input
                  className="withdraw-input"
                  type="text"
                  placeholder="Note (optional)"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                />
                <div className="review-actions" style={{ marginTop: 4 }}>
                  <button
                    className="sess-btn sess-btn-withdraw"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px 20px' }}
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                  >
                    {withdrawing ? 'Submitting...' : '💸 Request Withdrawal'}
                  </button>
                  <button className="sess-btn sess-btn-ghost" onClick={() => setWithdrawOpen(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
            {withdrawSuccess && (
              <button className="sess-btn sess-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setWithdrawOpen(false)}>
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewOpen && (
        <div className="review-overlay" onClick={() => setReviewOpen(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-title">Rate this session</div>
            <div className="review-sub">Your feedback helps mentors improve and build trust.</div>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`review-star-btn${n <= reviewRating ? ' lit' : ''}`}
                  onClick={() => setReviewRating(n)}
                >
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              className="review-textarea"
              placeholder="What did you find most valuable? Any suggestions?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="review-actions">
              <button
                className="sess-btn sess-btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={submitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button className="sess-btn sess-btn-ghost" onClick={() => setReviewOpen(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
