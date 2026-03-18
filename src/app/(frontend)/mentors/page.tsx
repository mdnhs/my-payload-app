import { getPayload } from 'payload'
import config from '@/payload.config'
import MentorsGrid, { type MentorRow } from './MentorsGrid'

export default async function FindMentorsPage() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'mentors',
    depth: 1,
    limit: 200,
    where: { isAvailable: { not_equals: false } },
  })

  const mentors: MentorRow[] = docs.map((doc) => {
    const user = doc.user as { name?: string } | null
    return {
      id: String(doc.id),
      name: user?.name ?? 'Unknown',
      headline: doc.headline ?? '',
      country: doc.country ?? 'other',
      university: (doc as Record<string, unknown>).university as string ?? '',
      degree: (doc as Record<string, unknown>).degree as string ?? 'master',
      fieldOfStudy: (doc as Record<string, unknown>).fieldOfStudy as string ?? '',
      yearsAbroad: (doc as Record<string, unknown>).yearsAbroad as number ?? 0,
      services: Array.isArray((doc as Record<string, unknown>).services) ? (doc as Record<string, unknown>).services as string[] : [],
      hourlyRate: doc.hourlyRate ?? 0,
      isAvailable: doc.isAvailable ?? false,
      introCallFree: doc.introCallFree ?? false,
      rating: doc.rating ?? 0,
      reviewCount: doc.reviewCount ?? 0,
      totalSessions: doc.totalSessions ?? 0,
    }
  })

  return <MentorsGrid mentors={mentors} />
}
