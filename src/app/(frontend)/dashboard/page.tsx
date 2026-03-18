'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'

interface SessionDoc {
  id: string
  topic: string
  status: string
  scheduledAt: string
  duration: number
  amountCharged: number
  mentor?: { id: string; user?: { name?: string } }
  mentee?: { id: string; user?: { name?: string } }
  mentorUser?: string | { id: string }
  menteeUser?: string | { id: string }
}

const css = `
  .db-page {
    min-height: calc(100vh - 68px);
    background: #080808;
    position: relative;
  }
  .db-page::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 65% 45% at 0% 0%, rgba(201,255,71,0.06) 0%, transparent 55%),
      radial-gradient(ellipse 55% 40% at 100% 80%, rgba(0,229,255,0.05) 0%, transparent 50%),
      radial-gradient(ellipse 40% 35% at 55% 50%, rgba(255,45,110,0.04) 0%, transparent 55%);
  }
  .db-inner {
    position: relative; z-index: 1;
    max-width: 1280px; margin: 0 auto;
    padding: 2.5rem clamp(1.25rem, 4vw, 3.5rem) 5rem;
  }
  .db-welcome {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2.5rem;
    animation: ms-reveal 0.5s ease-out both;
  }
  .db-greeting-tag {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 13px; background: rgba(201,255,71,0.07);
    border: 1px solid rgba(201,255,71,0.18); border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.73rem; font-weight: 600; color: #C9FF47;
    letter-spacing: 0.03em; margin-bottom: 1rem;
  }
  .db-greeting-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #C9FF47; box-shadow: 0 0 7px #C9FF47;
    animation: ms-blink 1.8s ease-in-out infinite; flex-shrink: 0;
  }
  .db-welcome-title {
    font-family: var(--font-syne), sans-serif; font-weight: 800;
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    letter-spacing: -0.04em; color: #F5F5F5; line-height: 1; margin-bottom: 0.5rem;
  }
  .db-welcome-title span { color: #C9FF47; font-style: italic; }
  .db-welcome-sub {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.95rem; color: rgba(245,245,245,0.38); font-weight: 400; line-height: 1.55;
  }
  .db-welcome-actions {
    display: flex; gap: 10px; align-items: center; flex-shrink: 0; flex-wrap: wrap;
  }
  .db-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 22px; background: #C9FF47; border: none; border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif; font-weight: 700;
    font-size: 0.875rem; color: #080808; cursor: pointer; transition: all 0.2s;
    text-decoration: none; box-shadow: 0 0 28px rgba(201,255,71,0.22); white-space: nowrap;
  }
  .db-btn-primary:hover { background: #D8FF60; transform: translateY(-1px); box-shadow: 0 0 40px rgba(201,255,71,0.4); }
  .db-btn-ghost {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 22px; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif; font-weight: 600;
    font-size: 0.875rem; color: rgba(245,245,245,0.65);
    cursor: pointer; transition: all 0.2s; text-decoration: none; white-space: nowrap;
  }
  .db-btn-ghost:hover { border-color: rgba(255,255,255,0.22); color: #F5F5F5; background: rgba(255,255,255,0.07); }
  .db-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1rem; margin-bottom: 2rem; animation: ms-reveal 0.5s ease-out 0.05s both;
  }
  .db-stat-card {
    background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px; padding: 1.4rem 1.5rem;
    position: relative; overflow: hidden; transition: all 0.22s;
  }
  .db-stat-card:hover {
    border-color: rgba(255,255,255,0.12); transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }
  .db-stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .db-stat-card.lime::before { background: #C9FF47; }
  .db-stat-card.cyan::before { background: #00E5FF; }
  .db-stat-card.pink::before { background: #FF2D6E; }
  .db-stat-card.purple::before { background: #B47AFF; }
  .db-stat-icon { font-size: 1.4rem; margin-bottom: 0.9rem; display: block; line-height: 1; }
  .db-stat-value {
    font-family: var(--font-syne), sans-serif; font-weight: 800;
    font-size: 2rem; letter-spacing: -0.04em; line-height: 1; margin-bottom: 0.3rem;
  }
  .db-stat-value.lime { color: #C9FF47; }
  .db-stat-value.cyan { color: #00E5FF; }
  .db-stat-value.pink { color: #FF2D6E; }
  .db-stat-value.purple { color: #B47AFF; }
  .db-stat-label {
    font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem;
    color: rgba(245,245,245,0.38); font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .db-grid {
    display: grid; grid-template-columns: 1fr 340px; gap: 1.25rem; align-items: start;
  }
  .db-col-left { display: flex; flex-direction: column; gap: 1.25rem; }
  .db-col-right { display: flex; flex-direction: column; gap: 1.25rem; }
  .db-card {
    background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px; overflow: hidden;
  }
  .db-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.4rem 1.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .db-card-title {
    font-family: var(--font-syne), sans-serif; font-weight: 700;
    font-size: 0.95rem; color: #F5F5F5; letter-spacing: -0.02em;
  }
  .db-card-link {
    font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem;
    color: #C9FF47; font-weight: 600; text-decoration: none; transition: opacity 0.18s;
  }
  .db-card-link:hover { opacity: 0.72; }
  .db-sessions { display: flex; flex-direction: column; }
  .db-session-item {
    display: flex; align-items: center; gap: 14px;
    padding: 1.1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 0.18s;
  }
  .db-session-item:last-child { border-bottom: none; }
  .db-session-item:hover { background: rgba(255,255,255,0.025); }
  .db-session-avatar {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-syne), sans-serif; font-weight: 800;
    font-size: 0.82rem; flex-shrink: 0; color: #080808;
  }
  .db-session-info { flex: 1; min-width: 0; }
  .db-session-mentor {
    font-family: var(--font-dm-sans), sans-serif; font-weight: 600;
    font-size: 0.9rem; color: #F5F5F5; margin-bottom: 2px;
  }
  .db-session-topic {
    font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem;
    color: rgba(245,245,245,0.38); font-weight: 400;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .db-session-time-wrap { text-align: right; flex-shrink: 0; }
  .db-session-date {
    font-family: var(--font-dm-sans), sans-serif; font-weight: 600;
    font-size: 0.8rem; color: rgba(245,245,245,0.7); margin-bottom: 3px;
  }
  .db-session-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif; font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap;
  }
  .db-session-badge.today {
    background: rgba(201,255,71,0.1); border: 1px solid rgba(201,255,71,0.22); color: #C9FF47;
  }
  .db-session-badge.upcoming {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(245,245,245,0.45);
  }
  .db-session-badge.pending {
    background: rgba(255,169,77,0.1); border: 1px solid rgba(255,169,77,0.2); color: #FFA94D;
  }
  .db-session-badge-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: currentColor; animation: ms-blink 1.8s ease-in-out infinite; flex-shrink: 0;
  }
  .db-session-join {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; margin-top: 8px;
    background: #C9FF47; border: none; border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif; font-weight: 700;
    font-size: 0.72rem; color: #080808;
    cursor: pointer; transition: all 0.18s; text-decoration: none;
    box-shadow: 0 0 18px rgba(201,255,71,0.2);
  }
  .db-session-join:hover { background: #D8FF60; transform: translateY(-1px); }
  .db-sessions-empty { padding: 2.5rem 1.5rem; text-align: center; }
  .db-sessions-empty-text {
    font-family: var(--font-dm-sans), sans-serif; font-size: 0.88rem;
    color: rgba(245,245,245,0.32); font-weight: 400;
  }
  .db-actions { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 8px; }
  .db-action-btn {
    display: flex; align-items: center; gap: 11px;
    padding: 12px 14px; background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
    cursor: pointer; transition: all 0.18s; text-decoration: none;
  }
  .db-action-btn:hover {
    background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.14);
    transform: translateX(3px);
  }
  .db-action-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; flex-shrink: 0;
  }
  .db-action-label {
    font-family: var(--font-dm-sans), sans-serif; font-weight: 600;
    font-size: 0.875rem; color: rgba(245,245,245,0.72); flex: 1;
  }
  .db-action-arrow { color: rgba(245,245,245,0.22); font-size: 0.75rem; transition: transform 0.18s; }
  .db-action-btn:hover .db-action-arrow { transform: translateX(3px); color: rgba(245,245,245,0.5); }
  .db-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: calc(100vh - 68px); flex-direction: column; gap: 1rem;
  }
  .db-loading-spinner {
    width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.08);
    border-top-color: #C9FF47; border-radius: 50%; animation: auth-spin 0.8s linear infinite;
  }
  .db-loading-text {
    font-family: var(--font-dm-sans), sans-serif; font-size: 0.88rem;
    color: rgba(245,245,245,0.3); font-weight: 400;
  }
  @keyframes auth-spin { to { transform: rotate(360deg); } }
  @keyframes ms-reveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes ms-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @media (max-width: 1024px) {
    .db-grid { grid-template-columns: 1fr; }
    .db-stats { grid-template-columns: repeat(2, 1fr); }
    .db-col-right { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
  }
  @media (max-width: 640px) {
    .db-stats { grid-template-columns: repeat(2, 1fr); }
    .db-col-right { grid-template-columns: 1fr; }
    .db-welcome { flex-direction: column; }
  }
`

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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

function getOtherName(s: SessionDoc, userId: string | undefined): string {
  const mentorUserId = typeof s.mentorUser === 'string' ? s.mentorUser : s.mentorUser?.id
  const isMentor = userId === mentorUserId
  if (isMentor) {
    if (s.mentee && typeof s.mentee === 'object' && s.mentee.user && typeof s.mentee.user === 'object') {
      return s.mentee.user.name || 'Mentee'
    }
    return 'Mentee'
  }
  if (s.mentor && typeof s.mentor === 'object' && s.mentor.user && typeof s.mentor.user === 'object') {
    return s.mentor.user.name || 'Mentor'
  }
  return 'Mentor'
}

const QUICK_ACTIONS = [
  { icon: '🔍', label: 'Find a new mentor', href: '/mentors', color: 'rgba(201,255,71,0.1)', border: 'rgba(201,255,71,0.18)' },
  { icon: '📅', label: 'View my sessions', href: '/sessions', color: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.15)' },
  { icon: '💰', label: 'View earnings', href: '/earnings', color: 'rgba(255,45,110,0.08)', border: 'rgba(255,45,110,0.15)' },
  { icon: '👤', label: 'Edit profile', href: '/profile', color: 'rgba(180,122,255,0.08)', border: 'rgba(180,122,255,0.15)' },
]

export default function DashboardPage() {
  const { data: authSession, isPending } = useSession()
  const user = authSession?.user as { id?: string; name?: string; email?: string; role?: string } | undefined

  const [sessions, setSessions] = useState<SessionDoc[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isPending && user) fetchData()
    else if (!isPending) setLoading(false)
  }, [isPending, user, fetchData])

  if (isPending || loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="db-loading">
          <div className="db-loading-spinner" />
          <span className="db-loading-text">Loading your dashboard...</span>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="db-loading">
          <span className="db-loading-text">
            Please{' '}
            <Link href="/login" style={{ color: '#C9FF47', fontWeight: 700 }}>sign in</Link>{' '}
            to view your dashboard
          </span>
        </div>
      </>
    )
  }

  const firstName = user.name?.split(' ')[0] ?? 'there'
  const upcomingSessions = sessions.filter(s => s.status === 'pending' || s.status === 'confirmed').slice(0, 5)
  const completedCount = sessions.filter(s => s.status === 'completed').length
  const totalHours = sessions.filter(s => s.status === 'completed').reduce((a, s) => a + s.duration, 0) / 60
  const totalEarned = sessions
    .filter(s => s.status === 'completed')
    .reduce((a, s) => a + (s.amountCharged || 0) * 0.9, 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="db-page">
        <div className="db-inner">
          <div className="db-welcome">
            <div>
              <div className="db-greeting-tag">
                <span className="db-greeting-dot" />
                {getGreeting()}, {firstName}
              </div>
              <h1 className="db-welcome-title">
                Your <span>dashboard</span>
              </h1>
              <p className="db-welcome-sub">
                {upcomingSessions.length > 0
                  ? `${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? 's' : ''}`
                  : 'No upcoming sessions'}
                {completedCount > 0 ? ` · ${completedCount} completed` : ''}
              </p>
            </div>
            <div className="db-welcome-actions">
              <Link href="/mentors" className="db-btn-primary">Find mentors</Link>
              <Link href="/sessions" className="db-btn-ghost">My sessions</Link>
            </div>
          </div>

          <div className="db-stats">
            {[
              { icon: '📅', value: String(sessions.length), label: 'Total Sessions', cls: 'lime' },
              { icon: '⏱', value: `${totalHours.toFixed(1)}h`, label: 'Hours', cls: 'cyan' },
              { icon: '✅', value: String(completedCount), label: 'Completed', cls: 'pink' },
              { icon: '💰', value: user.role === 'mentor' ? `$${totalEarned.toFixed(0)}` : `${upcomingSessions.length}`, label: user.role === 'mentor' ? 'Earned' : 'Upcoming', cls: 'purple' },
            ].map((s) => (
              <div key={s.label} className={`db-stat-card ${s.cls}`}>
                <span className="db-stat-icon">{s.icon}</span>
                <div className={`db-stat-value ${s.cls}`}>{s.value}</div>
                <div className="db-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="db-grid">
            <div className="db-col-left">
              <div className="db-card" style={{ animation: 'ms-reveal 0.5s ease-out 0.1s both' }}>
                <div className="db-card-header">
                  <span className="db-card-title">Upcoming Sessions</span>
                  <Link href="/sessions" className="db-card-link">View all →</Link>
                </div>
                <div className="db-sessions">
                  {upcomingSessions.length === 0 ? (
                    <div className="db-sessions-empty">
                      <span className="db-sessions-empty-text">
                        No upcoming sessions.{' '}
                        <Link href="/mentors" style={{ color: '#C9FF47', fontWeight: 600, textDecoration: 'none' }}>Find a mentor</Link> to get started!
                      </span>
                    </div>
                  ) : upcomingSessions.map((s) => {
                    const otherName = getOtherName(s, user.id)
                    const color = getColor(otherName)
                    const initials = getInitials(otherName)
                    const today = isToday(s.scheduledAt)

                    return (
                      <div key={s.id} className="db-session-item">
                        <div className="db-session-avatar" style={{ background: color }}>{initials}</div>
                        <div className="db-session-info">
                          <div className="db-session-mentor">{otherName}</div>
                          <div className="db-session-topic">{s.topic}</div>
                          {today && (
                            <Link href={`/sessions/${s.id}/chat`} className="db-session-join">
                              💬 Chat now
                            </Link>
                          )}
                        </div>
                        <div className="db-session-time-wrap">
                          <div className="db-session-date">
                            {formatDate(s.scheduledAt)} · {new Date(s.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                          <div className={`db-session-badge ${today ? 'today' : s.status === 'pending' ? 'pending' : 'upcoming'}`}>
                            <span className="db-session-badge-dot" />
                            {today ? 'Today' : s.status === 'pending' ? 'Pending' : 'Confirmed'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="db-col-right">
              <div className="db-card" style={{ animation: 'ms-reveal 0.5s ease-out 0.18s both' }}>
                <div className="db-card-header">
                  <span className="db-card-title">Quick Actions</span>
                </div>
                <div className="db-actions">
                  {QUICK_ACTIONS.map((a) => (
                    <Link key={a.label} href={a.href} className="db-action-btn">
                      <div className="db-action-icon" style={{ background: a.color, border: `1px solid ${a.border}` }}>
                        {a.icon}
                      </div>
                      <span className="db-action-label">{a.label}</span>
                      <span className="db-action-arrow">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
