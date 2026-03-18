'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth-client'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

const css = `
  .li-page {
    min-height: calc(100vh - 68px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(2rem, 6vw, 4rem) clamp(1.25rem, 5vw, 2rem);
    position: relative;
  }

  .li-page::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    top: -200px; left: 50%; transform: translateX(-50%);
    background: radial-gradient(circle, rgba(201,255,71,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .li-card {
    width: 100%;
    max-width: 400px;
    position: relative;
    z-index: 1;
    opacity: 0;
    animation: li-up 0.5s ease-out 0.05s forwards;
  }

  .li-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .li-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800;
    font-size: 1.8rem;
    letter-spacing: -0.04em;
    color: #F5F5F5;
    margin-bottom: 0.5rem;
  }

  .li-title em {
    color: #C9FF47;
    font-style: italic;
  }

  .li-subtitle {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.9rem;
    color: rgba(245,245,245,0.38);
    font-weight: 400;
    line-height: 1.5;
  }

  /* form container */
  .li-form-wrap {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 2rem;
  }

  /* fields */
  .li-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1.1rem;
  }

  .li-label {
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    color: rgba(245,245,245,0.45);
    letter-spacing: 0.01em;
  }

  .li-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.92rem;
    font-weight: 400;
    color: #F5F5F5;
    outline: none;
    transition: all 0.2s;
  }

  .li-input::placeholder {
    color: rgba(245,245,245,0.16);
  }

  .li-input:focus {
    border-color: rgba(201,255,71,0.45);
    background: rgba(201,255,71,0.03);
    box-shadow: 0 0 0 3px rgba(201,255,71,0.08);
  }

  .li-input:-webkit-autofill,
  .li-input:-webkit-autofill:hover,
  .li-input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px rgba(8,8,8,0.98) inset;
    -webkit-text-fill-color: #F5F5F5;
    border-color: rgba(201,255,71,0.35);
  }

  .li-field-error {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: #FF2D6E;
    margin-top: 2px;
  }

  /* error alert */
  .li-error-bar {
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
    line-height: 1.4;
  }

  /* submit */
  .li-submit {
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

  .li-submit:hover:not(:disabled) {
    background: #D8FF60;
    transform: translateY(-1px);
    box-shadow: 0 0 40px rgba(201,255,71,0.3);
  }

  .li-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .li-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(8,8,8,0.2);
    border-top-color: #080808;
    border-radius: 50%;
    animation: li-spin 0.6s linear infinite;
    margin-right: 6px;
    vertical-align: middle;
  }

  @keyframes li-spin { to { transform: rotate(360deg); } }

  /* footer */
  .li-footer {
    text-align: center;
    margin-top: 1.5rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.85rem;
    color: rgba(245,245,245,0.3);
    font-weight: 400;
  }

  .li-footer a {
    color: #C9FF47;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.18s;
  }

  .li-footer a:hover { opacity: 0.7; }

  /* back link */
  .li-back {
    display: block;
    text-align: center;
    margin-top: 2rem;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    color: rgba(245,245,245,0.22);
    text-decoration: none;
    transition: color 0.18s;
  }

  .li-back:hover { color: rgba(245,245,245,0.5); }

  @keyframes li-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setError(null)
    setLoading(true)
    const { error: authError } = await signIn.email({
      email: values.email,
      password: values.password,
    })
    setLoading(false)
    if (authError) {
      setError(authError.message ?? 'Invalid email or password')
      return
    }
    router.push('/mentors')
    router.refresh()
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="li-page">
        <div className="li-card">
          <div className="li-header">
            <h1 className="li-title">Welcome <em>back</em></h1>
            <p className="li-subtitle">Sign in to continue your journey</p>
          </div>

          <div className="li-form-wrap">
            {error && (
              <div className="li-error-bar">{error}</div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="li-field">
                        <label className="li-label">Email</label>
                        <FormControl>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="li-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        {fieldState.error && (
                          <span className="li-field-error">{fieldState.error.message}</span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="li-field">
                        <label className="li-label">Password</label>
                        <FormControl>
                          <input
                            type="password"
                            placeholder="Min. 8 characters"
                            autoComplete="current-password"
                            className="li-input"
                            {...field}
                          />
                        </FormControl>
                        {fieldState.error && (
                          <span className="li-field-error">{fieldState.error.message}</span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <button type="submit" className="li-submit" disabled={loading}>
                  {loading && <span className="li-spinner" />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            </Form>
          </div>

          <p className="li-footer">
            Don&apos;t have an account? <Link href="/signup">Sign up free</Link>
          </p>

          <Link href="/" className="li-back">&larr; Back to home</Link>
        </div>
      </div>
    </>
  )
}
