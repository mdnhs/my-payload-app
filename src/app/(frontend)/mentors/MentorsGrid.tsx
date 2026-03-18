'use client'

import { useMemo } from 'react'
import { useQueryState, parseAsString } from 'nuqs'
import Link from 'next/link'

const css = `
  .fm-page {
    min-height: calc(100vh - 68px);
    background: #080808;
    position: relative;
  }

  .fm-page::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 70% 50% at 10% 0%, rgba(201,255,71,0.06) 0%, transparent 55%),
      radial-gradient(ellipse 55% 45% at 90% 80%, rgba(59,130,246,0.05) 0%, transparent 50%);
    z-index: 0;
  }

  /* ── HERO HEADER ── */
  .fm-header {
    position: relative; z-index: 1;
    padding: 3.5rem clamp(1.25rem, 5vw, 5rem) 0;
    max-width: 1280px;
    margin: 0 auto;
  }

  .fm-header-label {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 14px;
    background: rgba(201,255,71,0.07);
    border: 1px solid rgba(201,255,71,0.2);
    border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem; font-weight: 600;
    color: #C9FF47; letter-spacing: 0.03em;
    margin-bottom: 1.5rem;
    animation: ms-reveal 0.5s ease-out both;
  }

  .fm-header-label-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #C9FF47; box-shadow: 0 0 7px #C9FF47;
    animation: ms-blink 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  .fm-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: clamp(2rem, 4.5vw, 3.8rem);
    letter-spacing: -0.045em;
    line-height: 0.95;
    color: #F5F5F5;
    margin-bottom: 0.75rem;
    animation: ms-reveal 0.6s ease-out 0.05s both;
  }

  .fm-title-lime { color: #C9FF47; font-style: italic; }

  .fm-subtitle {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 1rem; font-weight: 400;
    color: rgba(245,245,245,0.42);
    line-height: 1.65;
    max-width: 540px;
    animation: ms-reveal 0.6s ease-out 0.1s both;
    margin-bottom: 2.5rem;
  }

  /* ── SEARCH BAR ── */
  .fm-search-wrap {
    display: flex; gap: 10px; align-items: center;
    max-width: 680px;
    margin-bottom: 2.5rem;
    animation: ms-reveal 0.6s ease-out 0.15s both;
  }

  .fm-search-box {
    flex: 1; position: relative;
  }

  .fm-search-icon {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    color: rgba(245,245,245,0.22);
    font-size: 0.95rem; pointer-events: none;
  }

  .fm-search-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 13px 16px 13px 46px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.95rem; font-weight: 400;
    color: #F5F5F5; outline: none;
    transition: all 0.2s;
  }

  .fm-search-input::placeholder { color: rgba(245,245,245,0.2); }

  .fm-search-input:focus {
    border-color: rgba(201,255,71,0.45);
    background: rgba(201,255,71,0.03);
    box-shadow: 0 0 0 3px rgba(201,255,71,0.1);
  }

  .fm-search-btn {
    padding: 13px 24px;
    background: #C9FF47;
    border: none; border-radius: 14px;
    font-family: var(--font-dm-sans), sans-serif; font-weight: 700;
    font-size: 0.9rem; color: #080808;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 0 28px rgba(201,255,71,0.2);
  }

  .fm-search-btn:hover {
    background: #D8FF60;
    transform: translateY(-1px);
    box-shadow: 0 0 40px rgba(201,255,71,0.4);
  }

  /* ── FILTER PILLS ── */
  .fm-filters {
    display: flex; gap: 8px; flex-wrap: wrap;
    margin-bottom: 0;
    animation: ms-reveal 0.6s ease-out 0.2s both;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .fm-filter-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 18px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem; font-weight: 500;
    color: rgba(245,245,245,0.55);
    cursor: pointer; transition: all 0.18s;
    white-space: nowrap;
  }

  .fm-filter-pill:hover {
    border-color: rgba(255,255,255,0.2);
    color: #F5F5F5;
    background: rgba(255,255,255,0.06);
  }

  .fm-filter-pill.active {
    background: #C9FF47;
    border-color: #C9FF47;
    color: #080808;
    font-weight: 700;
    box-shadow: 0 0 20px rgba(201,255,71,0.25);
  }

  .fm-filter-pill-emoji { font-size: 0.9rem; }

  /* ── MAIN LAYOUT ── */
  .fm-body {
    position: relative; z-index: 1;
    max-width: 1280px;
    margin: 0 auto;
    padding: 2.5rem clamp(1.25rem, 5vw, 5rem) 5rem;
  }

  .fm-results-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.75rem; flex-wrap: wrap; gap: 12px;
  }

  .fm-results-count {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.88rem; color: rgba(245,245,245,0.38); font-weight: 400;
  }

  .fm-results-count strong { color: rgba(245,245,245,0.72); font-weight: 700; }

  .fm-sort-wrap {
    display: flex; align-items: center; gap: 8px;
  }

  .fm-sort-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem; color: rgba(245,245,245,0.35); font-weight: 400;
  }

  .fm-sort-select {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 7px 32px 7px 12px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem; font-weight: 600;
    color: #F5F5F5; outline: none; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(245,245,245,0.3)'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    transition: border-color 0.18s;
  }

  .fm-sort-select:focus { border-color: rgba(201,255,71,0.4); }

  /* ── MENTOR GRID ── */
  .fm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 1rem;
  }

  /* ── MENTOR CARD ── */
  .fm-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; gap: 0.85rem;
    animation: ms-reveal 0.5s ease-out both;
  }

  .fm-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    opacity: 0; transition: opacity 0.25s;
    background: linear-gradient(90deg, #C9FF47, transparent 70%);
  }

  .fm-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.12);
    box-shadow: 0 20px 48px rgba(0,0,0,0.5);
  }

  .fm-card:hover::before { opacity: 1; }

  /* card top */
  .fm-card-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 12px;
  }

  .fm-avatar-wrap { position: relative; flex-shrink: 0; }

  .fm-avatar {
    width: 52px; height: 52px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-syne), sans-serif;
    font-weight: 800; font-size: 1rem;
    color: #080808; flex-shrink: 0;
    background: #C9FF47;
  }

  .fm-online-dot {
    position: absolute; bottom: -2px; right: -2px;
    width: 12px; height: 12px;
    background: #4ADE80;
    border: 2px solid #0e0e0e;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(74,222,128,0.7);
  }

  .fm-card-meta { flex: 1; min-width: 0; }

  .fm-mentor-name {
    font-family: var(--font-syne), sans-serif;
    font-weight: 700; font-size: 1rem;
    color: #F5F5F5; margin-bottom: 2px;
    letter-spacing: -0.02em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .fm-mentor-title {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem; color: rgba(245,245,245,0.45);
    font-weight: 400; line-height: 1.4;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .fm-country-badge {
    flex-shrink: 0;
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    background: rgba(59,130,246,0.08);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.68rem; font-weight: 600;
    color: #60A5FA; letter-spacing: 0.02em;
    white-space: nowrap;
  }

  /* info row */
  .fm-info-row {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }

  .fm-info-tag {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem; color: rgba(245,245,245,0.4); font-weight: 400;
  }

  .fm-info-dot {
    width: 3px; height: 3px; border-radius: 50%;
    background: rgba(245,245,245,0.2); flex-shrink: 0;
  }

  /* rating row */
  .fm-rating-row {
    display: flex; align-items: center; gap: 8px;
  }

  .fm-stars { color: #FFD84D; font-size: 0.75rem; letter-spacing: 1px; }

  .fm-rating-num {
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 700; font-size: 0.82rem; color: #F5F5F5;
  }

  .fm-reviews {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem; color: rgba(245,245,245,0.28); font-weight: 400;
  }

  .fm-rating-dot {
    width: 3px; height: 3px; border-radius: 50%;
    background: rgba(245,245,245,0.2); flex-shrink: 0;
  }

  .fm-sessions-count {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem; color: rgba(245,245,245,0.28); font-weight: 400;
  }

  /* services */
  .fm-services {
    display: flex; flex-wrap: wrap; gap: 6px;
  }

  .fm-service {
    display: inline-flex;
    padding: 4px 11px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem; font-weight: 500;
    color: rgba(245,245,245,0.55);
    white-space: nowrap;
  }

  /* card footer */
  .fm-card-footer {
    display: flex; align-items: center;
    justify-content: space-between;
    padding-top: 0.85rem;
    border-top: 1px solid rgba(255,255,255,0.06);
    gap: 12px;
  }

  .fm-price-wrap { display: flex; flex-direction: column; gap: 1px; }

  .fm-price {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800; font-size: 1.1rem;
    color: #F5F5F5; line-height: 1; letter-spacing: -0.03em;
  }

  .fm-price-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.68rem; color: rgba(245,245,245,0.28);
    font-weight: 400; text-transform: uppercase; letter-spacing: 0.05em;
  }

  .fm-free-intro {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.68rem; color: #C9FF47; font-weight: 600;
  }

  .fm-book-btn {
    padding: 10px 20px;
    background: #C9FF47;
    border: none; border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif; font-weight: 700;
    font-size: 0.82rem; color: #080808;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 0 20px rgba(201,255,71,0.2);
    text-decoration: none; display: inline-block;
  }

  .fm-book-btn:hover {
    background: #D8FF60;
    transform: translateY(-1px);
    box-shadow: 0 0 32px rgba(201,255,71,0.4);
  }

  /* empty state */
  .fm-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 5rem 2rem;
  }

  .fm-empty-emoji { font-size: 3rem; margin-bottom: 1rem; display: block; }

  .fm-empty-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800; font-size: 1.4rem;
    color: #F5F5F5; margin-bottom: 0.5rem;
    letter-spacing: -0.03em;
  }

  .fm-empty-sub {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.9rem; color: rgba(245,245,245,0.38);
    font-weight: 400;
  }

  @keyframes ms-reveal {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes ms-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  @media (max-width: 640px) {
    .fm-grid { grid-template-columns: 1fr; }
    .fm-search-btn { display: none; }
    .fm-sort-wrap { display: none; }
  }
`

const COUNTRIES = [
  { label: 'All', emoji: '🌍', value: 'all' },
  { label: 'USA', emoji: '🇺🇸', value: 'usa' },
  { label: 'UK', emoji: '🇬🇧', value: 'uk' },
  { label: 'Canada', emoji: '🇨🇦', value: 'canada' },
  { label: 'Australia', emoji: '🇦🇺', value: 'australia' },
  { label: 'Germany', emoji: '🇩🇪', value: 'germany' },
  { label: 'Japan', emoji: '🇯🇵', value: 'japan' },
  { label: 'France', emoji: '🇫🇷', value: 'france' },
  { label: 'Netherlands', emoji: '🇳🇱', value: 'netherlands' },
  { label: 'Sweden', emoji: '🇸🇪', value: 'sweden' },
  { label: 'Ireland', emoji: '🇮🇪', value: 'ireland' },
]

const COUNTRY_LABELS: Record<string, string> = {
  usa: 'USA', uk: 'UK', canada: 'Canada', australia: 'Australia',
  germany: 'Germany', france: 'France', netherlands: 'Netherlands',
  sweden: 'Sweden', japan: 'Japan', south_korea: 'South Korea',
  ireland: 'Ireland', new_zealand: 'New Zealand', singapore: 'Singapore',
  malaysia: 'Malaysia', italy: 'Italy', spain: 'Spain',
  switzerland: 'Switzerland', finland: 'Finland', denmark: 'Denmark',
  norway: 'Norway', other: 'Other',
}

const SERVICE_LABELS: Record<string, string> = {
  university_selection: 'University Selection',
  application_review: 'Application Review',
  sop_review: 'SOP / Essay Review',
  visa_guidance: 'Visa Guidance',
  scholarship: 'Scholarship Help',
  interview_prep: 'Interview Prep',
  accommodation: 'Accommodation',
  lifestyle_guide: 'Lifestyle Guide',
  job_guidance: 'Job Guidance',
  language_test: 'IELTS/TOEFL Prep',
}

const DEGREE_LABELS: Record<string, string> = {
  bachelor: "Bachelor's", master: "Master's", phd: 'PhD',
  postdoc: 'Postdoc', working: 'Working Professional', language: 'Language Course',
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export type MentorRow = {
  id: string
  name: string
  headline: string
  country: string
  university: string
  degree: string
  fieldOfStudy: string
  yearsAbroad: number
  services: string[]
  hourlyRate: number
  isAvailable: boolean
  introCallFree: boolean
  rating: number
  reviewCount: number
  totalSessions: number
}

export default function MentorsGrid({ mentors }: { mentors: MentorRow[] }) {
  const [activeCountry, setActiveCountry] = useQueryState('country', parseAsString.withDefault('all').withOptions({ shallow: false }))
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: false }))
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('top-rated').withOptions({ shallow: false }))

  const filtered = useMemo(() => {
    let list = mentors
    if (activeCountry !== 'all') list = list.filter((m) => m.country === activeCountry)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.headline.toLowerCase().includes(q) ||
          m.university.toLowerCase().includes(q) ||
          m.fieldOfStudy.toLowerCase().includes(q) ||
          m.services.some((s) => (SERVICE_LABELS[s] ?? s).toLowerCase().includes(q)),
      )
    }
    if (sort === 'top-rated') list = [...list].sort((a, b) => b.rating - a.rating)
    else if (sort === 'most-reviewed') list = [...list].sort((a, b) => b.reviewCount - a.reviewCount)
    else if (sort === 'price-low') list = [...list].sort((a, b) => a.hourlyRate - b.hourlyRate)
    else if (sort === 'price-high') list = [...list].sort((a, b) => b.hourlyRate - a.hourlyRate)
    return list
  }, [activeCountry, search, sort, mentors])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="fm-page">
        {/* ── HEADER ── */}
        <div className="fm-header">
          <div className="fm-header-label">
            <span className="fm-header-label-dot" />
            {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} across {new Set(mentors.map(m => m.country)).size} countries
          </div>

          <h1 className="fm-title">
            Find your <span className="fm-title-lime">guide</span> abroad.
          </h1>
          <p className="fm-subtitle">
            Connect with mentors who are already studying or living in your dream country.
            Get real advice on admissions, visas, scholarships, and life abroad.
          </p>

          {/* Search */}
          <div className="fm-search-wrap">
            <div className="fm-search-box">
              <span className="fm-search-icon">🔍</span>
              <input
                type="text"
                className="fm-search-input"
                placeholder="Search by name, university, country, or service…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="fm-search-btn">Search</button>
          </div>

          {/* Country filters */}
          <div className="fm-filters">
            {COUNTRIES.map((c) => (
              <button
                key={c.value}
                className={`fm-filter-pill${activeCountry === c.value ? ' active' : ''}`}
                onClick={() => setActiveCountry(c.value)}
              >
                <span className="fm-filter-pill-emoji">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RESULTS ── */}
        <div className="fm-body">
          <div className="fm-results-bar">
            <p className="fm-results-count">
              Showing <strong>{filtered.length}</strong> mentor{filtered.length !== 1 ? 's' : ''}
              {activeCountry !== 'all' && (
                <> in <strong>{COUNTRIES.find((c) => c.value === activeCountry)?.label}</strong></>
              )}
            </p>
            <div className="fm-sort-wrap">
              <span className="fm-sort-label">Sort by</span>
              <select
                className="fm-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="top-rated">Top rated</option>
                <option value="most-reviewed">Most reviewed</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>
          </div>

          <div className="fm-grid">
            {filtered.length === 0 ? (
              <div className="fm-empty">
                <span className="fm-empty-emoji">🌏</span>
                <div className="fm-empty-title">No mentors found</div>
                <p className="fm-empty-sub">
                  {mentors.length === 0
                    ? 'No mentors have registered yet. Be the first!'
                    : 'Try a different search or country filter'}
                </p>
              </div>
            ) : (
              filtered.map((mentor, i) => {
                const initials = getInitials(mentor.name)
                return (
                  <div
                    key={mentor.id}
                    className="fm-card"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    {/* Top row */}
                    <div className="fm-card-top">
                      <div className="fm-avatar-wrap">
                        <div className="fm-avatar">
                          {initials}
                        </div>
                        {mentor.isAvailable && <span className="fm-online-dot" />}
                      </div>

                      <div className="fm-card-meta">
                        <div className="fm-mentor-name">{mentor.name}</div>
                        <div className="fm-mentor-title">{mentor.headline}</div>
                      </div>

                      <div className="fm-country-badge">
                        {COUNTRY_LABELS[mentor.country] ?? mentor.country}
                      </div>
                    </div>

                    {/* Info row */}
                    <div className="fm-info-row">
                      {mentor.university && (
                        <span className="fm-info-tag">🎓 {mentor.university}</span>
                      )}
                      {mentor.university && mentor.degree && <span className="fm-info-dot" />}
                      {mentor.degree && (
                        <span className="fm-info-tag">{DEGREE_LABELS[mentor.degree] ?? mentor.degree}</span>
                      )}
                      {(mentor.university || mentor.degree) && mentor.yearsAbroad > 0 && <span className="fm-info-dot" />}
                      {mentor.yearsAbroad > 0 && (
                        <span className="fm-info-tag">{mentor.yearsAbroad}yr{mentor.yearsAbroad !== 1 ? 's' : ''} abroad</span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="fm-rating-row">
                      <span className="fm-stars">{'★'.repeat(Math.min(5, Math.floor(mentor.rating)))}</span>
                      <span className="fm-rating-num">{mentor.rating > 0 ? mentor.rating.toFixed(1) : 'New'}</span>
                      {mentor.reviewCount > 0 && (
                        <span className="fm-reviews">({mentor.reviewCount} reviews)</span>
                      )}
                      {mentor.totalSessions > 0 && (
                        <>
                          <span className="fm-rating-dot" />
                          <span className="fm-sessions-count">{mentor.totalSessions} sessions</span>
                        </>
                      )}
                    </div>

                    {/* Services */}
                    {mentor.services.length > 0 && (
                      <div className="fm-services">
                        {mentor.services.slice(0, 4).map((service) => (
                          <span key={service} className="fm-service">{SERVICE_LABELS[service] ?? service}</span>
                        ))}
                        {mentor.services.length > 4 && (
                          <span className="fm-service">+{mentor.services.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="fm-card-footer">
                      <div className="fm-price-wrap">
                        <span className="fm-price">
                          {mentor.hourlyRate > 0 ? `$${mentor.hourlyRate}` : 'Free'}
                        </span>
                        <span className="fm-price-label">per session</span>
                        {mentor.introCallFree && (
                          <span className="fm-free-intro">Free intro call</span>
                        )}
                      </div>
                      <Link href={`/mentors/${mentor.id}`} className="fm-book-btn">
                        Book session →
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}
