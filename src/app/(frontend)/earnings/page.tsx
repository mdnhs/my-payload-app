'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useSession } from '@/lib/auth-client'

type PeriodKey = '7d' | '30d' | '90d' | 'all'

interface TransactionDoc {
  id: string
  session: string | {
    id: string
    topic?: string
    duration?: number
    scheduledAt?: string
    mentee?: { id: string; user?: { name?: string } }
  }
  mentorUser: string
  menteeUser: string | { id: string; name?: string }
  type: string
  grossAmount: number
  platformFee: number
  netAmount: number
  status: string
  createdAt: string
}

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: 'all', label: 'All time' },
]

const COLORS = ['#C9FF47', '#00E5FF', '#FF2D6E', '#A78BFA', '#FFA94D', '#4ADE80']

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const h = 56
  const w = 200
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  const area = `0,${h} ` + pts + ` ${w},${h}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkGrad)" />
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export default function EarningsPage() {
  const { data: authSession, isPending } = useSession()
  const user = authSession?.user as { name?: string; role?: string } | null | undefined

  const [period, setPeriod] = useQueryState('period', parseAsStringLiteral(['7d', '30d', '90d', 'all'] as const).withDefault('30d'))
  const [transactions, setTransactions] = useState<TransactionDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmt, setWithdrawAmt] = useState('')

  const fetchData = useCallback(async () => {
    try {
      // Fetch sessions which contain transaction-like data
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const sessions = await res.json()
        // Build transaction-like objects from sessions
        const txns: TransactionDoc[] = sessions
          .filter((s: Record<string, unknown>) => s.amountCharged !== undefined)
          .map((s: Record<string, unknown>) => ({
            id: s.id as string,
            session: s,
            mentorUser: typeof s.mentorUser === 'string' ? s.mentorUser : (s.mentorUser as Record<string, string>)?.id,
            menteeUser: s.menteeUser,
            type: 'payment',
            grossAmount: (s.amountCharged as number) || 0,
            platformFee: Math.round(((s.amountCharged as number) || 0) * 0.1 * 100) / 100,
            netAmount: Math.round(((s.amountCharged as number) || 0) * 0.9 * 100) / 100,
            status: s.status === 'completed' ? 'completed' : s.status === 'cancelled' ? 'refunded' : 'pending',
            createdAt: s.scheduledAt as string || s.createdAt as string,
          }))
        setTransactions(txns)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isPending && user) fetchData()
    else if (!isPending) setLoading(false)
  }, [isPending, user, fetchData])

  const periodDays: Record<PeriodKey, number | null> = { '7d': 7, '30d': 30, '90d': 90, 'all': null }

  const filtered = useMemo(() => {
    const days = periodDays[period]
    const paymentTxns = transactions.filter(t => t.grossAmount > 0)
    if (!days) return paymentTxns
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return paymentTxns.filter(t => new Date(t.createdAt) >= cutoff)
  }, [period, transactions])

  const stats = useMemo(() => {
    const gross = filtered.reduce((a, t) => a + t.grossAmount, 0)
    const fees = filtered.reduce((a, t) => a + t.platformFee, 0)
    const net = gross - fees
    const sessions = filtered.length
    const pending = filtered.filter(t => t.status === 'pending').reduce((a, t) => a + t.netAmount, 0)
    return { gross, fees, net, sessions, pending }
  }, [filtered])

  const availableBalance = transactions
    .filter(t => t.status === 'completed')
    .reduce((a, t) => a + t.netAmount, 0)

  // Build sparkline from recent data
  const sparklineData = useMemo(() => {
    if (filtered.length === 0) return [0, 0]
    const sorted = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    let running = 0
    return sorted.map(t => { running += t.netAmount; return running })
  }, [filtered])

  function getSessionTopic(t: TransactionDoc) {
    if (typeof t.session === 'object' && t.session?.topic) return t.session.topic
    return 'Session'
  }

  function getMenteeName(t: TransactionDoc) {
    if (typeof t.session === 'object' && t.session?.mentee && typeof t.session.mentee === 'object') {
      if (t.session.mentee.user && typeof t.session.mentee.user === 'object') {
        return t.session.mentee.user.name || 'Mentee'
      }
    }
    if (typeof t.menteeUser === 'object' && t.menteeUser?.name) return t.menteeUser.name
    return 'Mentee'
  }

  function getDuration(t: TransactionDoc) {
    if (typeof t.session === 'object' && t.session?.duration) return t.session.duration
    return 60
  }

  if (isPending || loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(201,255,71,0.15)', borderTopColor: '#C9FF47', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!user || user.role !== 'mentor') return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontFamily: "var(--font-dm-sans),sans-serif", color: 'rgba(245,245,245,0.5)' }}>This page is only available to mentors.</p>
      <a href="/mentors" style={{ fontFamily: "var(--font-dm-sans),sans-serif", background: '#C9FF47', color: '#080808', borderRadius: 100, padding: '10px 28px', fontWeight: 700, textDecoration: 'none' }}>Browse Mentors</a>
    </div>
  )

  return (
    <>
      <style>{`
        .earn-wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 80px; }
        .earn-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 20px; margin-bottom: 36px; flex-wrap: wrap;
        }
        .earn-label {
          display: inline-block; font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #C9FF47;
          background: rgba(201,255,71,0.1); border: 1px solid rgba(201,255,71,0.22);
          border-radius: 100px; padding: 4px 14px; margin-bottom: 12px;
        }
        .earn-title {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 2.2rem; color: #F5F5F5; line-height: 1.1; margin-bottom: 6px;
        }
        .earn-subtitle {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.9rem;
          color: rgba(245,245,245,0.38);
        }
        .earn-period-pills {
          display: flex; gap: 4px; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 100px;
          padding: 4px; align-self: flex-start;
        }
        .earn-period-pill {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.8rem;
          font-weight: 600; padding: 7px 18px; border-radius: 100px;
          border: none; background: transparent; color: rgba(245,245,245,0.4);
          cursor: pointer; transition: all 0.2s;
        }
        .earn-period-pill:hover { color: #F5F5F5; }
        .earn-period-pill.active { background: rgba(255,255,255,0.08); color: #F5F5F5; }
        .earn-balance-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
        }
        .earn-balance-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px; padding: 28px 28px 24px; position: relative; overflow: hidden;
        }
        .earn-balance-card.primary {
          background: linear-gradient(135deg, rgba(201,255,71,0.08) 0%, rgba(201,255,71,0.02) 100%);
          border-color: rgba(201,255,71,0.18);
        }
        .earn-balance-card-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(245,245,245,0.38); margin-bottom: 10px;
        }
        .earn-balance-card.primary .earn-balance-card-label { color: rgba(201,255,71,0.6); }
        .earn-balance-amount {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 2.8rem; color: #F5F5F5; line-height: 1; margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .earn-balance-card.primary .earn-balance-amount { color: #C9FF47; }
        .earn-balance-sub {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.8rem;
          color: rgba(245,245,245,0.3); margin-bottom: 20px;
        }
        .earn-withdraw-btn {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          font-weight: 700; padding: 10px 26px; border-radius: 100px;
          border: none; background: #C9FF47; color: #080808;
          cursor: pointer; transition: opacity 0.2s; display: inline-flex;
          align-items: center; gap: 7px;
        }
        .earn-withdraw-btn:hover { opacity: 0.88; }
        .earn-sparkline-wrap {
          position: absolute; bottom: 24px; right: 24px; opacity: 0.9;
        }
        .earn-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-bottom: 32px;
        }
        .earn-stat-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 20px 18px 16px; position: relative; overflow: hidden;
        }
        .earn-stat-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .earn-stat-val {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 1.75rem; color: #F5F5F5; line-height: 1; margin-bottom: 4px;
        }
        .earn-stat-lbl {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.7rem;
          font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(245,245,245,0.3);
        }
        .earn-table-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
        }
        .earn-table-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 18px; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .earn-table-title {
          font-family: var(--font-syne), sans-serif; font-weight: 700;
          font-size: 0.95rem; color: #F5F5F5;
        }
        .earn-table-count {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.75rem;
          color: rgba(245,245,245,0.35);
        }
        .earn-row {
          display: flex; align-items: center; gap: 16px; padding: 14px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s;
        }
        .earn-row:last-child { border-bottom: none; }
        .earn-row:hover { background: rgba(255,255,255,0.02); }
        .earn-row-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 0.72rem; color: #080808; flex-shrink: 0;
        }
        .earn-row-main { flex: 1; min-width: 0; }
        .earn-row-title {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.87rem;
          font-weight: 600; color: #F5F5F5; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .earn-row-meta {
          display: flex; align-items: center; gap: 10px; margin-top: 3px; flex-wrap: wrap;
        }
        .earn-row-mentee {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.75rem;
          color: rgba(245,245,245,0.38);
        }
        .earn-row-date {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem;
          color: rgba(245,245,245,0.25);
        }
        .earn-row-right {
          display: flex; flex-direction: column; align-items: flex-end;
          gap: 5px; flex-shrink: 0;
        }
        .earn-row-amount {
          font-family: var(--font-jetbrains-mono), monospace; font-size: 0.95rem;
          font-weight: 700; color: #C9FF47;
        }
        .earn-row-amount.zero { color: rgba(245,245,245,0.3); font-size: 0.8rem; }
        .earn-row-fee {
          font-family: var(--font-jetbrains-mono), monospace; font-size: 0.7rem;
          color: rgba(245,245,245,0.25);
        }
        .earn-status-pill {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.62rem;
          font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
          padding: 2px 10px; border-radius: 100px;
        }
        .earn-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          backdrop-filter: blur(10px); z-index: 300;
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .earn-modal {
          background: #111; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 32px; width: 100%; max-width: 420px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .earn-modal-title {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 1.3rem; color: #F5F5F5; margin-bottom: 4px;
        }
        .earn-modal-sub {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: rgba(245,245,245,0.38); margin-bottom: 24px;
        }
        .earn-modal-bal {
          background: rgba(201,255,71,0.07); border: 1px solid rgba(201,255,71,0.15);
          border-radius: 14px; padding: 14px 18px; margin-bottom: 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .earn-modal-bal-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.8rem;
          color: rgba(201,255,71,0.6); font-weight: 600;
        }
        .earn-modal-bal-val {
          font-family: var(--font-jetbrains-mono), monospace; font-weight: 700;
          font-size: 1.1rem; color: #C9FF47;
        }
        .earn-modal-input-wrap { position: relative; margin-bottom: 20px; }
        .earn-modal-currency {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          font-family: var(--font-jetbrains-mono), monospace; font-size: 1.1rem;
          font-weight: 700; color: rgba(245,245,245,0.4);
        }
        .earn-modal-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          padding: 14px 16px 14px 36px; font-family: var(--font-jetbrains-mono), monospace;
          font-size: 1.3rem; font-weight: 700; color: #F5F5F5; outline: none;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .earn-modal-input:focus { border-color: #C9FF47; }
        .earn-modal-input::placeholder { color: rgba(245,245,245,0.18); }
        .earn-modal-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem;
          color: rgba(245,245,245,0.3); margin-bottom: 20px; line-height: 1.5;
        }
        .earn-modal-actions { display: flex; gap: 10px; }
        .earn-btn {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          font-weight: 700; padding: 11px 24px; border-radius: 100px;
          border: none; cursor: pointer; transition: all 0.2s;
        }
        .earn-btn-primary { background: #C9FF47; color: #080808; }
        .earn-btn-primary:hover { opacity: 0.88; }
        .earn-btn-ghost {
          background: transparent; border: 1px solid rgba(255,255,255,0.12);
          color: rgba(245,245,245,0.55);
        }
        .earn-btn-ghost:hover { border-color: rgba(255,255,255,0.22); color: #F5F5F5; }
        @media (max-width: 640px) {
          .earn-balance-row { grid-template-columns: 1fr; }
          .earn-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .earn-header { flex-direction: column; align-items: flex-start; }
          .earn-title { font-size: 1.7rem; }
          .earn-row { flex-wrap: wrap; }
          .earn-sparkline-wrap { display: none; }
        }
      `}</style>

      <div className="earn-wrap">
        <div className="earn-header">
          <div>
            <div className="earn-label">Earnings</div>
            <div className="earn-title">Your Earnings</div>
            <div className="earn-subtitle">Track income, payouts, and session revenue.</div>
          </div>
          <div className="earn-period-pills">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.key}
                className={`earn-period-pill${period === p.key ? ' active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="earn-balance-row">
          <div className="earn-balance-card primary">
            <div className="earn-balance-card-label">Available Balance</div>
            <div className="earn-balance-amount">${availableBalance.toFixed(2)}</div>
            <div className="earn-balance-sub">Ready to withdraw to your bank</div>
            <button className="earn-withdraw-btn" onClick={() => { setWithdrawAmt(''); setWithdrawOpen(true) }}>
              Withdraw Funds
            </button>
            <div className="earn-sparkline-wrap">
              <Sparkline data={sparklineData} color="#C9FF47" />
            </div>
          </div>
          <div className="earn-balance-card">
            <div className="earn-balance-card-label">Pending Clearance</div>
            <div className="earn-balance-amount" style={{ color: '#00E5FF' }}>${stats.pending.toFixed(2)}</div>
            <div className="earn-balance-sub">Clears when session is completed</div>
          </div>
        </div>

        <div className="earn-stats-grid">
          {[
            { label: 'Gross Revenue', val: `$${stats.gross.toFixed(2)}`, color: '#C9FF47' },
            { label: 'Net Earned', val: `$${stats.net.toFixed(2)}`, color: '#00E5FF' },
            { label: 'Paid Sessions', val: stats.sessions, color: '#A78BFA' },
            { label: 'Platform Fees', val: `$${stats.fees.toFixed(2)}`, color: '#FF2D6E' },
          ].map((s) => (
            <div className="earn-stat-card" key={s.label}>
              <div className="earn-stat-bar" style={{ background: s.color }} />
              <div className="earn-stat-val" style={{ color: s.color === '#FF2D6E' ? '#FF2D6E' : '#F5F5F5' }}>
                {s.val}
              </div>
              <div className="earn-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="earn-table-card">
          <div className="earn-table-header">
            <span className="earn-table-title">Transaction History</span>
            <span className="earn-table-count">{filtered.length} transactions</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', color: 'rgba(245,245,245,0.3)', fontSize: '0.9rem' }}>
                No transactions in this period.
              </p>
            </div>
          ) : filtered.map((t) => {
            const isFree = t.grossAmount === 0
            const menteeName = getMenteeName(t)
            const color = getColor(menteeName)
            const initials = getInitials(menteeName)
            const topic = getSessionTopic(t)
            const dur = getDuration(t)

            let statusStyle = {}
            if (t.status === 'completed') statusStyle = { background: 'rgba(201,255,71,0.1)', border: '1px solid rgba(201,255,71,0.2)', color: '#C9FF47' }
            if (t.status === 'pending') statusStyle = { background: 'rgba(255,169,77,0.1)', border: '1px solid rgba(255,169,77,0.2)', color: '#FFA94D' }
            if (t.status === 'refunded') statusStyle = { background: 'rgba(255,45,110,0.1)', border: '1px solid rgba(255,45,110,0.2)', color: '#FF2D6E' }

            return (
              <div className="earn-row" key={t.id}>
                <div
                  className="earn-row-avatar"
                  style={{ background: color, boxShadow: `0 0 12px ${color}33` }}
                >
                  {initials}
                </div>
                <div className="earn-row-main">
                  <div className="earn-row-title">{topic}</div>
                  <div className="earn-row-meta">
                    <span className="earn-row-mentee">{menteeName}</span>
                    <span className="earn-row-date">{formatDate(t.createdAt)}</span>
                    <span className="earn-row-date">{dur} min</span>
                  </div>
                </div>
                <div className="earn-row-right">
                  {isFree ? (
                    <span className="earn-row-amount zero">Free</span>
                  ) : (
                    <>
                      <span className="earn-row-amount">+${t.netAmount.toFixed(2)}</span>
                      <span className="earn-row-fee">Fee: -${t.platformFee.toFixed(2)}</span>
                    </>
                  )}
                  <span className="earn-status-pill" style={statusStyle}>{t.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {withdrawOpen && (
        <div className="earn-overlay" onClick={() => setWithdrawOpen(false)}>
          <div className="earn-modal" onClick={(e) => e.stopPropagation()}>
            <div className="earn-modal-title">Withdraw Funds</div>
            <div className="earn-modal-sub">Transfer your earnings to your connected bank account.</div>
            <div className="earn-modal-bal">
              <span className="earn-modal-bal-label">Available Balance</span>
              <span className="earn-modal-bal-val">${availableBalance.toFixed(2)}</span>
            </div>
            <div className="earn-modal-input-wrap">
              <span className="earn-modal-currency">$</span>
              <input
                className="earn-modal-input"
                type="number"
                placeholder="0.00"
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                max={availableBalance}
              />
            </div>
            <div className="earn-modal-note">
              This is a dummy withdrawal. In production, this would connect to Stripe or a payment processor.
            </div>
            <div className="earn-modal-actions">
              <button className="earn-btn earn-btn-primary" style={{ flex: 1 }} onClick={() => setWithdrawOpen(false)}>
                Confirm Withdrawal
              </button>
              <button className="earn-btn earn-btn-ghost" onClick={() => setWithdrawOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
