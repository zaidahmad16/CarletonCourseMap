/* Hallmark · component: CompareModal · genre: modern-minimal · theme: custom (Carleton)
 * states: closed · selecting · loading · ready (3-col diff)
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 */

'use client'

import { useState, useEffect } from 'react'
import { API } from '../utils/constants'

const getCourses = (map) => new Set(
  (map?.requirements || [])
    .filter(r => r.courses?.length > 0)
    .flatMap(r => r.courses)
)

export const CompareModal = ({ open, onClose, departments }) => {
  const [deptId,   setDeptId]   = useState('')
  const [progIdA,  setProgIdA]  = useState('')
  const [progIdB,  setProgIdB]  = useState('')
  const [programs, setPrograms] = useState([])
  const [mapA,     setMapA]     = useState(null)
  const [mapB,     setMapB]     = useState(null)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!deptId) { setPrograms([]); setProgIdA(''); setProgIdB(''); return }
    setPrograms([])
    setProgIdA('')
    setProgIdB('')
    setMapA(null)
    setMapB(null)
    fetch(`${API}/programs?dept=${deptId}`).then(r => r.json()).then(setPrograms)
  }, [deptId])

  useEffect(() => {
    if (!progIdA || !progIdB) { setMapA(null); setMapB(null); return }
    setLoading(true)
    Promise.all([
      fetch(`${API}/programs/${progIdA}`).then(r => r.json()),
      fetch(`${API}/programs/${progIdB}`).then(r => r.json()),
    ])
      .then(([a, b]) => { setMapA(a); setMapB(b); setLoading(false) })
      .catch(() => setLoading(false))
  }, [progIdA, progIdB])

  useEffect(() => {
    if (!open) return
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const codesA  = getCourses(mapA)
  const codesB  = getCourses(mapB)
  const onlyA   = mapA ? [...codesA].filter(c => !codesB.has(c)) : []
  const inBoth  = mapA ? [...codesA].filter(c =>  codesB.has(c)) : []
  const onlyB   = mapB ? [...codesB].filter(c => !codesA.has(c)) : []
  const hasDiff = mapA && mapB && !loading

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.32)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          animation: 'backdrop-in 180ms var(--ease-out) both',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 51,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, pointerEvents: 'none',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Compare programs"
          style={{
            pointerEvents: 'auto',
            width: 'min(680px, 100%)',
            maxHeight: 'min(640px, calc(100vh - 32px))',
            background: 'var(--color-paper)',
            borderRadius: 10,
            border: '1px solid var(--color-rule)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-body)',
            animation: 'picker-in 200ms var(--ease-out) both',
          }}
        >
          <div style={{ height: 3, background: 'var(--color-accent)', flexShrink: 0 }} />

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-rule)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'var(--text-md)',
              color: 'var(--color-ink)',
              letterSpacing: '-0.01em',
            }}>
              Compare programs
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-ink-3)', fontSize: 18, lineHeight: 1, padding: 4,
              }}
            >×</button>
          </div>

          {/* ── Selectors ───────────────────────────────────────────────────── */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-rule)',
            flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <SelectField
              label="Department"
              value={deptId}
              onChange={setDeptId}
              options={[
                { value: '', label: 'Select department…' },
                ...departments.map(d => ({ value: String(d.dept_id), label: d.name })),
              ]}
            />

            {deptId && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 10,
                alignItems: 'end',
              }}>
                <SelectField
                  label="Program A"
                  value={progIdA}
                  onChange={setProgIdA}
                  options={[
                    { value: '', label: 'Select…' },
                    ...programs.map(p => ({ value: String(p.program_id), label: p.degree })),
                  ]}
                />
                <span style={{
                  color: 'var(--color-ink-3)', fontWeight: 600,
                  fontSize: 'var(--text-sm)', userSelect: 'none',
                  paddingBottom: 6,
                }}>vs</span>
                <SelectField
                  label="Program B"
                  value={progIdB}
                  onChange={setProgIdB}
                  options={[
                    { value: '', label: 'Select…' },
                    ...programs.map(p => ({ value: String(p.program_id), label: p.degree })),
                  ]}
                />
              </div>
            )}
          </div>

          {/* ── Diff body ───────────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {!deptId && <Placeholder text="Select a department to begin" />}
            {deptId && (!progIdA || !progIdB) && <Placeholder text="Select two programs to compare" />}
            {loading && <Placeholder text="Loading…" />}
            {hasDiff && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <DiffCol
                  title="Only in A"
                  subtitle={mapA.degree}
                  codes={onlyA}
                  accent="var(--color-science)"
                  bg="var(--color-science-bg)"
                />
                <DiffCol
                  title="In both"
                  subtitle={`${inBoth.length} shared`}
                  codes={inBoth}
                  accent="var(--color-ink-3)"
                  bg="var(--color-paper-2)"
                />
                <DiffCol
                  title="Only in B"
                  subtitle={mapB.degree}
                  codes={onlyB}
                  accent="var(--color-complementary)"
                  bg="var(--color-complementary-bg)"
                />
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          {hasDiff && (
            <div style={{
              borderTop: '1px solid var(--color-rule)',
              padding: '8px 16px',
              background: 'var(--color-paper-2)',
              flexShrink: 0,
              display: 'flex', gap: 12,
              fontSize: 'var(--text-xs)',
              color: 'var(--color-ink-3)',
            }}>
              <span>{onlyA.length} unique to A</span>
              <span>·</span>
              <span>{inBoth.length} shared</span>
              <span>·</span>
              <span>{onlyB.length} unique to B</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── SelectField ────────────────────────────────────────────────────────────────

const SelectField = ({ label, value, onChange, options }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{
      fontSize: 10, fontWeight: 600, color: 'var(--color-ink-3)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {label}
    </span>
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          border: '1px solid var(--color-rule)',
          borderRadius: 'var(--radius-input)',
          padding: '6px 28px 6px 10px',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          color: value ? 'var(--color-ink)' : 'var(--color-ink-3)',
          background: 'var(--color-paper-2)',
          cursor: 'pointer', outline: 'none', width: '100%',
          transition: 'border-color var(--dur-short) var(--ease-out)',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--color-accent)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--color-rule)' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"
        style={{ position: 'absolute', right: 9, pointerEvents: 'none', color: 'var(--color-ink-3)' }}>
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
)

// ── DiffCol ────────────────────────────────────────────────────────────────────

const DiffCol = ({ title, subtitle, codes, accent, bg }) => (
  <div>
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 'var(--text-xs)', fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 10, color: 'var(--color-ink-3)', lineHeight: 1.4, marginTop: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={subtitle}>
        {subtitle}
      </div>
    </div>
    {codes.length === 0
      ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)', fontStyle: 'italic' }}>None</div>
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {codes.map(code => (
            <span key={code} style={{
              display: 'inline-block',
              background: bg,
              color: accent,
              borderRadius: 'var(--radius-input)',
              padding: '3px 8px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}>
              {code}
            </span>
          ))}
        </div>
      )
    }
  </div>
)

// ── Placeholder ────────────────────────────────────────────────────────────────

const Placeholder = ({ text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 120,
    color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)',
  }}>
    {text}
  </div>
)
