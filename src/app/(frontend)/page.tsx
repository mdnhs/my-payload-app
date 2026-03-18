import { getPayload } from 'payload'
import React from 'react'
import config from '@/payload.config'

const css = `
  /* ═══════════════════════════════
     LANDING — study abroad
  ═══════════════════════════════ */

  .lp-hero {
    min-height: calc(100vh - 68px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: clamp(4rem, 10vw, 7rem) clamp(1.25rem, 5vw, 5rem) 0;
    position: relative;
    overflow: hidden;
  }

  .lp-hero::before {
    content: '';
    position: absolute;
    width: 800px; height: 800px;
    top: -400px; left: 50%; transform: translateX(-50%);
    background: radial-gradient(circle, rgba(201,255,71,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .lp-hero-inner {
    max-width: 720px;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .lp-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border: 1px solid rgba(201,255,71,0.18);
    border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    color: #C9FF47;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 2.5rem;
    opacity: 0;
    animation: lp-up 0.6s ease-out 0.1s forwards;
  }

  .lp-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #C9FF47;
    box-shadow: 0 0 6px #C9FF47;
    animation: lp-blink 2s ease-in-out infinite;
  }

  .lp-h1 {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: clamp(2rem, 4.5vw, 3.5rem);
    line-height: 1;
    letter-spacing: -0.04em;
    color: #F5F5F5;
    margin: 0 0 1.5rem;
    opacity: 0;
    animation: lp-up 0.7s ease-out 0.15s forwards;
  }

  .lp-h1 em {
    font-style: italic;
    color: #C9FF47;
  }

  .lp-sub {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: clamp(1rem, 1.8vw, 1.15rem);
    font-weight: 400;
    color: rgba(245,245,245,0.45);
    line-height: 1.7;
    max-width: 480px;
    margin: 0 auto 3rem;
    opacity: 0;
    animation: lp-up 0.7s ease-out 0.25s forwards;
  }

  .lp-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    opacity: 0;
    animation: lp-up 0.7s ease-out 0.35s forwards;
  }

  .lp-btn-primary {
    display: inline-block;
    text-decoration: none;
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    color: #080808;
    background: #C9FF47;
    padding: 14px 36px;
    border-radius: 100px;
    border: none;
    transition: all 0.2s;
    box-shadow: 0 0 32px rgba(201,255,71,0.2);
  }

  .lp-btn-primary:hover {
    background: #D8FF60;
    transform: translateY(-2px);
    box-shadow: 0 0 48px rgba(201,255,71,0.35);
  }

  .lp-btn-ghost {
    display: inline-block;
    text-decoration: none;
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    color: rgba(245,245,245,0.6);
    background: transparent;
    padding: 14px 36px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.2s;
  }

  .lp-btn-ghost:hover {
    border-color: rgba(255,255,255,0.25);
    color: #F5F5F5;
    background: rgba(255,255,255,0.04);
  }

  /* ── divider ── */
  .lp-divider {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 clamp(1.25rem, 5vw, 5rem);
  }

  .lp-divider-line {
    height: 1px;
    background: rgba(255,255,255,0.06);
  }

  /* ═══════════════════════════════
     HOW IT WORKS
  ═══════════════════════════════ */

  .lp-how {
    padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 5rem);
    max-width: 1280px;
    margin: 0 auto;
  }

  .lp-section-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(245,245,245,0.3);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .lp-section-label::before {
    content: '';
    width: 20px; height: 1px;
    background: rgba(245,245,245,0.2);
  }

  .lp-section-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: clamp(2rem, 4.5vw, 3.2rem);
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: #F5F5F5;
    margin-bottom: clamp(3rem, 5vw, 4.5rem);
  }

  .lp-section-title em {
    font-style: italic;
    color: #C9FF47;
  }

  .lp-steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: rgba(255,255,255,0.06);
    border-radius: 20px;
    overflow: hidden;
  }

  .lp-step {
    background: #080808;
    padding: clamp(2rem, 3vw, 3rem);
    position: relative;
  }

  .lp-step-num {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    color: #C9FF47;
    margin-bottom: 1.75rem;
    display: block;
    opacity: 0.7;
  }

  .lp-step-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 700;
    font-size: 1.15rem;
    color: #F5F5F5;
    margin-bottom: 0.75rem;
    letter-spacing: -0.02em;
  }

  .lp-step-desc {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.88rem;
    color: rgba(245,245,245,0.4);
    line-height: 1.65;
    font-weight: 400;
  }

  /* ═══════════════════════════════
     BOTTOM CTA
  ═══════════════════════════════ */

  .lp-cta {
    padding: clamp(3rem, 6vw, 5rem) clamp(1.25rem, 5vw, 5rem) clamp(5rem, 8vw, 8rem);
    max-width: 1280px;
    margin: 0 auto;
  }

  .lp-cta-box {
    border: 1px solid rgba(201,255,71,0.1);
    border-radius: 24px;
    padding: clamp(3rem, 6vw, 5rem);
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .lp-cta-box::before {
    content: '';
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 600px; height: 300px;
    background: radial-gradient(ellipse, rgba(201,255,71,0.04) 0%, transparent 70%);
    pointer-events: none;
  }

  .lp-cta-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: clamp(2rem, 5vw, 3.5rem);
    color: #F5F5F5;
    letter-spacing: -0.04em;
    line-height: 0.95;
    margin-bottom: 1rem;
    position: relative;
    z-index: 1;
  }

  .lp-cta-title em {
    font-style: italic;
    color: #C9FF47;
  }

  .lp-cta-sub {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 1rem;
    color: rgba(245,245,245,0.4);
    margin-bottom: 2.5rem;
    position: relative;
    z-index: 1;
    font-weight: 400;
    line-height: 1.6;
  }

  .lp-cta-actions {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .lp-cta-note {
    margin-top: 1.25rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem;
    color: rgba(245,245,245,0.22);
    position: relative;
    z-index: 1;
    letter-spacing: 0.02em;
  }

  /* ═══════════════════════════════
     RESPONSIVE
  ═══════════════════════════════ */

  @media (max-width: 768px) {
    .lp-steps {
      grid-template-columns: 1fr;
    }
  }

  /* ═══════════════════════════════
     ANIMATIONS
  ═══════════════════════════════ */

  @keyframes lp-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes lp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }

  /* ═══════════════════════════════
     MARQUEE
  ═══════════════════════════════ */

  .lp-marquee-wrap {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    overflow: hidden;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 14px 0;
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .lp-marquee-track {
    display: inline-flex;
    width: max-content;
    animation: lp-marquee 30s linear infinite;
  }

  .lp-marquee-item {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0 2.5rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    color: rgba(245,245,245,0.35);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .lp-marquee-item::after {
    content: '·';
    color: rgba(245,245,245,0.15);
    font-size: 1.2rem;
  }

  .lp-marquee-accent {
    color: #C9FF47;
    font-weight: 600;
  }

  @keyframes lp-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
`

export default async function HomePage() {
  const payload = await getPayload({ config })

  const { totalDocs: mentorCount } = await payload.count({ collection: 'mentors' })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            {mentorCount > 0
              ? `${mentorCount} mentor${mentorCount !== 1 ? 's' : ''} across multiple countries`
              : 'Now open for mentors'}
          </div>

          <h1 className="lp-h1">
            Study abroad with<br />
            someone who&apos;s <em>been there.</em>
          </h1>

          <p className="lp-sub">
            Connect with mentors already living and studying in your dream country.
            Get real guidance on admissions, visas, scholarships, and life abroad.
          </p>

          <div className="lp-actions">
            <a href="/signup" className="lp-btn-primary">Get started free</a>
            <a href="/mentors" className="lp-btn-ghost">Browse mentors</a>
          </div>
        </div>

        {/* Marquee pinned to hero bottom */}
        <div className="lp-marquee-wrap">
          <div className="lp-marquee-track">
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="lp-marquee-item lp-marquee-accent">free intro call</span>
                <span className="lp-marquee-item">university admission help</span>
                <span className="lp-marquee-item lp-marquee-accent">visa guidance</span>
                <span className="lp-marquee-item">scholarship assistance</span>
                <span className="lp-marquee-item lp-marquee-accent">SOP & essay review</span>
                <span className="lp-marquee-item">mentors in 20+ countries</span>
                <span className="lp-marquee-item lp-marquee-accent">accommodation tips</span>
                <span className="lp-marquee-item">real student experiences</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="how-it-works">
        <span className="lp-section-label">How it works</span>
        <h2 className="lp-section-title">
          Three steps to<br />
          your <em>dream university</em>
        </h2>

        <div className="lp-steps">
          <div className="lp-step">
            <span className="lp-step-num">01</span>
            <h3 className="lp-step-title">Tell us your plans</h3>
            <p className="lp-step-desc">
              Sign up and share where you want to study — which country, degree, and field.
              We&apos;ll match you with the right mentors.
            </p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">02</span>
            <h3 className="lp-step-title">Book a free intro</h3>
            <p className="lp-step-desc">
              Browse mentors by country, university, and services.
              Schedule a free intro call to see if the fit is right.
            </p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">03</span>
            <h3 className="lp-step-title">Get guided abroad</h3>
            <p className="lp-step-desc">
              Work with your mentor on applications, SOPs, visa prep, and more.
              Get the insider knowledge that only comes from someone who&apos;s done it.
            </p>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="lp-divider"><div className="lp-divider-line" /></div>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-box">
          <h2 className="lp-cta-title">
            Ready to go <em>abroad?</em>
          </h2>
          <p className="lp-cta-sub">
            Create your free account and connect with a mentor who&apos;s already there.
          </p>
          <div className="lp-cta-actions">
            <a href="/signup" className="lp-btn-primary">Sign up free</a>
            <a href="/login" className="lp-btn-ghost">I have an account</a>
          </div>
          <p className="lp-cta-note">
            No credit card required · Free intro calls available
          </p>
        </div>
      </section>
    </>
  )
}
