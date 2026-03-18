'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'

interface NavUserProps {
  name: string
  email: string
  role: string
}

export default function NavUser({ name, email, role }: NavUserProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isMentor = role === 'mentor'

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <style>{`
        .nav-user-wrap {
          position: relative;
        }

        .nav-user-trigger {
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          padding: 5px 14px 5px 5px;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
        }

        .nav-user-trigger:hover {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.07);
        }

        .nav-user-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif;
          font-weight: 800; font-size: 0.65rem;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }

        .nav-user-avatar.mentor {
          background: #C9FF47;
          color: #080808;
          box-shadow: 0 0 14px rgba(201,255,71,0.4);
        }

        .nav-user-avatar.mentee {
          background: #00E5FF;
          color: #080808;
          box-shadow: 0 0 14px rgba(0,229,255,0.4);
        }

        .nav-user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .nav-user-name {
          font-family: var(--font-dm-sans), sans-serif;
          font-weight: 600;
          font-size: 0.82rem;
          color: #F5F5F5;
          line-height: 1;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-user-role {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 1px 7px;
          border-radius: 100px;
        }

        .nav-user-role.mentor {
          background: rgba(201,255,71,0.12);
          border: 1px solid rgba(201,255,71,0.25);
          color: #C9FF47;
        }

        .nav-user-role.mentee {
          background: rgba(0,229,255,0.1);
          border: 1px solid rgba(0,229,255,0.22);
          color: #00E5FF;
        }

        .nav-user-chevron {
          color: rgba(245,245,245,0.35);
          font-size: 0.65rem;
          transition: transform 0.2s;
          margin-left: 2px;
        }

        .nav-user-chevron.open { transform: rotate(180deg); }

        /* Dropdown */
        .nav-user-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 220px;
          background: rgba(14,14,14,0.96);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 6px;
          z-index: 100;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          animation: nav-dropdown-in 0.18s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes nav-dropdown-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .nav-dropdown-header {
          padding: 10px 12px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 6px;
        }

        .nav-dropdown-email {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: rgba(245,245,245,0.35);
          font-weight: 400;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
          text-decoration: none;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(245,245,245,0.72);
          text-align: left;
        }

        .nav-dropdown-item:hover {
          background: rgba(255,255,255,0.06);
          color: #F5F5F5;
        }

        .nav-dropdown-item-icon {
          font-size: 0.9rem;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
        }

        .nav-dropdown-separator {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 6px 0;
        }

        .nav-dropdown-item.danger {
          color: #FF2D6E;
        }

        .nav-dropdown-item.danger:hover {
          background: rgba(255,45,110,0.08);
          color: #FF2D6E;
        }

        .nav-dropdown-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .nav-user-info { display: none; }
          .nav-user-chevron { display: none; }
          .nav-user-trigger { padding: 5px; }
        }
      `}</style>

      <div className="nav-user-wrap">
        <button
          className="nav-user-trigger"
          onClick={() => setOpen((o) => !o)}
          aria-label="User menu"
        >
          <div className={`nav-user-avatar ${isMentor ? 'mentor' : 'mentee'}`}>{initials}</div>
          <div className="nav-user-info">
            <span className="nav-user-name">{name}</span>
            <span className={`nav-user-role ${isMentor ? 'mentor' : 'mentee'}`}>
              {isMentor ? 'Mentor' : 'Mentee'}
            </span>
          </div>
          <span className={`nav-user-chevron${open ? ' open' : ''}`}>▼</span>
        </button>

        {open && (
          <>
            {/* backdrop to close */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setOpen(false)}
            />
            <div className="nav-user-dropdown">
              <div className="nav-dropdown-header">
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#F5F5F5',
                    marginBottom: 3,
                  }}
                >
                  {name}
                </div>
                <div className="nav-dropdown-email">{email}</div>
              </div>

              <a href="/dashboard" className="nav-dropdown-item" style={{ textDecoration: 'none' }}>
                <span className="nav-dropdown-item-icon">⚡</span>
                Dashboard
              </a>
              <a href="/profile" className="nav-dropdown-item">
                <span className="nav-dropdown-item-icon">👤</span>
                My Profile
              </a>
              <a href="/sessions" className="nav-dropdown-item">
                <span className="nav-dropdown-item-icon">🗓</span>
                My Sessions
              </a>
              {isMentor && (
                <a href="/earnings" className="nav-dropdown-item">
                  <span className="nav-dropdown-item-icon">💰</span>
                  Earnings
                </a>
              )}

              <div className="nav-dropdown-separator" />

              <button
                className="nav-dropdown-item danger"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <span className="nav-dropdown-item-icon">🚪</span>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
