import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// DELETE /api/availability/[id] — mentor deletes their own slot
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  const slot = await payload.findByID({
    collection: 'availability',
    id,
    depth: 1,
    overrideAccess: true,
  })

  if (!slot) {
    return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
  }

  if (slot.isBooked) {
    return NextResponse.json({ error: 'Cannot delete a booked slot.' }, { status: 400 })
  }

  // Verify ownership
  const mentorUserId =
    typeof slot.mentor === 'object' && slot.mentor
      ? (slot.mentor as { user?: string | { id: string } }).user
      : null
  const mentorUserIdStr =
    typeof mentorUserId === 'string' ? mentorUserId : mentorUserId?.id

  if (mentorUserIdStr !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await payload.delete({ collection: 'availability', id, overrideAccess: true })

  return NextResponse.json({ success: true })
}
