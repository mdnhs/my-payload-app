'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth-client'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { getCountries } from '@/lib/data/countries'
import { SUBJECTS } from '@/lib/data/subjects'
import { TIMEZONES } from '@/lib/data/timezones'

const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['mentor', 'mentee'], { required_error: 'Please select a role' }),
})
type Step1Values = z.infer<typeof step1Schema>

const COUNTRY_OPTIONS = getCountries().map(c => ({ value: c.code, label: c.name }))

// Popular countries shown as pills for mentee target selection
const POPULAR_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'NL', 'SE', 'JP', 'KR', 'IE', 'NZ', 'SG', 'MY', 'IT', 'ES', 'CH', 'FI', 'DK', 'NO']
const POPULAR_COUNTRY_OPTIONS = COUNTRY_OPTIONS.filter(c => POPULAR_COUNTRIES.includes(c.value))

const DEGREE_OPTIONS = [
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'postdoc', label: 'Postdoc / Researcher' },
  { value: 'working', label: 'Working Professional' },
  { value: 'language', label: 'Language Course' },
]

const SERVICE_OPTIONS = [
  { value: 'university_selection', label: 'University Selection' },
  { value: 'application_review', label: 'Application Review' },
  { value: 'sop_review', label: 'SOP / Essay Review' },
  { value: 'visa_guidance', label: 'Visa Guidance' },
  { value: 'scholarship', label: 'Scholarship Help' },
  { value: 'interview_prep', label: 'Interview Prep' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'lifestyle_guide', label: 'Lifestyle Guide' },
  { value: 'job_guidance', label: 'Part-time Job Guidance' },
  { value: 'language_test', label: 'IELTS/TOEFL Prep' },
]

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School / HSC' },
  { value: 'bachelor', label: "Bachelor's (ongoing/completed)" },
  { value: 'master', label: "Master's (ongoing/completed)" },
  { value: 'working', label: 'Working Professional' },
]

const TARGET_DEGREE_OPTIONS = [
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'language', label: 'Language Course' },
  { value: 'foundation', label: 'Foundation / Pathway' },
  { value: 'diploma', label: 'Diploma / Certificate' },
]

const BUDGET_OPTIONS = [
  { value: 'full_scholarship', label: 'Need Full Scholarship' },
  { value: 'under_10k', label: 'Under $10,000/year' },
  { value: '10k_25k', label: '$10,000–$25,000/year' },
  { value: '25k_50k', label: '$25,000–$50,000/year' },
  { value: 'over_50k', label: 'Over $50,000/year' },
  { value: 'flexible', label: 'Flexible' },
]

const ENGLISH_OPTIONS = [
  { value: 'native', label: 'Native Speaker' },
  { value: 'advanced', label: 'Advanced / Fluent' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'basic', label: 'Basic' },
  { value: 'preparing_ielts', label: 'Preparing for IELTS' },
  { value: 'preparing_toefl', label: 'Preparing for TOEFL' },
  { value: 'has_ielts', label: 'IELTS Score Available' },
  { value: 'has_toefl', label: 'TOEFL Score Available' },
]

const css = `
  .su-page {
    min-height: calc(100vh - 68px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 5vw, 2rem);
    position: relative;
  }

  .su-page::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    top: -200px; left: 50%; transform: translateX(-50%);
    background: radial-gradient(circle, rgba(201,255,71,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .su-card {
    width: 100%;
    max-width: 460px;
    position: relative;
    z-index: 1;
    opacity: 0;
    animation: su-up 0.5s ease-out 0.05s forwards;
  }

  .su-header {
    text-align: center;
    margin-bottom: 1.75rem;
  }

  .su-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: 1.8rem;
    letter-spacing: -0.04em;
    color: #F5F5F5;
    margin-bottom: 0.5rem;
  }

  .su-title em { color: #C9FF47; font-style: italic; }

  .su-subtitle {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.9rem;
    color: rgba(245,245,245,0.38);
    font-weight: 400;
    line-height: 1.5;
  }

  /* step indicator */
  .su-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 1.75rem;
  }

  .su-step-dot {
    height: 3px;
    border-radius: 2px;
    transition: all 0.3s;
  }

  .su-step-dot.active { width: 32px; background: #C9FF47; }
  .su-step-dot.done { width: 32px; background: rgba(201,255,71,0.3); }
  .su-step-dot.idle { width: 32px; background: rgba(255,255,255,0.08); }

  .su-step-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem;
    color: rgba(245,245,245,0.25);
    margin-left: 6px;
    font-weight: 500;
  }

  /* form wrap */
  .su-form-wrap {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 2rem;
  }

  /* role selector */
  .su-role-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    color: rgba(245,245,245,0.45);
    margin-bottom: 0.5rem;
    display: block;
  }

  .su-role-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 1.25rem;
  }

  .su-role-btn {
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    outline: none;
  }

  .su-role-btn:hover {
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.05);
  }

  .su-role-btn.selected-mentor {
    border-color: rgba(201,255,71,0.5);
    background: rgba(201,255,71,0.04);
  }

  .su-role-btn.selected-mentee {
    border-color: rgba(59,130,246,0.5);
    background: rgba(59,130,246,0.04);
  }

  .su-role-btn-name {
    font-family: var(--font-syne), sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    color: #F5F5F5;
    margin-bottom: 2px;
  }

  .su-role-btn-desc {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem;
    color: rgba(245,245,245,0.35);
  }

  /* fields */
  .su-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }

  .su-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 1rem;
  }

  .su-field-row .su-field { margin-bottom: 0; }

  .su-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    color: rgba(245,245,245,0.45);
  }

  .su-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.92rem;
    color: #F5F5F5;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .su-input::placeholder { color: rgba(245,245,245,0.16); }

  .su-input:focus {
    border-color: rgba(201,255,71,0.45);
    background: rgba(201,255,71,0.03);
    box-shadow: 0 0 0 3px rgba(201,255,71,0.08);
  }

  .su-input:-webkit-autofill,
  .su-input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px rgba(8,8,8,0.98) inset;
    -webkit-text-fill-color: #F5F5F5;
    border-color: rgba(201,255,71,0.35);
  }

  .su-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.92rem;
    color: #F5F5F5;
    outline: none;
    transition: all 0.2s;
    cursor: pointer;
    appearance: none;
    box-sizing: border-box;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(245,245,245,0.3)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }

  .su-select:focus {
    border-color: rgba(201,255,71,0.45);
    background-color: rgba(201,255,71,0.03);
    box-shadow: 0 0 0 3px rgba(201,255,71,0.08);
  }

  .su-select option { background: #111; color: #F5F5F5; }

  .su-textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.92rem;
    color: #F5F5F5;
    outline: none;
    transition: all 0.2s;
    resize: vertical;
    min-height: 72px;
    box-sizing: border-box;
  }

  .su-textarea::placeholder { color: rgba(245,245,245,0.16); }

  .su-textarea:focus {
    border-color: rgba(201,255,71,0.45);
    background: rgba(201,255,71,0.03);
    box-shadow: 0 0 0 3px rgba(201,255,71,0.08);
  }

  /* service pills */
  .su-pills { display: flex; flex-wrap: wrap; gap: 6px; }

  .su-pill {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 5px 13px;
    border-radius: 100px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    color: rgba(245,245,245,0.45);
    transition: all 0.18s;
  }

  .su-pill:hover { border-color: rgba(255,255,255,0.2); color: #F5F5F5; }

  .su-pill.selected {
    background: rgba(201,255,71,0.08);
    border-color: rgba(201,255,71,0.25);
    color: #C9FF47;
  }

  /* checkbox */
  .su-checkbox-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1rem;
    cursor: pointer;
  }

  .su-checkbox {
    width: 16px; height: 16px;
    border-radius: 5px;
    border: 1.5px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .su-checkbox.checked { background: #C9FF47; border-color: #C9FF47; }

  .su-checkbox-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.82rem;
    color: rgba(245,245,245,0.55);
    font-weight: 500;
  }

  /* error */
  .su-field-error {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: #FF2D6E;
    margin-top: 2px;
  }

  .su-error-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,45,110,0.06);
    border: 1px solid rgba(255,45,110,0.18);
    border-radius: 12px;
    padding: 10px 14px;
    margin-bottom: 1.25rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.85rem;
    color: #FF2D6E;
    font-weight: 500;
  }

  /* submit */
  .su-submit {
    width: 100%;
    padding: 13px;
    background: #C9FF47;
    border: none;
    border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 700;
    font-size: 0.92rem;
    color: #080808;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.25rem;
    box-shadow: 0 0 24px rgba(201,255,71,0.18);
  }

  .su-submit:hover:not(:disabled) {
    background: #D8FF60;
    transform: translateY(-1px);
    box-shadow: 0 0 40px rgba(201,255,71,0.3);
  }

  .su-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .su-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(8,8,8,0.2);
    border-top-color: #080808;
    border-radius: 50%;
    animation: su-spin 0.6s linear infinite;
    margin-right: 6px;
    vertical-align: middle;
  }

  @keyframes su-spin { to { transform: rotate(360deg); } }

  .su-back-step {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(245,245,245,0.3);
    background: none;
    border: none;
    cursor: pointer;
    display: block;
    margin: 0.75rem auto 0;
    transition: color 0.18s;
  }

  .su-back-step:hover { color: rgba(245,245,245,0.6); }

  /* footer */
  .su-footer {
    text-align: center;
    margin-top: 1.5rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.85rem;
    color: rgba(245,245,245,0.3);
  }

  .su-footer a {
    color: #C9FF47;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.18s;
  }

  .su-footer a:hover { opacity: 0.7; }

  .su-terms {
    text-align: center;
    margin-top: 0.65rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.7rem;
    color: rgba(245,245,245,0.18);
  }

  .su-terms a { color: rgba(245,245,245,0.3); text-decoration: underline; }

  .su-back-home {
    display: block;
    text-align: center;
    margin-top: 1.75rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    color: rgba(245,245,245,0.22);
    text-decoration: none;
    transition: color 0.18s;
  }

  .su-back-home:hover { color: rgba(245,245,245,0.5); }

  @keyframes su-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* autocomplete dropdown */
  .su-autocomplete {
    position: relative;
  }

  .su-autocomplete-list {
    position: absolute;
    top: 100%;
    left: 0; right: 0;
    z-index: 50;
    max-height: 200px;
    overflow-y: auto;
    background: #1a1a1a;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    margin-top: 4px;
    padding: 4px;
  }

  .su-autocomplete-item {
    padding: 8px 12px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.85rem;
    color: rgba(245,245,245,0.7);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.12s;
  }

  .su-autocomplete-item:hover {
    background: rgba(201,255,71,0.08);
    color: #F5F5F5;
  }

  .su-autocomplete-empty {
    padding: 8px 12px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    color: rgba(245,245,245,0.25);
  }

  @media (max-width: 520px) {
    .su-field-row { grid-template-columns: 1fr; }
    .su-role-grid { grid-template-columns: 1fr; }
  }
`

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [createdUserId, setCreatedUserId] = useState('')
  const [createdUserName, setCreatedUserName] = useState('')
  const [createdRole, setCreatedRole] = useState<'mentor' | 'mentee'>('mentee')

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: '', email: '', password: '', role: undefined },
  })
  const selectedRole = form.watch('role')

  // University autocomplete
  const [uniQuery, setUniQuery] = useState('')
  const [uniResults, setUniResults] = useState<string[]>([])
  const [uniOpen, setUniOpen] = useState(false)
  const uniRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (uniQuery.length < 2) { setUniResults([]); return }
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/universities?q=${encodeURIComponent(uniQuery)}`, { signal: controller.signal })
        if (res.ok) setUniResults(await res.json())
      } catch { /* aborted */ }
    }, 300)
    return () => { clearTimeout(timeout); controller.abort() }
  }, [uniQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) setUniOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Subject search filter
  const [subjectQuery, setSubjectQuery] = useState('')
  const filteredSubjects = useMemo(() => {
    if (!subjectQuery) return SUBJECTS
    const q = subjectQuery.toLowerCase()
    return SUBJECTS.filter(s => s.toLowerCase().includes(q))
  }, [subjectQuery])

  // Detect user timezone
  const detectedTimezone = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return '' }
  }, [])

  // Country search for mentee pills
  const [countrySearch, setCountrySearch] = useState('')
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return POPULAR_COUNTRY_OPTIONS
    const q = countrySearch.toLowerCase()
    return COUNTRY_OPTIONS.filter(c => c.label.toLowerCase().includes(q)).slice(0, 20)
  }, [countrySearch])

  async function onStep1Submit(values: Step1Values) {
    setError(null)
    setLoading(true)
    const { data, error: authError } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
    } as Parameters<typeof signUp.email>[0])
    setLoading(false)
    if (authError) {
      setError(authError.message ?? 'Something went wrong. Please try again.')
      return
    }
    const uid = (data as { user?: { id?: string } } | null)?.user?.id ?? ''
    setCreatedUserId(uid)
    setCreatedUserName(values.name)
    setCreatedRole(values.role)
    setStep(2)
  }

  // Mentor profile state
  const [mentor, setMentor] = useState({
    headline: '', country: 'US', city: '', university: '',
    degree: 'master', fieldOfStudy: '', yearsAbroad: '',
    services: [] as string[], hourlyRate: '', introCallFree: true,
    bio: '', timezone: detectedTimezone,
  })

  function toggleMentorService(val: string) {
    setMentor(p => ({
      ...p,
      services: p.services.includes(val)
        ? p.services.filter(x => x !== val)
        : [...p.services, val],
    }))
  }

  // Mentee profile state
  const [mentee, setMentee] = useState({
    currentEducation: 'bachelor', targetDegree: 'master',
    fieldOfInterest: '', targetCountry: [] as string[],
    targetIntake: '', englishProficiency: '', budgetRange: '',
    helpNeeded: [] as string[], bio: '', timezone: detectedTimezone,
  })

  function toggleMenteeCountry(val: string) {
    setMentee(p => ({
      ...p,
      targetCountry: p.targetCountry.includes(val)
        ? p.targetCountry.filter(x => x !== val)
        : [...p.targetCountry, val],
    }))
  }

  function toggleMenteeHelp(val: string) {
    setMentee(p => ({
      ...p,
      helpNeeded: p.helpNeeded.includes(val)
        ? p.helpNeeded.filter(x => x !== val)
        : [...p.helpNeeded, val],
    }))
  }

  async function onStep2Submit() {
    setError(null)
    setLoading(true)

    const profilePayload = createdRole === 'mentor'
      ? {
          role: 'mentor', userId: createdUserId,
          headline: mentor.headline || `${createdUserName} — Study Abroad Mentor`,
          country: mentor.country, city: mentor.city,
          university: mentor.university, degree: mentor.degree,
          fieldOfStudy: mentor.fieldOfStudy,
          yearsAbroad: Number(mentor.yearsAbroad) || 0,
          services: mentor.services,
          hourlyRate: Number(mentor.hourlyRate) || 0,
          introCallFree: mentor.introCallFree,
          bio: mentor.bio, timezone: mentor.timezone,
        }
      : {
          role: 'mentee', userId: createdUserId,
          currentEducation: mentee.currentEducation,
          targetDegree: mentee.targetDegree,
          fieldOfInterest: mentee.fieldOfInterest,
          targetCountry: mentee.targetCountry,
          targetIntake: mentee.targetIntake,
          englishProficiency: mentee.englishProficiency,
          budgetRange: mentee.budgetRange,
          helpNeeded: mentee.helpNeeded,
          bio: mentee.bio, timezone: mentee.timezone,
        }

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profilePayload),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not save profile. You can update it later.')
    }
    router.push('/mentors')
    router.refresh()
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="su-page">
        <div className="su-card">
          <div className="su-header">
            <h1 className="su-title">
              {step === 1 ? <>Join <em>MentorSpace</em></> : <>Set up your <em>profile</em></>}
            </h1>
            <p className="su-subtitle">
              {step === 1
                ? 'Connect with mentors who are already abroad'
                : createdRole === 'mentor'
                  ? 'Help students find you. You can edit this later.'
                  : 'Tell us about your study abroad plans.'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="su-steps">
            <div className={`su-step-dot ${step === 1 ? 'active' : 'done'}`} />
            <div className={`su-step-dot ${step === 2 ? 'active' : 'idle'}`} />
            <span className="su-step-label">Step {step} of 2</span>
          </div>

          <div className="su-form-wrap">
            {error && <div className="su-error-bar">{error}</div>}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onStep1Submit)}>
                  {/* Role */}
                  <FormField control={form.control} name="role" render={({ field, fieldState }) => (
                    <FormItem>
                      <span className="su-role-label">I want to join as</span>
                      <FormControl>
                        <div className="su-role-grid">
                          {[
                            { value: 'mentor' as const, label: 'Mentor', desc: 'I study/live abroad' },
                            { value: 'mentee' as const, label: 'Student', desc: 'I want to go abroad' },
                          ].map(role => (
                            <button key={role.value} type="button"
                              onClick={() => field.onChange(role.value)}
                              className={cn('su-role-btn', field.value === role.value && `selected-${role.value}`)}>
                              <div className="su-role-btn-name">{role.label}</div>
                              <div className="su-role-btn-desc">{role.desc}</div>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {fieldState.error && <span className="su-field-error">{fieldState.error.message}</span>}
                    </FormItem>
                  )} />

                  {/* Name */}
                  <FormField control={form.control} name="name" render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="su-field">
                        <label className="su-label">Full name</label>
                        <FormControl>
                          <input placeholder="Jane Smith" autoComplete="name" className="su-input" {...field} />
                        </FormControl>
                        {fieldState.error && <span className="su-field-error">{fieldState.error.message}</span>}
                      </div>
                    </FormItem>
                  )} />

                  {/* Email */}
                  <FormField control={form.control} name="email" render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="su-field">
                        <label className="su-label">Email</label>
                        <FormControl>
                          <input type="email" placeholder="you@example.com" autoComplete="email" className="su-input" {...field} />
                        </FormControl>
                        {fieldState.error && <span className="su-field-error">{fieldState.error.message}</span>}
                      </div>
                    </FormItem>
                  )} />

                  {/* Password */}
                  <FormField control={form.control} name="password" render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="su-field">
                        <label className="su-label">Password</label>
                        <FormControl>
                          <input type="password" placeholder="Min. 8 characters" autoComplete="new-password" className="su-input" {...field} />
                        </FormControl>
                        {fieldState.error && <span className="su-field-error">{fieldState.error.message}</span>}
                      </div>
                    </FormItem>
                  )} />

                  <button type="submit" className="su-submit" disabled={loading || !selectedRole}>
                    {loading && <span className="su-spinner" />}
                    {loading ? 'Creating account...' : selectedRole ? `Continue as ${selectedRole === 'mentee' ? 'Student' : 'Mentor'}` : 'Select a role to continue'}
                  </button>
                </form>
              </Form>
            )}

            {/* ── STEP 2: MENTOR ── */}
            {step === 2 && createdRole === 'mentor' && (
              <>
                <div className="su-field">
                  <label className="su-label">Headline</label>
                  <input className="su-input" placeholder='e.g. MS in CS @ MIT — Living in USA since 2020'
                    value={mentor.headline} onChange={e => setMentor(p => ({ ...p, headline: e.target.value }))} />
                </div>

                <div className="su-field-row">
                  <div className="su-field">
                    <label className="su-label">Country you live in</label>
                    <select className="su-select" value={mentor.country} onChange={e => setMentor(p => ({ ...p, country: e.target.value }))}>
                      <option value="">Select country...</option>
                      {COUNTRY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="su-field">
                    <label className="su-label">City</label>
                    <input className="su-input" placeholder="e.g. Boston"
                      value={mentor.city} onChange={e => setMentor(p => ({ ...p, city: e.target.value }))} />
                  </div>
                </div>

                <div className="su-field-row">
                  <div className="su-field">
                    <label className="su-label">University</label>
                    <div className="su-autocomplete" ref={uniRef}>
                      <input className="su-input" placeholder="Start typing university name..."
                        value={mentor.university}
                        onChange={e => { setMentor(p => ({ ...p, university: e.target.value })); setUniQuery(e.target.value); setUniOpen(true) }}
                        onFocus={() => uniQuery.length >= 2 && setUniOpen(true)} />
                      {uniOpen && uniResults.length > 0 && (
                        <div className="su-autocomplete-list">
                          {uniResults.map(name => (
                            <div key={name} className="su-autocomplete-item"
                              onClick={() => { setMentor(p => ({ ...p, university: name })); setUniOpen(false); setUniQuery(name) }}>
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                      {uniOpen && uniQuery.length >= 2 && uniResults.length === 0 && (
                        <div className="su-autocomplete-list">
                          <div className="su-autocomplete-empty">No universities found</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="su-field">
                    <label className="su-label">Degree</label>
                    <select className="su-select" value={mentor.degree} onChange={e => setMentor(p => ({ ...p, degree: e.target.value }))}>
                      {DEGREE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="su-field-row">
                  <div className="su-field">
                    <label className="su-label">Field of study</label>
                    <select className="su-select" value={mentor.fieldOfStudy} onChange={e => setMentor(p => ({ ...p, fieldOfStudy: e.target.value }))}>
                      <option value="">Select subject...</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="su-field">
                    <label className="su-label">Years abroad</label>
                    <input className="su-input" type="number" min="0" max="30" placeholder="e.g. 3"
                      value={mentor.yearsAbroad} onChange={e => setMentor(p => ({ ...p, yearsAbroad: e.target.value }))} />
                  </div>
                </div>

                <div className="su-field">
                  <label className="su-label">Services you can offer</label>
                  <div className="su-pills">
                    {SERVICE_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        className={`su-pill${mentor.services.includes(opt.value) ? ' selected' : ''}`}
                        onClick={() => toggleMentorService(opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="su-field-row">
                  <div className="su-field">
                    <label className="su-label">Hourly rate (USD)</label>
                    <input className="su-input" type="number" min="0" placeholder="0 = free"
                      value={mentor.hourlyRate} onChange={e => setMentor(p => ({ ...p, hourlyRate: e.target.value }))} />
                  </div>
                  <div className="su-field">
                    <label className="su-label">Timezone</label>
                    <select className="su-select" value={mentor.timezone} onChange={e => setMentor(p => ({ ...p, timezone: e.target.value }))}>
                      <option value="">Select timezone...</option>
                      {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="su-checkbox-wrap" onClick={() => setMentor(p => ({ ...p, introCallFree: !p.introCallFree }))}>
                  <div className={`su-checkbox${mentor.introCallFree ? ' checked' : ''}`}>
                    {mentor.introCallFree && <span style={{ color: '#080808', fontWeight: 700, fontSize: '0.6rem' }}>✓</span>}
                  </div>
                  <span className="su-checkbox-label">Offer a free intro call</span>
                </div>

                <div className="su-field">
                  <label className="su-label">Short bio</label>
                  <textarea className="su-textarea" rows={3} placeholder="Tell students about your journey abroad..."
                    value={mentor.bio} onChange={e => setMentor(p => ({ ...p, bio: e.target.value }))} />
                </div>

                <button className="su-submit" onClick={onStep2Submit} disabled={loading}>
                  {loading && <span className="su-spinner" />}
                  {loading ? 'Saving...' : 'Complete setup'}
                </button>
                <button className="su-back-step" onClick={() => setStep(1)}>← Back</button>
              </>
            )}

            {/* ── STEP 2: STUDENT (MENTEE) ── */}
            {step === 2 && createdRole === 'mentee' && (
              <>
                <div className="su-field-row">
                  <div className="su-field">
                    <label className="su-label">Current education</label>
                    <select className="su-select" value={mentee.currentEducation} onChange={e => setMentee(p => ({ ...p, currentEducation: e.target.value }))}>
                      {EDUCATION_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div className="su-field">
                    <label className="su-label">Target degree</label>
                    <select className="su-select" value={mentee.targetDegree} onChange={e => setMentee(p => ({ ...p, targetDegree: e.target.value }))}>
                      {TARGET_DEGREE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="su-field-row">
                  <div className="su-field">
                    <label className="su-label">Field of interest</label>
                    <select className="su-select" value={mentee.fieldOfInterest} onChange={e => setMentee(p => ({ ...p, fieldOfInterest: e.target.value }))}>
                      <option value="">Select subject...</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="su-field">
                    <label className="su-label">Target intake</label>
                    <input className="su-input" placeholder="e.g. Fall 2026"
                      value={mentee.targetIntake} onChange={e => setMentee(p => ({ ...p, targetIntake: e.target.value }))} />
                  </div>
                </div>

                <div className="su-field">
                  <label className="su-label">Target countries (select all that apply)</label>
                  <input className="su-input" placeholder="Search countries..."
                    value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                    style={{ marginBottom: 8 }} />
                  <div className="su-pills">
                    {filteredCountries.map(opt => (
                      <button key={opt.value} type="button"
                        className={`su-pill${mentee.targetCountry.includes(opt.value) ? ' selected' : ''}`}
                        onClick={() => toggleMenteeCountry(opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="su-field">
                  <label className="su-label">What help do you need?</label>
                  <div className="su-pills">
                    {SERVICE_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        className={`su-pill${mentee.helpNeeded.includes(opt.value) ? ' selected' : ''}`}
                        onClick={() => toggleMenteeHelp(opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="su-field-row">
                  <div className="su-field">
                    <label className="su-label">English proficiency</label>
                    <select className="su-select" value={mentee.englishProficiency} onChange={e => setMentee(p => ({ ...p, englishProficiency: e.target.value }))}>
                      <option value="">Select...</option>
                      {ENGLISH_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div className="su-field">
                    <label className="su-label">Budget range</label>
                    <select className="su-select" value={mentee.budgetRange} onChange={e => setMentee(p => ({ ...p, budgetRange: e.target.value }))}>
                      <option value="">Select...</option>
                      {BUDGET_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="su-field">
                  <label className="su-label">Timezone</label>
                  <select className="su-select" value={mentee.timezone} onChange={e => setMentee(p => ({ ...p, timezone: e.target.value }))}>
                    <option value="">Select timezone...</option>
                    {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>

                <div className="su-field">
                  <label className="su-label">Short bio</label>
                  <textarea className="su-textarea" rows={3} placeholder="Tell mentors about yourself and your plans..."
                    value={mentee.bio} onChange={e => setMentee(p => ({ ...p, bio: e.target.value }))} />
                </div>

                <button className="su-submit" onClick={onStep2Submit} disabled={loading}>
                  {loading && <span className="su-spinner" />}
                  {loading ? 'Saving...' : 'Find my mentor'}
                </button>
                <button className="su-back-step" onClick={() => setStep(1)}>← Back</button>
              </>
            )}
          </div>

          {step === 1 && (
            <>
              <p className="su-footer">
                Already have an account? <Link href="/login">Sign in</Link>
              </p>
              <p className="su-terms">
                By joining you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
              </p>
            </>
          )}

          <Link href="/" className="su-back-home">← Back to home</Link>
        </div>
      </div>
    </>
  )
}
