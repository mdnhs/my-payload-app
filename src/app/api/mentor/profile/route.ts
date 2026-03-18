import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// GET /api/mentor/profile — return current mentor's profile (including earnings balance)
export async function GET() {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  const mentors = await payload.find({
    collection: 'mentors',
    where: { user: { equals: session.user.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (!mentors.docs[0]) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 })
  }

  const { id, totalEarningsUSD, totalSessions } = mentors.docs[0]
  return NextResponse.json({ id, totalEarningsUSD: totalEarningsUSD ?? 0, totalSessions: totalSessions ?? 0 })
}
