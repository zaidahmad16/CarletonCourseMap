'use client'

import { useState, useEffect } from 'react'
import { API } from '../utils/constants'

export const CoursePanel = ({ node, onClose, isMobile }) => {
  const isOpen = node != null && !node.data?.isElective

  const { code, name, description, credit, prerequisites, offerings } =
    isOpen ? node.data : {}

  const [instructorData, setInstructorData] = useState(null)
  const [loadingInstructors, setLoadingInstructors] = useState(false)

  useEffect(() => {
    if (!isOpen || !code) {
      setInstructorData(null)
      return
    }
    const controller = new AbortController()
    const { signal } = controller

    setInstructorData(null)
    setLoadingInstructors(true)

    const encodedCode = code.replace(' ', '-')

    fetch(`${API}/courses/${encodedCode}/instructors`, { signal })
      .then(r => r.json())
      .then(async termGroups => {
        if (!termGroups.length) {
          setInstructorData([])
          setLoadingInstructors(false)
          return
        }
        const allNames = [...new Set(termGroups.flatMap(g => g.instructors))]
        const rmpMap = {}
        await Promise.all(allNames.map(async profName => {
          try {
            const res = await fetch(`/api/rmp?name=${encodeURIComponent(profName)}`, { signal })
            rmpMap[profName] = await res.json()
          } catch {
            rmpMap[profName] = { found: false }
          }
        }))
        if (signal.aborted) return
        const enriched = termGroups.map(g => ({
          term: g.term,
          instructors: g.instructors.map(n => ({ name: n, rmp: rmpMap[n] ?? { found: false } })),
        }))
        setInstructorData(enriched)
        setLoadingInstructors(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setInstructorData([])
        setLoadingInstructors(false)
      })

    return () => controller.abort()
  }, [code, isOpen])

  const panelStyle = isMobile
    ? isOpen
      ? {
          transform: 'translateY(0)',
          visibility: 'visible',
          pointerEvents: 'auto',
          transition: 'transform var(--dur-medium) var(--ease-out)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        }
      : {
          transform: 'translateY(100%)',
          visibility: 'hidden',
          pointerEvents: 'none',
          transition: 'transform var(--dur-medium) var(--ease-out), visibility 0s linear 280ms',
          boxShadow: 'none',
        }
    : isOpen
      ? {
          transform: 'translateX(0)',
          visibility: 'visible',
          pointerEvents: 'auto',
          transition: 'transform var(--dur-medium) var(--ease-out)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        }
      : {
          transform: 'translateX(100%)',
          visibility: 'hidden',
          pointerEvents: 'none',
          transition: 'transform var(--dur-medium) var(--ease-out), visibility 0s linear 280ms',
          boxShadow: 'none',
        }

  const panelPosition = isMobile
    ? {
        bottom: 0, left: 0, right: 0,
        width: '100%',
        height: '75vh',
        borderRadius: '12px 12px 0 0',
        borderTop: '1px solid var(--color-rule)',
      }
    : {
        right: 0, top: 0,
        width: 340,
        height: '100vh',
        borderLeft: '1px solid var(--color-rule)',
      }

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 19,
            ...(isMobile && { background: 'rgba(0,0,0,0.18)' }),
          }}
        />
      )}
      <div
        aria-hidden={!isOpen}
        style={{
          position: 'fixed',
          background: 'var(--color-paper)',
          overflowY: 'auto',
          zIndex: 20,
          fontFamily: 'var(--font-body)',
          ...panelPosition,
          ...panelStyle,
        }}
      >
        {/* drag handle, mobile only */}
        {isMobile && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 0 4px',
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 4,
              borderRadius: 2,
              background: 'var(--color-rule)',
            }} />
          </div>
        )}

        {/* header */}
        <div style={{
          background: 'var(--color-paper-2)',
          borderBottom: '1px solid var(--color-rule)',
          padding: '20px var(--space-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: 'var(--space-sm)' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'var(--text-xl)',
              color: 'var(--color-accent)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}>
              {code}
            </div>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-ink-2)',
              marginTop: 4,
              lineHeight: 1.4,
            }}>
              {name}
            </div>
          </div>

          <button
            onClick={onClose}
            tabIndex={isOpen ? 0 : -1}
            aria-label="Close panel"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-ink-3)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              flexShrink: 0,
              transition: 'color var(--dur-short) var(--ease-out)',
            }}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div style={{ padding: 'var(--space-md)' }}>

          {/* credits and offerings */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-2xs)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-md)',
          }}>
            {credit != null && (
              <span style={chipStyle}>
                {credit} credit{credit !== 1 ? 's' : ''}
              </span>
            )}
            {offerings && (
              <span style={chipStyle}>{offerings}</span>
            )}
          </div>

          {/* Description */}
          {description && (
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <SectionLabel>Description</SectionLabel>
              <div style={bodyText}>{description}</div>
            </div>
          )}

          {/* Prerequisites */}
          {prerequisites && (
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <SectionLabel>Prerequisites</SectionLabel>
              <div style={bodyText}>{prerequisites}</div>
            </div>
          )}

          {/* Instructors */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <SectionLabel>Instructors (2026–2027)</SectionLabel>
            {loadingInstructors && (
              <div style={{ ...bodyText, color: 'var(--color-ink-3)' }}>Loading…</div>
            )}
            {!loadingInstructors && instructorData && instructorData.length === 0 && (
              <div style={{ ...bodyText, color: 'var(--color-ink-3)' }}>No timetable data yet</div>
            )}
            {!loadingInstructors && instructorData && instructorData.map(group => (
              <div key={group.term} style={{ marginBottom: 'var(--space-sm)' }}>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--color-ink-3)',
                  marginBottom: 6,
                }}>
                  {group.term}
                </div>
                {group.instructors.map(({ name: profName, rmp }) => (
                  <ProfCard key={profName} name={profName} rmp={rmp} />
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}

const ProfCard = ({ name, rmp }) => (
  <div style={{
    background: 'var(--color-paper-2)',
    border: '1px solid var(--color-rule)',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      <span style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--color-ink)',
        lineHeight: 1.3,
      }}>
        {name}
      </span>
      {rmp?.found && (
        <a
          href={rmp.rmp_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-accent)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          RMP ↗
        </a>
      )}
    </div>

    {rmp?.found ? (
      <div style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        marginTop: 6,
        flexWrap: 'wrap',
      }}>
        <RmpStat label="Rating" value={rmp.overall_rating?.toFixed(1)} outOf={5} color={ratingColor(rmp.overall_rating)} />
        <RmpStat label="Difficulty" value={rmp.difficulty?.toFixed(1)} outOf={5} color={difficultyColor(rmp.difficulty)} />
        {rmp.would_take_again != null && (
          <RmpStat label="Take again" value={`${rmp.would_take_again}%`} />
        )}
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-ink-3)',
          alignSelf: 'flex-end',
        }}>
          {rmp.num_ratings} rating{rmp.num_ratings !== 1 ? 's' : ''}
        </span>
      </div>
    ) : (
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-ink-3)',
        marginTop: 4,
      }}>
        Not on RateMyProfessors
      </div>
    )}
  </div>
)

const RmpStat = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>{label}</span>
    <span style={{
      fontSize: 'var(--text-sm)',
      fontWeight: 700,
      color: color ?? 'var(--color-ink)',
    }}>
      {value ?? 'N/A'}
    </span>
  </div>
)

function ratingColor(r) {
  if (r == null) return 'var(--color-ink)'
  if (r >= 4) return '#2d9e5f'
  if (r >= 3) return '#d97706'
  return '#dc2626'
}

function difficultyColor(d) {
  if (d == null) return 'var(--color-ink)'
  if (d <= 2.5) return '#2d9e5f'
  if (d <= 3.5) return '#d97706'
  return '#dc2626'
}

const chipStyle = {
  background: 'var(--color-paper-2)',
  border: '1px solid var(--color-rule)',
  padding: '3px var(--space-xs)',
  borderRadius: 'var(--radius-input)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--color-ink-2)',
}

const bodyText = {
  fontSize: 'var(--text-sm)',
  lineHeight: 1.7,
  color: 'var(--color-ink-2)',
}

const SectionLabel = ({ children }) => (
  <div style={{
    fontWeight: 600,
    fontSize: 'var(--text-xs)',
    color: 'var(--color-ink-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 'var(--space-2xs)',
  }}>
    {children}
  </div>
)
