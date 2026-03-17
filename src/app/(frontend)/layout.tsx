import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Connect with world-class mentors and unlock your full potential.',
  title: 'MentorSpace — Find Your Perfect Mentor',
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,800&family=Nunito:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    font-size: 16px;
    background: #0B0120;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }

  body {
    font-family: 'Nunito', sans-serif;
    background: #0B0120;
    color: #F0EEFF;
    line-height: 1;
    overflow-x: hidden;
  }

  main { min-height: 100vh; padding-top: 76px; }

  /* ═══════════════════════════════
     NAVBAR
  ═══════════════════════════════ */

  .ms-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    height: 76px;
    padding: 0 clamp(1.25rem, 5vw, 4rem);
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    background: rgba(11, 1, 32, 0.82);
    border-bottom: 1px solid rgba(108, 99, 255, 0.18);
    transition: border-color 0.3s, background 0.3s;
  }

  .ms-nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .ms-logo-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #FF4D6D, #6C63FF);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Exo 2', sans-serif;
    font-weight: 900;
    font-size: 1.1rem;
    color: white;
    box-shadow: 0 0 20px rgba(255, 77, 109, 0.4);
    flex-shrink: 0;
  }

  .ms-logo-text {
    font-family: 'Exo 2', sans-serif;
    font-weight: 800;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
    color: #fff;
  }

  .ms-logo-text span {
    background: linear-gradient(135deg, #FF4D6D, #6C63FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ms-nav-links {
    display: flex;
    gap: 2.2rem;
    list-style: none;
    align-items: center;
  }

  .ms-nav-links a {
    text-decoration: none;
    color: rgba(240, 238, 255, 0.58);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 0.88rem;
    letter-spacing: 0.03em;
    transition: color 0.22s, text-shadow 0.22s;
    position: relative;
  }

  .ms-nav-links a::after {
    content: '';
    position: absolute;
    bottom: -5px; left: 0; right: 100%;
    height: 2px;
    background: linear-gradient(90deg, #FF4D6D, #6C63FF);
    border-radius: 2px;
    transition: right 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ms-nav-links a:hover { color: #fff; text-shadow: 0 0 20px rgba(108, 99, 255, 0.6); }
  .ms-nav-links a:hover::after { right: 0; }

  .ms-nav-cta {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
  }

  .ms-btn-ghost {
    text-decoration: none;
    color: rgba(240, 238, 255, 0.75);
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 9px 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50px;
    transition: all 0.25s;
    white-space: nowrap;
  }

  .ms-btn-ghost:hover {
    border-color: rgba(108, 99, 255, 0.7);
    color: #a8a0ff;
    background: rgba(108, 99, 255, 0.1);
    box-shadow: 0 0 16px rgba(108, 99, 255, 0.2);
  }

  .ms-btn-pill {
    text-decoration: none;
    color: #fff;
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 9px 24px;
    background: linear-gradient(135deg, #FF4D6D 0%, #9B59B6 60%, #6C63FF 100%);
    border-radius: 50px;
    transition: all 0.28s;
    box-shadow: 0 4px 20px rgba(255, 77, 109, 0.35);
    letter-spacing: 0.01em;
    white-space: nowrap;
    border: 1px solid rgba(255, 77, 109, 0.3);
  }

  .ms-btn-pill:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(255, 77, 109, 0.55), 0 0 60px rgba(108, 99, 255, 0.2);
  }

  @media (max-width: 820px) { .ms-nav-links { display: none; } }
  @media (max-width: 480px) { .ms-btn-ghost { display: none; } }

  /* ═══════════════════════════════
     FOOTER
  ═══════════════════════════════ */

  .ms-footer {
    background: #060010;
    border-top: 1px solid rgba(108, 99, 255, 0.12);
    padding: 5rem clamp(1.25rem, 5vw, 6rem) 2.5rem;
    position: relative;
    overflow: hidden;
  }

  .ms-footer::before {
    content: '';
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 800px; height: 400px;
    background: radial-gradient(ellipse at 50% 0%, rgba(108, 99, 255, 0.08), transparent 70%);
    pointer-events: none;
  }

  .ms-footer-grid {
    max-width: 1240px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 2.2fr 1fr 1fr 1fr;
    gap: 3rem;
    position: relative;
  }

  .ms-footer-brand p {
    color: rgba(240, 238, 255, 0.42);
    font-family: 'Nunito', sans-serif;
    font-size: 0.9rem;
    line-height: 1.75;
    margin-top: 1rem;
    max-width: 290px;
  }

  .ms-footer-social {
    display: flex;
    gap: 10px;
    margin-top: 1.5rem;
  }

  .ms-social-link {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(240, 238, 255, 0.5);
    font-size: 0.9rem;
    text-decoration: none;
    transition: all 0.22s;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
  }

  .ms-social-link:hover {
    border-color: rgba(255, 77, 109, 0.5);
    color: #FF4D6D;
    background: rgba(255, 77, 109, 0.08);
    box-shadow: 0 0 12px rgba(255, 77, 109, 0.2);
  }

  .ms-footer-col h4 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(240, 238, 255, 0.35);
    margin-bottom: 1.25rem;
  }

  .ms-footer-col ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .ms-footer-col a {
    text-decoration: none;
    color: rgba(240, 238, 255, 0.55);
    font-family: 'Nunito', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.2s, padding-left 0.2s;
    display: inline-block;
  }

  .ms-footer-col a:hover { color: #00D9C5; padding-left: 4px; }

  .ms-footer-bottom {
    max-width: 1240px;
    margin: 3rem auto 0;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: rgba(240, 238, 255, 0.28);
    font-family: 'Nunito', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    position: relative;
  }

  .ms-footer-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    background: rgba(0, 217, 197, 0.08);
    border: 1px solid rgba(0, 217, 197, 0.2);
    border-radius: 100px;
    color: #00D9C5;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    font-family: 'JetBrains Mono', monospace;
  }

  @media (max-width: 900px) {
    .ms-footer-grid { grid-template-columns: 1fr 1fr; }
    .ms-footer-brand { grid-column: 1 / -1; }
  }

  @media (max-width: 520px) {
    .ms-footer-grid { grid-template-columns: 1fr; }
    .ms-footer-bottom { flex-direction: column; gap: 1rem; text-align: center; }
  }

  /* ═══════════════════════════════
     GLOBAL ANIMATIONS
  ═══════════════════════════════ */

  @keyframes ms-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }

  @keyframes ms-float-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(50px, 80px) scale(1.06); }
    66% { transform: translate(-40px, 30px) scale(0.94); }
  }

  @keyframes ms-float-2 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-70px, -50px) scale(1.08); }
  }

  @keyframes ms-float-3 {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(30px, -60px) rotate(8deg); }
  }

  @keyframes ms-reveal {
    from { opacity: 0; transform: translateY(32px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes ms-gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes ms-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }

  @keyframes ms-spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes ms-pulse-ring {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
`

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        {/* ─── NAVBAR ─── */}
        <nav className="ms-nav">
          <a href="/" className="ms-nav-logo">
            <div className="ms-logo-icon">M</div>
            <span className="ms-logo-text">
              Mentor<span>Space</span>
            </span>
          </a>

          <ul className="ms-nav-links">
            <li><a href="#">Find Mentors</a></li>
            <li><a href="#">How it Works</a></li>
            <li><a href="#">Success Stories</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Blog</a></li>
          </ul>

          <div className="ms-nav-cta">
            <a href="/login" className="ms-btn-ghost">Sign In</a>
            <a href="/signup" className="ms-btn-pill">Get Started Free</a>
          </div>
        </nav>

        {/* ─── CONTENT ─── */}
        <main>{children}</main>

        {/* ─── FOOTER ─── */}
        <footer className="ms-footer">
          <div className="ms-footer-grid">
            <div className="ms-footer-brand">
              <a href="/" className="ms-nav-logo" style={{ display: 'inline-flex' }}>
                <div className="ms-logo-icon" style={{ width: 34, height: 34, fontSize: '1rem' }}>M</div>
                <span className="ms-logo-text" style={{ fontSize: '1.1rem' }}>
                  Mentor<span>Space</span>
                </span>
              </a>
              <p>
                The world's leading mentorship platform. We connect ambitious learners
                with world-class mentors across every discipline.
              </p>
              <div className="ms-footer-social">
                {['Tw', 'Li', 'Gh', 'Yt'].map(s => (
                  <a key={s} href="#" className="ms-social-link">{s}</a>
                ))}
              </div>
            </div>

            <div className="ms-footer-col">
              <h4>Platform</h4>
              <ul>
                <li><a href="#">Find a Mentor</a></li>
                <li><a href="#">Become a Mentor</a></li>
                <li><a href="#">Group Sessions</a></li>
                <li><a href="#">Workshops</a></li>
                <li><a href="#">Pricing</a></li>
              </ul>
            </div>

            <div className="ms-footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Success Stories</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Newsletter</a></li>
                <li><a href="#">Help Center</a></li>
              </ul>
            </div>

            <div className="ms-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press Kit</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="ms-footer-bottom">
            <span>© 2026 MentorSpace Inc. All rights reserved.</span>
            <div className="ms-footer-badge">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D9C5', display: 'inline-block', animation: 'ms-blink 2s ease-in-out infinite' }} />
              All systems operational
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
