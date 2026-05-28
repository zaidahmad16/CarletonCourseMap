/* landing page, modern minimal Carleton theme */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API } from './map/utils/constants'


export default function Home() {
  const router = useRouter()
  const [stats,       setStats]       = useState({ departments: null, programs: null, courses: null })
  const [depts,       setDepts]       = useState({})
  const [allPrograms,   setAllPrograms]   = useState(null)
  const [searchQ,       setSearchQ]       = useState('')
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})

    fetch(`${API}/departments`)
      .then(r => r.json())
      .then(deps => {
        const deptMap = {}
        for (const d of deps) deptMap[d.dept_id] = d.name
        setDepts(deptMap)
      }).catch(() => {})
  }, [])

  const loadAllPrograms = useCallback(() => {
    if (allPrograms !== null || searchLoading) return
    setSearchLoading(true)
    fetch(`${API}/programs`)
      .then(r => r.json())
      .then(progs => { setAllPrograms(progs); setSearchLoading(false) })
      .catch(() => setSearchLoading(false))
  }, [allPrograms, searchLoading])

  const searchResults = useMemo(() => {
    if (!searchQ.trim() || !allPrograms) return []
    const q = searchQ.toLowerCase()
    return allPrograms
      .filter(p =>
        p.degree.toLowerCase().includes(q) ||
        (depts[p.dept_id] || '').toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(p => ({ ...p, dept_name: depts[p.dept_id] || '' }))
  }, [searchQ, allPrograms, depts])

  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      background: 'var(--color-paper)',
      color: 'var(--color-ink)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <style>{`
        .cta-red:hover       { background: var(--color-accent-hover) !important; }
        .cta-white:hover     { background: var(--color-paper-2) !important; }
        .footer-link:hover   { color: var(--color-accent) !important; }
        .search-result:hover { background: var(--color-paper-2) !important; }
        @media (max-width: 720px) {
          .steps-grid   { grid-template-columns: 1fr !important; }
          .stat-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .feature-list { columns: 1 !important; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* nav */}
      <nav style={{
        borderBottom: '1px solid var(--color-rule)',
        padding: '0 var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        background: 'var(--color-paper)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'var(--text-lg)',
          letterSpacing: '-0.01em',
          color: 'var(--color-ink)',
        }}>
          <span style={{ color: 'var(--color-accent)' }}>Carleton</span>CourseMap
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <a
            href="https://github.com/zaidahmad16/CarletonCourseMap"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px var(--space-md)',
              borderRadius: 'var(--radius-input)',
              border: '1px solid var(--color-rule)',
              background: 'var(--color-paper-2)',
              color: 'var(--color-ink)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <Link href="/map" className="cta-red" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            padding: '7px var(--space-md)',
            borderRadius: 'var(--radius-input)',
            textDecoration: 'none',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            transition: 'background var(--dur-short) var(--ease-out)',
            whiteSpace: 'nowrap',
          }}>
            Open Map
          </Link>
        </div>
      </nav>

      {/* hero */}
      <section style={{
        padding: 'var(--space-3xl) var(--space-lg) var(--space-xl)',
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          color: 'var(--color-ink-3)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-sm)',
        }}>
          2026–2027 Undergraduate Calendar
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-display)',
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: 'var(--color-ink)',
          margin: '0 0 var(--space-md) 0',
          overflowWrap: 'anywhere',
        }}>
          Plan your degree,<br />semester by semester.
        </h1>

        <p style={{
          fontSize: 'var(--text-lg)',
          lineHeight: 1.65,
          color: 'var(--color-ink-2)',
          margin: '0 auto var(--space-xl)',
          maxWidth: 520,
        }}>
          An interactive course map for every Carleton program — prerequisites, elective slots, and course details at a click.
        </p>

        {/*  Search  */}
        <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto var(--space-sm)', width: '100%' }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"
              style={{
                position: 'absolute', left: 13, top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none', color: 'var(--color-ink-3)',
              }}
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true) }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--color-accent)'
                setSearchOpen(true)
                loadAllPrograms()
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--color-rule)'
                setTimeout(() => setSearchOpen(false), 200)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  router.push(`/map?dept=${searchResults[0].dept_id}&p=${searchResults[0].program_id}`)
                }
              }}
              placeholder="Search for a program or department…"
              style={{
                width: '100%',
                border: '1.5px solid var(--color-rule)',
                borderRadius: 'var(--radius-input)',
                padding: '11px 14px 11px 40px',
                fontSize: 'var(--text-md)',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-ink)',
                background: 'var(--color-paper)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color var(--dur-short) var(--ease-out)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            />
          </div>

          {searchOpen && searchQ.trim() && (
            <div style={{
              position: 'absolute',
              top: '100%', left: 0, right: 0,
              marginTop: 4,
              background: 'var(--color-paper)',
              border: '1px solid var(--color-rule)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              zIndex: 20,
              textAlign: 'left',
            }}>
              {searchLoading ? (
                <div style={{ padding: '10px 14px', fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>
                  Loading…
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '10px 14px', fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>
                  No programs found
                </div>
              ) : searchResults.map((p, i) => (
                <a
                  key={p.program_id}
                  href={`/map?dept=${p.dept_id}&p=${p.program_id}`}
                  className="search-result"
                  style={{
                    display: 'block',
                    padding: '9px 14px',
                    textDecoration: 'none',
                    borderBottom: i < searchResults.length - 1 ? '1px solid var(--color-rule)' : 'none',
                    transition: 'background var(--dur-short) var(--ease-out)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                    {p.degree}
                  </div>
                  {p.dept_name && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', marginTop: 2 }}>
                      {p.dept_name}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-ink-3)' }}>
          <Link href="/map" style={{
            color: 'var(--color-ink-2)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}>
            Browse all programs →
          </Link>
        </p>
      </section>

      {/* stats strip */}
      <div style={{
        borderTop: '1px solid var(--color-rule)',
        borderBottom: '1px solid var(--color-rule)',
        background: 'var(--color-paper-2)',
      }}>
        <div className="stat-grid" style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 'var(--space-lg)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-lg)',
        }}>
          <Stat value="700+" label="Students helped" fixed />
          <Stat value={stats.programs}   label="Programs" />
          <Stat value={stats.courses}    label="Courses indexed" />
        </div>
      </div>

      {/* how it works */}
      <section style={{
        padding: 'var(--space-2xl) var(--space-lg)',
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--color-ink)',
          margin: '0 0 var(--space-xl) 0',
        }}>
          How it works
        </h2>

        <div className="steps-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-xl)',
        }}>
          <Step
            num="01"
            title="Prerequisite chains"
            body="See which courses unlock which. Every arrow on the map is a real prerequisite from the Carleton calendar."
          />
          <Step
            num="02"
            title="Elective slots at a glance"
            body="Elective and breadth slots are marked in your four-year grid so you can see exactly where you have room to choose."
          />
          <Step
            num="03"
            title="Course details on click"
            body="Tap any course for the full calendar description, credit weight, term offerings, and formal prerequisites."
          />
        </div>
      </section>

      {/* what's on the map */}
      <section style={{
        borderTop: '1px solid var(--color-rule)',
        padding: 'var(--space-2xl) var(--space-lg)',
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--color-ink)',
          margin: '0 0 var(--space-lg) 0',
        }}>
          What's on the map
        </h2>
        <ul
          className="feature-list"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            columns: 2,
            columnGap: 'var(--space-xl)',
          }}
        >
          {[
            'Prerequisite chain visualization',
            'Four-year semester grid',
            'Elective and breadth slot markers',
            'Course details, credits, and term offerings',
            'Professor info and RateMyProfessors ratings',
            'Recent student reviews per professor',
            'All programs from the 2026-2027 calendar',
            'Works on mobile',
          ].map(f => (
            <li key={f} style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-ink-2)',
              padding: 'var(--space-xs) 0',
              borderBottom: '1px solid var(--color-rule)',
              breakInside: 'avoid',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
            }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>—</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA band */}
      <section style={{
        background: 'var(--color-accent)',
        padding: 'var(--space-2xl) var(--space-lg)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: 'var(--color-accent-ink)',
            margin: '0 0 var(--space-xs) 0',
            letterSpacing: '-0.01em',
          }}>
            See exactly what you need to graduate.
          </p>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-cta-sub)',
            margin: '0 0 var(--space-lg) 0',
            lineHeight: 1.6,
          }}>
            {stats.departments
              ? `All ${stats.departments} departments · ${stats.programs} programs · 2026–2027 Undergraduate Calendar`
              : 'Every department and program · 2026–2027 Undergraduate Calendar'}
          </p>
          <Link href="/map" className="cta-white" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-accent-ink)',
            color: 'var(--color-accent)',
            padding: 'var(--space-sm) var(--space-lg)',
            borderRadius: 'var(--radius-input)',
            textDecoration: 'none',
            fontSize: 'var(--text-md)',
            fontWeight: 700,
            transition: 'background var(--dur-short) var(--ease-out)',
            whiteSpace: 'nowrap',
          }}>
            Open course map →
          </Link>
        </div>
      </section>

      <div style={{ flex: 1 }} />

      {/* footer */}
      <footer style={{
        borderTop: '1px solid var(--color-rule)',
        padding: 'var(--space-lg)',
        background: 'var(--color-paper-2)',
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-xl)',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'var(--text-md)',
              letterSpacing: '-0.01em',
              color: 'var(--color-ink)',
              marginBottom: 6,
            }}>
              <span style={{ color: 'var(--color-accent)' }}>Carleton</span>CourseMap
            </div>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-ink-3)',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 280,
            }}>
              Not affiliated with or endorsed by Carleton University.
              Course data: 2026–2027 Undergraduate Calendar.
            </p>
          </div>

          <nav aria-label="Footer navigation" style={{
            display: 'flex',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingTop: 4,
          }}>
            {[
              { label: 'Home',              href: '/',                                                 ext: false },
              { label: 'Course Map',        href: '/map',                                              ext: false },
              { label: 'Official Calendar', href: 'https://calendar.carleton.ca',                     ext: true  },
              { label: 'GitHub',            href: 'https://github.com/zaidahmad16/CarletonCourseMap', ext: true  },
            ].map(({ label, href, ext }) => (
              <a
                key={label}
                href={href}
                className="footer-link"
                {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--color-ink-2)',
                  textDecoration: 'none',
                  transition: 'color var(--dur-short) var(--ease-out)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}{ext ? ' ↗' : ''}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}

// Stat

const Stat = ({ value, label, fixed }) => (
  <div style={{ textAlign: 'center', padding: 'var(--space-sm) 0' }}>
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      color: 'var(--color-accent)',
      lineHeight: 1,
      marginBottom: 6,
      letterSpacing: '-0.02em',
    }}>
      {fixed ? value : (value != null ? `${value.toLocaleString()}+` : '—')}
    </div>
    <div style={{
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      color: 'var(--color-ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    }}>
      {label}
    </div>
  </div>
)

// Step

const Step = ({ num, title, body }) => (
  <div style={{
    paddingTop: 'var(--space-md)',
    borderTop: '2px solid var(--color-rule)',
  }}>
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 700,
      color: 'var(--color-accent)',
      lineHeight: 1,
      marginBottom: 'var(--space-sm)',
      letterSpacing: '-0.02em',
    }}>
      {num}
    </div>
    <div style={{
      fontSize: 'var(--text-md)',
      fontWeight: 600,
      color: 'var(--color-ink)',
      marginBottom: 'var(--space-xs)',
      lineHeight: 1.3,
    }}>
      {title}
    </div>
    <div style={{
      fontSize: 'var(--text-sm)',
      color: 'var(--color-ink-2)',
      lineHeight: 1.65,
    }}>
      {body}
    </div>
  </div>
)

