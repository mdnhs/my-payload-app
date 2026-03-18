import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// POST /api/sessions/[id]/review — leave a review (mentee only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { rating, review } = body

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  const sess = await payload.findByID({
    collection: 'sessions',
    id,
    depth: 1,
    overrideAccess: true,
  })

  if (!sess) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const menteeUserId = typeof sess.menteeUser === 'string' ? sess.menteeUser : sess.menteeUser?.id
  if (session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Only mentees can leave reviews' }, { status: 403 })
  }

  if (sess.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed sessions' }, { status: 400 })
  }

  // Update session with review
  await payload.update({
    collection: 'sessions',
    id,
    overrideAccess: true,
    data: { rating, review: review || '' },
  })

  // Recalculate mentor average rating
  const mentorId = typeof sess.mentor === 'string' ? sess.mentor : sess.mentor?.id
  if (mentorId) {
    const allReviewed = await payload.find({
      collection: 'sessions',
      where: {
        mentor: { equals: mentorId },
        status: { equals: 'completed' },
        rating: { greater_than: 0 },
      },
      limit: 500,
      overrideAccess: true,
    })

    const totalRating = allReviewed.docs.reduce((sum, s) => sum + ((s.rating as number) || 0), 0)
    const avgRating = allReviewed.docs.length > 0
      ? Math.round((totalRating / allReviewed.docs.length) * 10) / 10
      : 0

    await payload.update({
      collection: 'mentors',
      id: mentorId,
      overrideAccess: true,
      data: {
        rating: avgRating,
        reviewCount: allReviewed.docs.length,
      },
    })
  }

  return NextResponse.json({ success: true })
}
