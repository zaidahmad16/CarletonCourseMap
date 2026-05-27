import { RMPClient } from 'ratemyprofessors-client'
import { NextResponse } from 'next/server'

const CARLETON_SCHOOL_ID = '1420'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const client = new RMPClient()

const cache = new Map() // name → { data, expiresAt }

function getCached(name) {
  const entry = cache.get(name)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(name); return null }
  return entry.data
}

function setCached(name, data) {
  cache.set(name, { data, expiresAt: Date.now() + CACHE_TTL_MS })
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

    if (!prof) {
      const data = { found: false }
      setCached(name, data)
      return NextResponse.json(data)
    }

    // Fetch up to 5 recent ratings
    let ratings = []
    try {
      const page = await client.getProfessorRatingsPage(prof.id)
      ratings = (page.ratings ?? []).slice(0, 5).map(r => ({
        date: r.date,
        comment: r.comment,
        quality: r.quality,
        difficulty: r.difficulty,
        course: r.course_raw ?? null,
        tags: r.tags ?? [],
      }))
    } catch {
      // ratings are a bonus; don't fail the whole request
    }

    const data = {
      found: true,
      name: prof.name,
      department: prof.department,
      overall_rating: prof.overall_rating,
      difficulty: prof.level_of_difficulty,
      num_ratings: prof.num_ratings,
      would_take_again: prof.percent_take_again >= 0 ? Math.round(prof.percent_take_again) : null,
      rmp_url: `https://www.ratemyprofessors.com/professor/${prof.id}`,
      ratings,
    }

    setCached(name, data)
    return NextResponse.json(data)
  } catch (err) {
    console.error('RMP lookup failed for', name, err)
    return NextResponse.json({ found: false })
  }
}
