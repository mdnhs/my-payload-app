import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { auth } from '@/lib/auth'
import NavUser from '@/components/NavUser'
import './styles.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata = {
  description: 'Connect with world-class mentors and unlock your full potential.',
  title: 'MentorSpace — Find Your Perfect Mentor',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  const user = session?.user as
    | { name: string; email: string; role?: string }
    | null
    | undefined

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <head />
      <body>
        <NuqsAdapter>
        {/* ─── NAVBAR ─── */}
        <nav className="ms-nav">
          <div className="ms-nav-inner">
            <a href="/" className="ms-nav-logo">
              <div className="ms-logo-icon">M</div>
              <span className="ms-logo-text">
                Mentor<span>Space</span>
              </span>
            </a>

            <ul className="ms-nav-links">
              <li><a href="/mentors">Find Mentors</a></li>
              <li><a href="#">How it Works</a></li>
              <li><a href="#">Success Stories</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Blog</a></li>
            </ul>

            <div className="ms-nav-cta">
              {user ? (
                <NavUser
                  name={user.name}
                  email={user.email}
                  role={user.role ?? 'mentee'}
                />
              ) : (
                <>
                  <a href="/login" className="ms-btn-ghost">Sign In</a>
                  <a href="/signup" className="ms-btn-pill">Get Started Free</a>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ─── CONTENT ─── */}
        <main>{children}</main>

        {/* ─── FOOTER ─── */}
        <footer className="ms-footer">
          <div className="ms-footer-grid">
            <div className="ms-footer-brand">
              <a href="/" className="ms-nav-logo" style={{ display: 'inline-flex' }}>
                <div className="ms-logo-icon" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>M</div>
                <span className="ms-logo-text" style={{ fontSize: '1rem' }}>
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
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9FF47', display: 'inline-block', animation: 'ms-blink 2s ease-in-out infinite' }} />
              All systems operational
            </div>
          </div>
        </footer>
        </NuqsAdapter>
      </body>
    </html>
  )
}
