import { RMPClient } from 'ratemyprofessors-client'
import { NextResponse } from 'next/server'

const CARLETON_SCHOOL_ID = '1420'
const client = new RMPClient()

// Cache results in memory for the lifetime of the server process
const cache = new Map()

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  if (cache.has(name)) {
    return NextResponse.json(cache.get(name))
  }

  try {
    const result = await client.searchProfessors(name, CARLETON_SCHOOL_ID)
    // Pick the first result that belongs to Carleton
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

    cache.set(name, data)
    return NextResponse.json(data)
  } catch (err) {
    console.error('RMP lookup failed for', name, err)
    return NextResponse.json({ found: false })
  }
}
