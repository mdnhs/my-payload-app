'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['mentor', 'mentee']).refine((v) => !!v, { message: 'Please select a role' }),
})

type SignupValues = z.infer<typeof signupSchema>

const roles = [
  {
    value: 'mentor' as const,
    label: 'Mentor',
    description: 'Share your expertise and guide others on their journey',
    icon: '🎓',
    badge: 'Teaching',
  },
  {
    value: 'mentee' as const,
    label: 'Mentee',
    description: 'Learn from experienced professionals and accelerate your growth',
    icon: '🌱',
    badge: 'Learning',
  },
]

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', role: undefined },
  })

  const selectedRole = form.watch('role')

  async function onSubmit(values: SignupValues) {
    setError(null)
    setLoading(true)
    const { error: authError } = await signUp.email({
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
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4 shadow-lg">
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MentorSpace</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect. Learn. Grow.</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>Join MentorSpace and start your journey</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">I want to join as a…</FormLabel>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {roles.map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => field.onChange(role.value)}
                            className={cn(
                              'relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all duration-200 hover:border-primary/60',
                              field.value === role.value
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border bg-card hover:bg-muted/50',
                            )}
                          >
                            <span className="text-2xl">{role.icon}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{role.label}</span>
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {role.badge}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {role.description}
                            </p>
                            {field.value === role.value && (
                              <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Min. 8 characters"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !selectedRole}
                >
                  {loading
                    ? 'Creating account…'
                    : selectedRole
                      ? `Join as ${selectedRole === 'mentor' ? 'a Mentor' : 'a Mentee'}`
                      : 'Create account'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center pt-0">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By joining, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
