import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookingForm from './BookingForm'

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
  postdoc: 'Postdoc', working: 'Professional', language: 'Language Course',
}

const COUNTRY_LABELS: Record<string, string> = {
  usa: 'USA', uk: 'United Kingdom', canada: 'Canada', australia: 'Australia',
  germany: 'Germany', france: 'France', netherlands: 'Netherlands', sweden: 'Sweden',
  japan: 'Japan', south_korea: 'South Korea', ireland: 'Ireland', new_zealand: 'New Zealand',
  singapore: 'Singapore', malaysia: 'Malaysia', italy: 'Italy', spain: 'Spain',
  switzerland: 'Switzerland', finland: 'Finland', denmark: 'Denmark', norway: 'Norway',
  other: 'Other',
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const css = `
  .mp-page {
    min-height: calc(100vh - 68px);
    position: relative;
  }

  .mp-page::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 40% at 20% 0%, rgba(201,255,71,0.06) 0%, transparent 55%),
      radial-gradient(ellipse 40% 35% at 80% 70%, rgba(59,130,246,0.04) 0%, transparent 50%);
    z-index: 0;
  }

  .mp-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(245,245,245,0.4);
    transition: color 0.18s;
    margin-bottom: 2rem;
  }

  .mp-back:hover { color: #C9FF47; }

  .mp-container {
    position: relative; z-index: 1;
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem clamp(1.25rem, 5vw, 4rem) 4rem;
  }

  .mp-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2.5rem;
    align-items: start;
  }

  /* ── Profile Column ── */
  .mp-hero {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .mp-avatar {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: linear-gradient(135deg, #C9FF47, #8BD924);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-syne), sans-serif;
    font-weight: 800; font-size: 1.6rem;
    color: #080808;
    flex-shrink: 0;
    position: relative;
  }

  .mp-avatar-ring {
    position: absolute; inset: -4px;
    border-radius: 50%;
    border: 2px solid rgba(201,255,71,0.25);
  }

  .mp-verified {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: #C9FF47;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.6rem;
    color: #080808;
    border: 2px solid #080808;
  }

  .mp-hero-info { flex: 1; min-width: 0; }

  .mp-name {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: 1.75rem;
    color: #F5F5F5;
    line-height: 1.15;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
  }

  .mp-headline {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.92rem;
    color: rgba(245,245,245,0.55);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .mp-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .mp-badge {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 12px;
    border-radius: 100px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(245,245,245,0.5);
  }

  .mp-badge.accent {
    background: rgba(201,255,71,0.08);
    border-color: rgba(201,255,71,0.2);
    color: #C9FF47;
  }

  /* ── Stats Row ── */
  .mp-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .mp-stat {
    background: rgba(255,255,255,0.025);
    padding: 16px 14px;
    text-align: center;
  }

  .mp-stat-val {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: 1.4rem;
    color: #F5F5F5;
    line-height: 1;
    margin-bottom: 4px;
  }

  .mp-stat-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(245,245,245,0.3);
  }

  /* ── Section Cards ── */
  .mp-section {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    padding: 24px;
    margin-bottom: 16px;
  }

  .mp-section-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: rgba(245,245,245,0.45);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .mp-bio {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.92rem;
    line-height: 1.75;
    color: rgba(245,245,245,0.65);
  }

  .mp-services-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mp-service-tag {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 100px;
    background: rgba(201,255,71,0.06);
    border: 1px solid rgba(201,255,71,0.15);
    color: rgba(201,255,71,0.8);
  }

  .mp-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .mp-detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mp-detail-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(245,245,245,0.28);
  }

  .mp-detail-value {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(245,245,245,0.7);
  }

  /* ── Social Links ── */
  .mp-social-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mp-social-link {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    color: rgba(245,245,245,0.55);
    text-decoration: none;
    transition: all 0.18s;
  }

  .mp-social-link:hover {
    border-color: rgba(201,255,71,0.3);
    color: #C9FF47;
  }

  /* ── Responsive ── */
  @media (max-width: 840px) {
    .mp-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .mp-hero { flex-direction: column; align-items: center; text-align: center; }
    .mp-badges { justify-content: center; }
    .mp-stats { grid-template-columns: repeat(2, 1fr); }
    .mp-detail-grid { grid-template-columns: 1fr; }
  }
`

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await getPayload({ config })

  let mentor
  try {
    mentor = await payload.findByID({
      collection: 'mentors',
      id,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  if (!mentor) notFound()

  const userName = typeof mentor.user === 'object' && mentor.user
    ? (mentor.user as { name?: string }).name || 'Mentor'
    : 'Mentor'
  const initials = getInitials(userName)
  const country = COUNTRY_LABELS[(mentor.country as string) || ''] || (mentor.country as string) || ''
  const degree = DEGREE_LABELS[(mentor.degree as string) || ''] || (mentor.degree as string) || ''
  const services = (mentor.services as string[]) || []
  const hourlyRate = (mentor.hourlyRate as number) || 0
  const rating = (mentor.rating as number) || 0
  const reviewCount = (mentor.reviewCount as number) || 0
  const totalSessions = (mentor.totalSessions as number) || 0
  const yearsAbroad = (mentor.yearsAbroad as number) || 0
  const isVerified = mentor.isVerified as boolean
  const introCallFree = mentor.introCallFree as boolean
  const sessionDurations = (mentor.sessionDurations as string[]) || ['30', '60']
  const availableDays = (mentor.availableDays as string[]) || []

  const dayLabels: Record<string, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
  }

  const socials = [
    mentor.linkedin && { label: 'LinkedIn', url: mentor.linkedin as string },
    mentor.youtube && { label: 'YouTube', url: mentor.youtube as string },
    mentor.instagram && { label: 'Instagram', url: mentor.instagram as string },
    mentor.website && { label: 'Website', url: mentor.website as string },
  ].filter(Boolean) as { label: string; url: string }[]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="mp-page">
        <div className="mp-container">
          <Link href="/mentors" className="mp-back">
            ← Back to mentors
          </Link>

          <div className="mp-grid">
            {/* ── LEFT: Profile ── */}
            <div>
              <div className="mp-hero">
                <div className="mp-avatar">
                  <div className="mp-avatar-ring" />
                  {initials}
                  {isVerified && <div className="mp-verified">✓</div>}
                </div>
                <div className="mp-hero-info">
                  <h1 className="mp-name">{userName}</h1>
                  <p className="mp-headline">{mentor.headline as string}</p>
                  <div className="mp-badges">
                    <span className="mp-badge accent">{country}</span>
                    {degree && <span className="mp-badge">{degree}</span>}
                    {introCallFree && <span className="mp-badge">Free Intro Call</span>}
                    {hourlyRate > 0 ? (
                      <span className="mp-badge accent">${hourlyRate}/hr</span>
                    ) : (
                      <span className="mp-badge accent">Free</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mp-stats">
                <div className="mp-stat">
                  <div className="mp-stat-val">{rating > 0 ? rating.toFixed(1) : '—'}</div>
                  <div className="mp-stat-label">Rating</div>
                </div>
                <div className="mp-stat">
                  <div className="mp-stat-val">{reviewCount}</div>
                  <div className="mp-stat-label">Reviews</div>
                </div>
                <div className="mp-stat">
                  <div className="mp-stat-val">{totalSessions}</div>
                  <div className="mp-stat-label">Sessions</div>
                </div>
                <div className="mp-stat">
                  <div className="mp-stat-val">{yearsAbroad > 0 ? `${yearsAbroad}y` : '—'}</div>
                  <div className="mp-stat-label">Abroad</div>
                </div>
              </div>

              {/* Bio */}
              {mentor.bio && (
                <div className="mp-section">
                  <h3 className="mp-section-title">About</h3>
                  <p className="mp-bio">{mentor.bio as string}</p>
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <div className="mp-section">
                  <h3 className="mp-section-title">Services</h3>
                  <div className="mp-services-grid">
                    {services.map((s) => (
                      <span key={s} className="mp-service-tag">
                        {SERVICE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="mp-section">
                <h3 className="mp-section-title">Details</h3>
                <div className="mp-detail-grid">
                  {mentor.university && (
                    <div className="mp-detail-item">
                      <span className="mp-detail-label">University</span>
                      <span className="mp-detail-value">{mentor.university as string}</span>
                    </div>
                  )}
                  {mentor.fieldOfStudy && (
                    <div className="mp-detail-item">
                      <span className="mp-detail-label">Field of Study</span>
                      <span className="mp-detail-value">{mentor.fieldOfStudy as string}</span>
                    </div>
                  )}
                  {mentor.city && (
                    <div className="mp-detail-item">
                      <span className="mp-detail-label">City</span>
                      <span className="mp-detail-value">{mentor.city as string}</span>
                    </div>
                  )}
                  {mentor.timezone && (
                    <div className="mp-detail-item">
                      <span className="mp-detail-label">Timezone</span>
                      <span className="mp-detail-value">{mentor.timezone as string}</span>
                    </div>
                  )}
                  {availableDays.length > 0 && (
                    <div className="mp-detail-item">
                      <span className="mp-detail-label">Available Days</span>
                      <span className="mp-detail-value">
                        {availableDays.map((d) => dayLabels[d] || d).join(', ')}
                      </span>
                    </div>
                  )}
                  {sessionDurations.length > 0 && (
                    <div className="mp-detail-item">
                      <span className="mp-detail-label">Session Lengths</span>
                      <span className="mp-detail-value">
                        {sessionDurations.map((d) => `${d} min`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {socials.length > 0 && (
                <div className="mp-section">
                  <h3 className="mp-section-title">Connect</h3>
                  <div className="mp-social-row">
                    {socials.map(({ label, url }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mp-social-link"
                      >
                        {label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Booking Form ── */}
            <BookingForm
              mentorId={id}
              mentorName={userName}
              hourlyRate={hourlyRate}
              sessionDurations={sessionDurations}
              introCallFree={introCallFree}
            />
          </div>
        </div>
      </div>
    </>
  )
}
