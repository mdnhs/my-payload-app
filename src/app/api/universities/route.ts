import { NextRequest, NextResponse } from 'next/server'
import getUniversities from 'world-universities'

let cached: { name: string; country: string }[] | null = null

async function loadUniversities() {
  if (cached) return cached
  const raw = await getUniversities()
  cached = raw.map((u: { name: string; major: string }) => ({
    name: u.name,
    country: u.major,
  }))
  return cached
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim() ?? ''
  const country = req.nextUrl.searchParams.get('country')?.toUpperCase() ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const universities = await loadUniversities()

  const results = universities!
    .filter((u) => {
      const matchesQuery = u.name.toLowerCase().includes(q)
      const matchesCountry = country ? u.country === country : true
      return matchesQuery && matchesCountry
    })
    .slice(0, 30)
    .map((u) => u.name)

  return NextResponse.json(results)
}
