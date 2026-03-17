import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

const pageStyles = `
  /* ═══════════════════════════════
     HERO
  ═══════════════════════════════ */

  .ms-hero {
    min-height: calc(100vh - 76px);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 4rem);
    overflow: hidden;
  }

  .ms-hero-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 120% 80% at 50% -10%, rgba(108, 99, 255, 0.22) 0%, transparent 60%),
                radial-gradient(ellipse 80% 60% at 0% 80%, rgba(255, 77, 109, 0.14) 0%, transparent 50%),
                radial-gradient(ellipse 60% 60% at 100% 20%, rgba(0, 217, 197, 0.1) 0%, transparent 50%),
                #0B0120;
  }

  .ms-grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(108, 99, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(108, 99, 255, 0.06) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(ellipse 90% 90% at 50% 40%, black 20%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 90% 90% at 50% 40%, black 20%, transparent 100%);
  }

  .ms-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
  }

  .ms-orb-1 {
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(108, 99, 255, 0.35), transparent 70%);
    top: -280px; left: -180px;
    animation: ms-float-1 14s ease-in-out infinite;
  }

  .ms-orb-2 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255, 77, 109, 0.3), transparent 70%);
    bottom: -200px; right: -160px;
    animation: ms-float-2 17s ease-in-out infinite;
  }

  .ms-orb-3 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(0, 217, 197, 0.2), transparent 70%);
    top: 30%; left: 65%;
    animation: ms-float-3 20s ease-in-out infinite;
  }

  /* Decorative ring */
  .ms-hero-ring {
    position: absolute;
    width: 680px; height: 680px;
    border-radius: 50%;
    border: 1px solid rgba(108, 99, 255, 0.12);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .ms-hero-ring::before {
    content: '';
    position: absolute;
    inset: 60px;
    border-radius: 50%;
    border: 1px dashed rgba(255, 77, 109, 0.1);
  }

  .ms-hero-ring::after {
    content: '';
    position: absolute;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #FF4D6D;
    box-shadow: 0 0 12px #FF4D6D, 0 0 30px rgba(255, 77, 109, 0.5);
    top: 12%; left: 50%;
    animation: ms-spin-slow 20s linear infinite;
    transform-origin: -340px 0;
  }

  /* Hero content */
  .ms-hero-content {
    position: relative;
    z-index: 10;
    text-align: center;
    max-width: 880px;
    width: 100%;
  }

  .ms-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 20px;
    background: rgba(108, 99, 255, 0.12);
    border: 1px solid rgba(108, 99, 255, 0.3);
    border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: #a8a0ff;
    margin-bottom: 2.2rem;
    animation: ms-reveal 0.9s ease-out 0.1s both;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    position: relative;
    overflow: hidden;
  }

  .ms-hero-badge::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(168, 160, 255, 0.15), transparent);
    animation: ms-shimmer 3.5s ease-in-out infinite;
  }

  .ms-badge-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #6C63FF;
    box-shadow: 0 0 8px #6C63FF, 0 0 20px rgba(108, 99, 255, 0.5);
    animation: ms-blink 1.8s ease-in-out infinite;
    flex-shrink: 0;
    position: relative;
  }

  .ms-badge-dot::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid rgba(108, 99, 255, 0.4);
    animation: ms-pulse-ring 2s ease-out infinite;
  }

  .ms-hero-eyebrow {
    font-family: 'Exo 2', sans-serif;
    font-weight: 300;
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    color: rgba(240, 238, 255, 0.5);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.75rem;
    animation: ms-reveal 0.9s ease-out 0.2s both;
  }

  .ms-hero-title {
    font-family: 'Exo 2', sans-serif;
    font-weight: 900;
    font-size: clamp(3.2rem, 9vw, 7.5rem);
    line-height: 0.95;
    letter-spacing: -0.04em;
    color: #fff;
    margin: 0 0 1.5rem;
    animation: ms-reveal 0.9s ease-out 0.25s both;
  }

  .ms-title-gradient {
    background: linear-gradient(135deg, #FF4D6D 0%, #9B59B6 45%, #6C63FF 80%, #00D9C5 100%);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ms-gradient 7s ease infinite;
    display: block;
    font-style: italic;
  }

  .ms-hero-sub {
    font-family: 'Nunito', sans-serif;
    font-weight: 400;
    font-size: clamp(1rem, 2vw, 1.22rem);
    color: rgba(240, 238, 255, 0.55);
    max-width: 580px;
    margin: 0 auto 2.8rem;
    line-height: 1.75;
    animation: ms-reveal 0.9s ease-out 0.35s both;
  }

  .ms-hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    animation: ms-reveal 0.9s ease-out 0.45s both;
  }

  .ms-btn-cta {
    text-decoration: none;
    color: #fff;
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 1rem;
    padding: 15px 38px;
    background: linear-gradient(135deg, #FF4D6D 0%, #9B59B6 50%, #6C63FF 100%);
    background-size: 200% 200%;
    border-radius: 50px;
    transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 36px rgba(255, 77, 109, 0.45), 0 8px 24px rgba(0,0,0,0.35);
    border: 1px solid rgba(255, 77, 109, 0.4);
    letter-spacing: 0.01em;
    animation: ms-gradient 6s ease infinite;
    position: relative;
    overflow: hidden;
  }

  .ms-btn-cta::after {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
    transition: left 0.4s;
  }

  .ms-btn-cta:hover { transform: translateY(-3px); box-shadow: 0 0 60px rgba(255, 77, 109, 0.65), 0 16px 40px rgba(0,0,0,0.45); }
  .ms-btn-cta:hover::after { left: 150%; }

  .ms-btn-secondary {
    text-decoration: none;
    color: rgba(240, 238, 255, 0.85);
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    padding: 15px 38px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 50px;
    transition: all 0.28s;
    border: 1px solid rgba(255, 255, 255, 0.14);
    letter-spacing: 0.01em;
  }

  .ms-btn-secondary:hover {
    border-color: rgba(0, 217, 197, 0.5);
    color: #00D9C5;
    background: rgba(0, 217, 197, 0.06);
    box-shadow: 0 0 24px rgba(0, 217, 197, 0.2);
    transform: translateY(-2px);
  }

  /* Hero trust bar */
  .ms-hero-trust {
    margin-top: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    animation: ms-reveal 0.9s ease-out 0.55s both;
  }

  .ms-trust-avatars {
    display: flex;
  }

  .ms-trust-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 2px solid #0B0120;
    margin-left: -10px;
    background: linear-gradient(135deg, var(--c1), var(--c2));
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Exo 2', sans-serif;
    font-weight: 800;
    font-size: 0.65rem;
    color: white;
    flex-shrink: 0;
  }

  .ms-trust-avatar:first-child { margin-left: 0; }

  .ms-trust-text {
    font-family: 'Nunito', sans-serif;
    font-size: 0.85rem;
    color: rgba(240, 238, 255, 0.45);
    font-weight: 500;
  }

  .ms-trust-text strong {
    color: rgba(240, 238, 255, 0.8);
    font-weight: 700;
  }

  .ms-trust-divider {
    width: 1px; height: 28px;
    background: rgba(255, 255, 255, 0.1);
  }

  .ms-trust-rating {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ms-stars {
    color: #FFD166;
    font-size: 0.85rem;
    letter-spacing: 1px;
  }

  /* ═══════════════════════════════
     STATS
  ═══════════════════════════════ */

  .ms-stats {
    padding: 0 clamp(1.25rem, 5vw, 6rem);
    position: relative;
  }

  .ms-stats-inner {
    max-width: 1240px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(108, 99, 255, 0.15);
    border-radius: 24px;
    padding: 3rem 4rem;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    position: relative;
    overflow: hidden;
    transform: translateY(-50%);
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .ms-stats-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 100% at 50% 0%, rgba(108, 99, 255, 0.08), transparent);
    pointer-events: none;
  }

  .ms-stat {
    text-align: center;
    position: relative;
  }

  .ms-stat + .ms-stat::before {
    content: '';
    position: absolute;
    left: 0; top: 10%; bottom: 10%;
    width: 1px;
    background: rgba(255, 255, 255, 0.07);
  }

  .ms-stat-num {
    display: block;
    font-family: 'Exo 2', sans-serif;
    font-weight: 900;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1;
    background: linear-gradient(135deg, #FF4D6D, #6C63FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.4rem;
  }

  .ms-stat-label {
    font-family: 'Nunito', sans-serif;
    color: rgba(240, 238, 255, 0.4);
    font-size: 0.82rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 600;
  }

  /* ═══════════════════════════════
     HOW IT WORKS
  ═══════════════════════════════ */

  .ms-section {
    padding: 5rem clamp(1.25rem, 5vw, 6rem);
    max-width: 1240px;
    margin: 0 auto;
  }

  .ms-section-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: #00D9C5;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .ms-section-tag::before {
    content: '//';
    opacity: 0.5;
  }

  .ms-section-title {
    font-family: 'Exo 2', sans-serif;
    font-weight: 800;
    font-size: clamp(2.2rem, 4.5vw, 3.8rem);
    line-height: 1.05;
    letter-spacing: -0.035em;
    color: #fff;
    margin-bottom: 1.2rem;
  }

  .ms-section-sub {
    font-family: 'Nunito', sans-serif;
    color: rgba(240, 238, 255, 0.5);
    font-size: 1.05rem;
    line-height: 1.75;
    max-width: 520px;
    margin-bottom: 4rem;
    font-weight: 400;
  }

  /* Steps */
  .ms-steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    position: relative;
  }

  .ms-steps::before {
    content: '';
    position: absolute;
    top: 42px; left: calc(16.6% + 1rem); right: calc(16.6% + 1rem);
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 77, 109, 0.5), rgba(108, 99, 255, 0.5), rgba(0, 217, 197, 0.5));
  }

  .ms-step {
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 20px;
    padding: 2.2rem;
    position: relative;
    transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .ms-step::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 77, 109, 0.06), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .ms-step:nth-child(2)::before { background: linear-gradient(135deg, rgba(108, 99, 255, 0.08), transparent); }
  .ms-step:nth-child(3)::before { background: linear-gradient(135deg, rgba(0, 217, 197, 0.08), transparent); }

  .ms-step:hover { transform: translateY(-6px); border-color: rgba(255, 77, 109, 0.3); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(255, 77, 109, 0.1); }
  .ms-step:nth-child(2):hover { border-color: rgba(108, 99, 255, 0.4); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(108, 99, 255, 0.15); }
  .ms-step:nth-child(3):hover { border-color: rgba(0, 217, 197, 0.4); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(0, 217, 197, 0.15); }
  .ms-step:hover::before { opacity: 1; }

  .ms-step-num {
    width: 56px; height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Exo 2', sans-serif;
    font-weight: 900;
    font-size: 1.3rem;
    color: #fff;
    margin-bottom: 1.75rem;
    position: relative;
    flex-shrink: 0;
    z-index: 1;
  }

  .ms-step-num-1 { background: linear-gradient(135deg, #FF4D6D, #e91e63); box-shadow: 0 8px 24px rgba(255, 77, 109, 0.4); }
  .ms-step-num-2 { background: linear-gradient(135deg, #6C63FF, #4e44cc); box-shadow: 0 8px 24px rgba(108, 99, 255, 0.4); }
  .ms-step-num-3 { background: linear-gradient(135deg, #00D9C5, #00897b); box-shadow: 0 8px 24px rgba(0, 217, 197, 0.35); }

  .ms-step-title {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1.2rem;
    color: #fff;
    margin-bottom: 0.75rem;
    letter-spacing: -0.01em;
    position: relative;
    z-index: 1;
  }

  .ms-step-desc {
    font-family: 'Nunito', sans-serif;
    color: rgba(240, 238, 255, 0.48);
    font-size: 0.92rem;
    line-height: 1.65;
    position: relative;
    z-index: 1;
  }

  /* ═══════════════════════════════
     MENTOR CATEGORIES
  ═══════════════════════════════ */

  .ms-cats-section {
    padding: 3rem clamp(1.25rem, 5vw, 6rem) 6rem;
    background: rgba(0, 0, 10, 0.5);
    position: relative;
    overflow: hidden;
  }

  .ms-cats-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 50% 80% at 0% 50%, rgba(255, 77, 109, 0.06), transparent),
      radial-gradient(ellipse 50% 80% at 100% 50%, rgba(0, 217, 197, 0.06), transparent);
    pointer-events: none;
  }

  .ms-cats-inner {
    max-width: 1240px;
    margin: 0 auto;
    position: relative;
  }

  .ms-cats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
  }

  .ms-cat-card {
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 18px;
    padding: 1.75rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    display: block;
    position: relative;
    overflow: hidden;
    group: true;
  }

  .ms-cat-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--cat-c1), var(--cat-c2));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ms-cat-card:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 255, 255, 0.16);
    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
  }

  .ms-cat-card:hover::after { transform: scaleX(1); }

  .ms-cat-emoji {
    font-size: 2.2rem;
    margin-bottom: 1rem;
    display: block;
    line-height: 1;
  }

  .ms-cat-name {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #fff;
    margin-bottom: 0.35rem;
    letter-spacing: -0.01em;
  }

  .ms-cat-count {
    font-family: 'Nunito', sans-serif;
    color: rgba(240, 238, 255, 0.4);
    font-size: 0.8rem;
    font-weight: 500;
  }

  /* ═══════════════════════════════
     TESTIMONIALS
  ═══════════════════════════════ */

  .ms-testimonials {
    padding: 6rem clamp(1.25rem, 5vw, 6rem);
    position: relative;
  }

  .ms-testimonials-inner {
    max-width: 1240px;
    margin: 0 auto;
  }

  .ms-testi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .ms-testi-card {
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 20px;
    padding: 2rem;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .ms-testi-card:first-child {
    border-color: rgba(255, 77, 109, 0.2);
    background: rgba(255, 77, 109, 0.04);
  }

  .ms-testi-card::before {
    content: '"';
    position: absolute;
    top: -10px; right: 1.5rem;
    font-family: 'Exo 2', sans-serif;
    font-size: 8rem;
    font-weight: 900;
    color: rgba(108, 99, 255, 0.08);
    line-height: 1;
    pointer-events: none;
  }

  .ms-testi-stars {
    color: #FFD166;
    font-size: 0.85rem;
    letter-spacing: 2px;
    margin-bottom: 1rem;
  }

  .ms-testi-quote {
    font-family: 'Nunito', sans-serif;
    color: rgba(240, 238, 255, 0.7);
    font-size: 0.95rem;
    line-height: 1.7;
    font-weight: 400;
    margin-bottom: 1.5rem;
    font-style: italic;
  }

  .ms-testi-author {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ms-testi-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Exo 2', sans-serif;
    font-weight: 800;
    font-size: 0.85rem;
    color: white;
    flex-shrink: 0;
  }

  .ms-testi-name {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    color: #fff;
    margin-bottom: 2px;
  }

  .ms-testi-role {
    font-family: 'Nunito', sans-serif;
    color: rgba(240, 238, 255, 0.4);
    font-size: 0.78rem;
    font-weight: 500;
  }

  /* ═══════════════════════════════
     CTA SECTION
  ═══════════════════════════════ */

  .ms-cta-section {
    padding: 2rem clamp(1.25rem, 5vw, 6rem) 6rem;
    position: relative;
  }

  .ms-cta-box {
    max-width: 1240px;
    margin: 0 auto;
    background: linear-gradient(135deg, rgba(108, 99, 255, 0.18), rgba(255, 77, 109, 0.15));
    border: 1px solid rgba(108, 99, 255, 0.3);
    border-radius: 28px;
    padding: clamp(3rem, 6vw, 5.5rem) clamp(2rem, 6vw, 5rem);
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .ms-cta-box::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 100% at 30% 0%, rgba(108, 99, 255, 0.2), transparent 60%),
      radial-gradient(ellipse 70% 100% at 70% 100%, rgba(255, 77, 109, 0.2), transparent 60%);
    pointer-events: none;
  }

  .ms-cta-box::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 27px;
    background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent);
    pointer-events: none;
  }

  .ms-cta-title {
    font-family: 'Exo 2', sans-serif;
    font-weight: 900;
    font-size: clamp(2.4rem, 5vw, 5rem);
    color: #fff;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 1.25rem;
    position: relative;
    z-index: 1;
  }

  .ms-cta-sub {
    font-family: 'Nunito', sans-serif;
    color: rgba(240, 238, 255, 0.55);
    font-size: 1.1rem;
    margin-bottom: 2.75rem;
    position: relative;
    z-index: 1;
    font-weight: 400;
  }

  .ms-cta-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }

  .ms-cta-note {
    margin-top: 1.25rem;
    font-family: 'Nunito', sans-serif;
    font-size: 0.82rem;
    color: rgba(240, 238, 255, 0.3);
    position: relative;
    z-index: 1;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  /* ═══════════════════════════════
     RESPONSIVE
  ═══════════════════════════════ */

  @media (max-width: 960px) {
    .ms-stats-inner { grid-template-columns: repeat(2, 1fr); transform: none; margin-top: 2rem; }
    .ms-stats { margin-top: 0; }
    .ms-steps { grid-template-columns: 1fr; }
    .ms-steps::before { display: none; }
    .ms-cats-grid { grid-template-columns: repeat(2, 1fr); }
    .ms-testi-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    .ms-stats-inner { grid-template-columns: repeat(2, 1fr); padding: 2rem; }
    .ms-cats-grid { grid-template-columns: 1fr 1fr; }
    .ms-stat + .ms-stat::before { display: none; }
    .ms-hero-ring { display: none; }
  }
`

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const userEmail = user && 'email' in user ? (user as { email: string }).email : null

  const categories = [
    { emoji: '💻', name: 'Software Engineering', count: '2,400+ mentors', c1: '#6C63FF', c2: '#4e44cc' },
    { emoji: '🎨', name: 'Product Design', count: '1,800+ mentors', c1: '#FF4D6D', c2: '#e91e63' },
    { emoji: '📈', name: 'Growth & Marketing', count: '1,200+ mentors', c1: '#FFD166', c2: '#f59e0b' },
    { emoji: '🚀', name: 'Startups & VC', count: '900+ mentors', c1: '#00D9C5', c2: '#00897b' },
    { emoji: '🤖', name: 'AI & Machine Learning', count: '1,100+ mentors', c1: '#a855f7', c2: '#7c3aed' },
    { emoji: '📊', name: 'Data Science', count: '850+ mentors', c1: '#3b82f6', c2: '#1d4ed8' },
    { emoji: '🏦', name: 'Finance & Investing', count: '760+ mentors', c1: '#10b981', c2: '#059669' },
    { emoji: '✍️', name: 'Content & Writing', count: '640+ mentors', c1: '#f97316', c2: '#ea580c' },
  ]

  const testimonials = [
    {
      quote: "Within 3 months of working with my mentor, I landed a senior role at a FAANG company. The personalized guidance was worth every penny.",
      name: 'Priya Sharma',
      role: 'Senior Engineer at Google',
      initials: 'PS',
      colors: ['#FF4D6D', '#e91e63'],
      stars: 5,
    },
    {
      quote: "My mentor helped me go from 0 to $1M ARR in 18 months. The accountability and real-world experience they brought was invaluable.",
      name: 'Marcus Wei',
      role: 'Founder, DataFlow AI',
      initials: 'MW',
      colors: ['#6C63FF', '#4e44cc'],
      stars: 5,
    },
    {
      quote: "I transitioned from finance to product design in 6 months. MentorSpace made the impossible feel completely achievable.",
      name: 'Sofia Rodriguez',
      role: 'Product Designer at Figma',
      initials: 'SR',
      colors: ['#00D9C5', '#00897b'],
      stars: 5,
    },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      {/* ─── HERO ─── */}
      <section className="ms-hero">
        <div className="ms-hero-bg">
          <div className="ms-grid-overlay" />
          <div className="ms-orb ms-orb-1" />
          <div className="ms-orb ms-orb-2" />
          <div className="ms-orb ms-orb-3" />
          <div className="ms-hero-ring" />
        </div>

        <div className="ms-hero-content">
          <div className="ms-hero-badge">
            <span className="ms-badge-dot" />
            {userEmail
              ? `Welcome back, ${userEmail.split('@')[0]}`
              : '12,000+ success stories · Join today'}
          </div>

          <span className="ms-hero-eyebrow">The World's #1 Mentorship Platform</span>

          <h1 className="ms-hero-title">
            Find Your Perfect<br />
            <span className="ms-title-gradient">Mentor</span>
          </h1>

          <p className="ms-hero-sub">
            Connect 1:1 with world-class experts in tech, design, business & more.
            Accelerate your career with personalized guidance that actually moves the needle.
          </p>

          <div className="ms-hero-actions">
            <a href="/signup" className="ms-btn-cta">
              Find My Mentor →
            </a>
            <a href="#how-it-works" className="ms-btn-secondary">
              See How It Works
            </a>
          </div>

          <div className="ms-hero-trust">
            <div className="ms-trust-avatars">
              {[
                { i: 'KL', c1: '#FF4D6D', c2: '#9B59B6' },
                { i: 'JM', c1: '#6C63FF', c2: '#00D9C5' },
                { i: 'AR', c1: '#FFD166', c2: '#f97316' },
                { i: 'TN', c1: '#00D9C5', c2: '#6C63FF' },
                { i: '+', c1: '#1a1a3e', c2: '#2a2a5e' },
              ].map((av, i) => (
                <div
                  key={i}
                  className="ms-trust-avatar"
                  style={{ '--c1': av.c1, '--c2': av.c2 } as React.CSSProperties}
                >
                  {av.i}
                </div>
              ))}
            </div>
            <span className="ms-trust-text">
              Trusted by <strong>50,000+</strong> learners worldwide
            </span>
            <div className="ms-trust-divider" />
            <div className="ms-trust-rating">
              <span className="ms-stars">★★★★★</span>
              <span className="ms-trust-text"><strong>4.9</strong> / 5.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div className="ms-stats">
        <div className="ms-stats-inner">
          {[
            { num: '50K+', label: 'Active Learners' },
            { num: '8K+', label: 'Expert Mentors' },
            { num: '200+', label: 'Disciplines' },
            { num: '4.9★', label: 'Average Rating' },
          ].map(s => (
            <div key={s.label} className="ms-stat">
              <span className="ms-stat-num">{s.num}</span>
              <span className="ms-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ paddingTop: '3rem' }}>
        <div className="ms-section">
          <p className="ms-section-tag">How It Works</p>
          <h2 className="ms-section-title">
            Three steps to<br />your breakthrough
          </h2>
          <p className="ms-section-sub">
            We've stripped away everything complicated. From signup to first session
            in under 10 minutes.
          </p>

          <div className="ms-steps">
            {[
              {
                n: '01',
                cls: 'ms-step-num-1',
                title: 'Describe Your Goals',
                desc: 'Tell us where you want to go. Career pivot, skill upgrade, startup launch — our AI matches you with the ideal mentor for your specific ambitions.',
              },
              {
                n: '02',
                cls: 'ms-step-num-2',
                title: 'Meet Your Match',
                desc: "Browse curated mentor profiles, read reviews from real mentees, and book a free intro call. No commitment until you're ready.",
              },
              {
                n: '03',
                cls: 'ms-step-num-3',
                title: 'Grow, Fast',
                desc: 'Regular 1:1 sessions, async feedback, resources and accountability. Watch your skills and career trajectory transform.',
              },
            ].map(step => (
              <div key={step.n} className="ms-step">
                <div className={`ms-step-num ${step.cls}`}>{step.n}</div>
                <h3 className="ms-step-title">{step.title}</h3>
                <p className="ms-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MENTOR CATEGORIES ─── */}
      <section className="ms-cats-section">
        <div className="ms-cats-inner">
          <div style={{ marginBottom: '3.5rem' }}>
            <p className="ms-section-tag">Explore Disciplines</p>
            <h2 className="ms-section-title">
              Every field.<br />
              <span style={{ background: 'linear-gradient(135deg, #FF4D6D, #6C63FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                World-class mentors.
              </span>
            </h2>
          </div>

          <div className="ms-cats-grid">
            {categories.map(cat => (
              <a
                key={cat.name}
                href="/signup"
                className="ms-cat-card"
                style={{ '--cat-c1': cat.c1, '--cat-c2': cat.c2 } as React.CSSProperties}
              >
                <span className="ms-cat-emoji">{cat.emoji}</span>
                <div className="ms-cat-name">{cat.name}</div>
                <div className="ms-cat-count">{cat.count}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="ms-testimonials">
        <div className="ms-testimonials-inner">
          <div style={{ marginBottom: '3.5rem' }}>
            <p className="ms-section-tag">Success Stories</p>
            <h2 className="ms-section-title">
              Real results.<br />Real people.
            </h2>
          </div>

          <div className="ms-testi-grid">
            {testimonials.map(t => (
              <div key={t.name} className="ms-testi-card">
                <div className="ms-testi-stars">{'★'.repeat(t.stars)}</div>
                <p className="ms-testi-quote">{t.quote}</p>
                <div className="ms-testi-author">
                  <div
                    className="ms-testi-avatar"
                    style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`, boxShadow: `0 4px 16px ${t.colors[0]}55` }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="ms-testi-name">{t.name}</div>
                    <div className="ms-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="ms-cta-section">
        <div className="ms-cta-box">
          <h2 className="ms-cta-title">
            Your breakthrough<br />
            <span style={{ background: 'linear-gradient(135deg, #FF4D6D, #6C63FF, #00D9C5)', backgroundSize: '200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              starts today.
            </span>
          </h2>
          <p className="ms-cta-sub">
            Join 50,000+ learners accelerating their growth with world-class mentors.
          </p>
          <div className="ms-cta-actions">
            <a href="/signup" className="ms-btn-cta">Get Started Free →</a>
            <a href="/login" className="ms-btn-secondary">I have an account</a>
          </div>
          <p className="ms-cta-note">No credit card required · First session 20% off · Cancel anytime</p>
        </div>
      </section>
    </>
  )
}
