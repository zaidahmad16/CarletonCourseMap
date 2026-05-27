import { RMPClient } from 'ratemyprofessors-client'
import { NextResponse } from 'next/server'

const CARLETON_SCHOOL_ID = '1420'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 1 week; ratings don't change that fast
const client = new RMPClient()

const cache = new Map() // name to { data, expiresAt }

function getCached(name) {
  const entry = cache.get(name)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(name)
    return null
  }
  return entry.data
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const cached = getCached(name)
  if (cached) return NextResponse.json(cached)

  try {
    const result = await client.searchProfessors(name, CARLETON_SCHOOL_ID)
    const prof = result.professors?.find(p => p.school?.id === CARLETON_SCHOOL_ID) ?? null

    const data = prof
      ? {
          found: true,
          name: prof.name,
          department: prof.department,
          overall_rating: prof.overall_rating,
          difficulty: prof.level_of_difficulty,
          num_ratings: prof.num_ratings,
          would_take_again: prof.percent_take_again >= 0 ? Math.round(prof.percent_take_again) : null,
          rmp_url: `https://www.ratemyprofessors.com/professor/${prof.id}`,
        }
      : { found: false }

    cache.set(name, { data, expiresAt: Date.now() + CACHE_TTL_MS })
    return NextResponse.json(data)
  } catch (err) {
    console.error('RMP lookup failed for', name, err)
    return NextResponse.json({ found: false })
  }
}
