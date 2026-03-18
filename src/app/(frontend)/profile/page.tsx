'use client'

import { useState } from 'react'
import { useSession } from '@/lib/auth-client'

const SKILLS_OPTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'UI/UX Design', 'Product Management',
  'Data Science', 'Machine Learning', 'GraphQL', 'Next.js', 'AWS', 'DevOps',
  'iOS', 'Android', 'Figma', 'Marketing', 'Startup', 'Leadership',
]

const INITIAL_SKILLS = ['React', 'TypeScript', 'Next.js', 'UI/UX Design']

const SOCIAL_ICONS: Record<string, string> = {
  github: '⬡',
  twitter: '✕',
  linkedin: '🔗',
  website: '🌐',
}

export default function ProfilePage() {
  const { data: session, isPending } = useSession()
  const user = session?.user as { name?: string; email?: string; role?: string; createdAt?: string } | null | undefined

  const [bio, setBio] = useState('Building things that matter. Passionate about accessible design and clean architecture.')
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState(bio)
  const [skills, setSkills] = useState<string[]>(INITIAL_SKILLS)
  const [editingSkills, setEditingSkills] = useState(false)
  const [social, setSocial] = useState({ github: '', twitter: '', linkedin: '', website: '' })
  const [editingSocial, setEditingSocial] = useState(false)
  const [socialDraft, setSocialDraft] = useState(social)
  const [saved, setSaved] = useState(false)

  if (isPending) {
    return (
      <div className="profile-loading">
        <style>{`.profile-loading{min-height:60vh;display:flex;align-items:center;justify-content:center}.spin{width:36px;height:36px;border:3px solid rgba(201,255,71,0.15);border-top-color:#C9FF47;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div className="spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(245,245,245,0.5)', fontSize: '1rem' }}>You need to be signed in to view your profile.</p>
        <a href="/login" style={{ fontFamily: "'DM Sans', sans-serif", background: '#C9FF47', color: '#080808', borderRadius: 100, padding: '10px 28px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</a>
      </div>
    )
  }

  const name = user.name || 'Anonymous'
  const email = user.email || ''
  const role = user.role || 'mentee'
  const isMentor = role === 'mentor'
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const joinDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const accentColor = isMentor ? '#C9FF47' : '#00E5FF'
  const accentColorDim = isMentor ? 'rgba(201,255,71,0.12)' : 'rgba(0,229,255,0.1)'
  const accentBorder = isMentor ? 'rgba(201,255,71,0.25)' : 'rgba(0,229,255,0.22)'
  const avatarGlow = isMentor ? '0 0 32px rgba(201,255,71,0.35)' : '0 0 32px rgba(0,229,255,0.35)'

  function toggleSkill(s: string) {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function saveBio() {
    setBio(bioDraft)
    setEditingBio(false)
    flashSaved()
  }

  function saveSocial() {
    setSocial(socialDraft)
    setEditingSocial(false)
    flashSaved()
  }

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const stats = [
    { label: 'Sessions', value: '12', color: '#C9FF47' },
    { label: 'Hours Learned', value: '34', color: '#00E5FF' },
    { label: 'Mentors', value: '3', color: '#FF2D6E' },
    { label: 'Day Streak', value: '7', color: '#A78BFA' },
  ]

  return (
    <>
      <style>{`
        .profile-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* ── Hero ── */
        .profile-hero {
          display: flex;
          align-items: flex-end;
          gap: 28px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .profile-avatar {
          width: 100px; height: 100px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif;
          font-weight: 800; font-size: 2rem;
          color: #080808;
          flex-shrink: 0;
          position: relative;
        }

        .profile-avatar-ring {
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 2px solid transparent;
          background: linear-gradient(#080808, #080808) padding-box,
                      linear-gradient(135deg, ${accentColor}, transparent) border-box;
        }

        .profile-meta {
          flex: 1;
          min-width: 220px;
        }

        .profile-name {
          font-family: var(--font-syne), sans-serif;
          font-weight: 800; font-size: 2rem;
          color: #F5F5F5;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .profile-role-badge {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 12px;
          border-radius: 100px;
          background: ${accentColorDim};
          border: 1px solid ${accentBorder};
          color: ${accentColor};
          margin-bottom: 10px;
        }

        .profile-email-row {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          color: rgba(245,245,245,0.4);
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
        }

        .profile-join {
          font-size: 0.78rem;
          color: rgba(245,245,245,0.28);
        }

        .profile-edit-btn {
          margin-left: auto;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 8px 22px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(245,245,245,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-edit-btn:hover {
          border-color: ${accentColor};
          color: ${accentColor};
          background: ${accentColorDim};
        }

        /* ── Stats ── */
        .profile-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }

        .profile-stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 18px 16px 16px;
          position: relative;
          overflow: hidden;
        }

        .profile-stat-bar {
          position: absolute;
          top: 0; left: 16px; right: 16px;
          height: 2px;
          border-radius: 0 0 2px 2px;
        }

        .profile-stat-value {
          font-family: var(--font-syne), sans-serif;
          font-weight: 800; font-size: 1.9rem;
          color: #F5F5F5;
          line-height: 1;
          margin-bottom: 4px;
        }

        .profile-stat-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.35);
        }

        /* ── Cards ── */
        .profile-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px 28px;
          margin-bottom: 16px;
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .profile-card-title {
          font-family: var(--font-syne), sans-serif;
          font-weight: 700; font-size: 1rem;
          color: #F5F5F5;
        }

        .profile-card-action {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 5px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(245,245,245,0.5);
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-card-action:hover, .profile-card-action.active {
          border-color: ${accentColor};
          color: ${accentColor};
          background: ${accentColorDim};
        }

        .profile-card-action.save {
          background: ${accentColor};
          color: #080808;
          border-color: ${accentColor};
        }

        .profile-card-action.save:hover {
          opacity: 0.9;
          color: #080808;
          background: ${accentColor};
        }

        /* Bio */
        .profile-bio-text {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(245,245,245,0.65);
        }

        .profile-bio-textarea {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 14px 16px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.95rem;
          line-height: 1.7;
          color: #F5F5F5;
          resize: vertical;
          min-height: 96px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .profile-bio-textarea:focus {
          border-color: ${accentColor};
        }

        /* Skills */
        .profile-skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .profile-skill-tag {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(245,245,245,0.6);
          cursor: default;
          transition: all 0.15s;
        }

        .profile-skill-tag.active {
          background: ${accentColorDim};
          border-color: ${accentBorder};
          color: ${accentColor};
        }

        .profile-skill-tag.selectable {
          cursor: pointer;
        }

        .profile-skill-tag.selectable:hover {
          border-color: rgba(255,255,255,0.2);
          color: #F5F5F5;
        }

        /* Social */
        .profile-social-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .profile-social-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
        }

        .profile-social-icon {
          font-size: 1rem;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
          color: rgba(245,245,245,0.35);
        }

        .profile-social-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.3);
          width: 60px;
          flex-shrink: 0;
        }

        .profile-social-val {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          color: rgba(245,245,245,0.55);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-social-val.empty {
          color: rgba(245,245,245,0.2);
          font-style: italic;
        }

        .profile-social-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          color: #F5F5F5;
        }

        .profile-social-input::placeholder {
          color: rgba(245,245,245,0.2);
        }

        /* Saved toast */
        .profile-saved-toast {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background: #C9FF47;
          color: #080808;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 10px 22px;
          border-radius: 100px;
          z-index: 999;
          animation: toast-in 0.25s cubic-bezier(0.16,1,0.3,1) both;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .profile-stats { grid-template-columns: repeat(2, 1fr); }
          .profile-social-grid { grid-template-columns: 1fr; }
          .profile-hero { gap: 20px; }
          .profile-name { font-size: 1.6rem; }
          .profile-avatar { width: 80px; height: 80px; font-size: 1.6rem; }
        }
      `}</style>

      <div className="profile-wrap">
        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-avatar" style={{ background: accentColor, boxShadow: avatarGlow }}>
            <div className="profile-avatar-ring" />
            {initials}
          </div>
          <div className="profile-meta">
            <div className="profile-name">{name}</div>
            <div className="profile-role-badge">{isMentor ? 'Mentor' : 'Mentee'}</div>
            <div className="profile-email-row">
              <span>{email}</span>
              <span className="profile-join">Joined {joinDate}</span>
            </div>
          </div>
          <button className="profile-edit-btn">Edit Avatar</button>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          {stats.map((s) => (
            <div className="profile-stat-card" key={s.label}>
              <div className="profile-stat-bar" style={{ background: s.color }} />
              <div className="profile-stat-value">{s.value}</div>
              <div className="profile-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div className="profile-card">
          <div className="profile-card-header">
            <span className="profile-card-title">About Me</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {editingBio && (
                <button className="profile-card-action save" onClick={saveBio}>Save</button>
              )}
              <button
                className={`profile-card-action${editingBio ? ' active' : ''}`}
                onClick={() => { setEditingBio(!editingBio); setBioDraft(bio) }}
              >
                {editingBio ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
          {editingBio ? (
            <textarea
              className="profile-bio-textarea"
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              placeholder="Tell mentors and mentees about yourself..."
            />
          ) : (
            <div className="profile-bio-text">{bio}</div>
          )}
        </div>

        {/* Skills */}
        <div className="profile-card">
          <div className="profile-card-header">
            <span className="profile-card-title">Skills & Interests</span>
            <button
              className={`profile-card-action${editingSkills ? ' active' : ''}`}
              onClick={() => { setEditingSkills(!editingSkills); if (editingSkills) flashSaved() }}
            >
              {editingSkills ? 'Done' : 'Edit'}
            </button>
          </div>
          {editingSkills ? (
            <div className="profile-skills-grid">
              {SKILLS_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={`profile-skill-tag selectable${skills.includes(s) ? ' active' : ''}`}
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="profile-skills-grid">
              {skills.length === 0 ? (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: 'rgba(245,245,245,0.25)', fontStyle: 'italic' }}>
                  No skills added yet — click Edit to add some.
                </span>
              ) : skills.map((s) => (
                <span key={s} className="profile-skill-tag active">{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Social */}
        <div className="profile-card">
          <div className="profile-card-header">
            <span className="profile-card-title">Links & Social</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {editingSocial && (
                <button className="profile-card-action save" onClick={saveSocial}>Save</button>
              )}
              <button
                className={`profile-card-action${editingSocial ? ' active' : ''}`}
                onClick={() => { setEditingSocial(!editingSocial); setSocialDraft(social) }}
              >
                {editingSocial ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
          <div className="profile-social-grid">
            {(Object.keys(SOCIAL_ICONS) as Array<keyof typeof SOCIAL_ICONS>).map((key) => (
              <div className="profile-social-item" key={key}>
                <span className="profile-social-icon">{SOCIAL_ICONS[key]}</span>
                <span className="profile-social-label">{key}</span>
                {editingSocial ? (
                  <input
                    className="profile-social-input"
                    value={socialDraft[key]}
                    onChange={(e) => setSocialDraft(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={key === 'website' ? 'https://yoursite.com' : `@${key}handle`}
                  />
                ) : (
                  <span className={`profile-social-val${!social[key] ? ' empty' : ''}`}>
                    {social[key] || 'Not set'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {saved && <div className="profile-saved-toast">Changes saved ✓</div>}
    </>
  )
}
