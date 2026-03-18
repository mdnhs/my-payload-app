import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { role, userId, ...profileData } = body

    if (!role || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    if (role === 'mentor') {
      const {
        headline,
        country,
        city,
        university,
        degree,
        fieldOfStudy,
        yearsAbroad,
        services,
        hourlyRate,
        introCallFree,
        bio,
        timezone,
      } = profileData

      await payload.create({
        collection: 'mentors',
        overrideAccess: true,
        data: {
          user: userId,
          headline: headline || 'Study Abroad Mentor',
          country: country || 'usa',
          city: city || '',
          university: university || '',
          degree: degree || 'master',
          fieldOfStudy: fieldOfStudy || '',
          yearsAbroad: Number(yearsAbroad) || 0,
          services: Array.isArray(services) ? services : [],
          hourlyRate: Number(hourlyRate) || 0,
          introCallFree: introCallFree !== false,
          bio: bio || '',
          timezone: timezone || '',
          isAvailable: true,
          isVerified: false,
          totalSessions: 0,
          totalEarningsUSD: 0,
          rating: 0,
          reviewCount: 0,
        },
      })
    } else if (role === 'mentee') {
      const {
        currentEducation,
        targetDegree,
        fieldOfInterest,
        targetCountry,
        targetIntake,
        englishProficiency,
        budgetRange,
        helpNeeded,
        bio,
        timezone,
      } = profileData

      await payload.create({
        collection: 'mentees',
        overrideAccess: true,
        data: {
          user: userId,
          currentEducation: currentEducation || 'bachelor',
          targetDegree: targetDegree || 'master',
          fieldOfInterest: fieldOfInterest || '',
          targetCountry: Array.isArray(targetCountry) ? targetCountry : [],
          targetIntake: targetIntake || '',
          englishProficiency: englishProficiency || '',
          budgetRange: budgetRange || '',
          helpNeeded: Array.isArray(helpNeeded) ? helpNeeded : [],
          bio: bio || '',
          timezone: timezone || '',
          totalSessions: 0,
          totalHoursLearned: 0,
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[onboarding] Failed to create profile:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
