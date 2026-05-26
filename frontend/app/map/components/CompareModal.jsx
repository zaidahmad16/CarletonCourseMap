'use client'

import { useState, useEffect, useCallback } from 'react'
import { API } from '../utils/constants'

// ── helpers ────────────────────────────────────────────────────────────────────

const getCodes = (map) => new Set(
  (map?.requirements || []).filter(r => r.courses?.length).flatMap(r => r.courses)
)

// build code → course name from the requirement descriptions (single-course reqs only)
const getNameMap = (map) => {
  const m = {}
  for (const req of (map?.requirements || [])) {
    if (req.courses?.length === 1 && req.description)
      m[req.courses[0]] = req.description
  }
  return m
}

const totalCredits = (map) =>
  (map?.requirements || []).reduce((s, r) => s + (r.credits ?? 0), 0)

const pct = (a, b) => {
  const union = new Set([...a, ...b]).size
  if (!union) return 0
  return Math.round((new Set([...a].filter(c => b.has(c))).size / union) * 100)
}

// ── CompareModal ───────────────────────────────────────────────────────────────

export const CompareModal = ({ open, onClose, departments }) => {
  const [deptA,     setDeptA]     = useState('')
  const [deptB,     setDeptB]     = useState('')
  const [progsA,    setProgsA]    = useState([])
  const [progsB,    setProgsB]    = useState([])
  const [progIdA,   setProgIdA]   = useState('')
  const [progIdB,   setProgIdB]   = useState('')
  const [mapA,      setMapA]      = useState(null)
  const [mapB,      setMapB]      = useState(null)
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (!open) return
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!deptA) { setProgsA([]); setProgIdA(''); setMapA(null); return }
    setProgIdA(''); setMapA(null)
    fetch(`${API}/programs?dept=${deptA}`).then(r => r.json()).then(setProgsA)
  }, [deptA])

  useEffect(() => {
    if (!deptB) { setProgsB([]); setProgIdB(''); setMapB(null); return }
    setProgIdB(''); setMapB(null)
    fetch(`${API}/programs?dept=${deptB}`).then(r => r.json()).then(setProgsB)
  }, [deptB])

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

  const swap = useCallback(() => {
    setDeptA(deptB);   setDeptB(deptA)
    setProgIdA(progIdB); setProgIdB(progIdA)
    setProgsA(progsB); setProgsB(progsA)
    setMapA(mapB);     setMapB(mapA)
  }, [deptA, deptB, progIdA, progIdB, progsA, progsB, mapA, mapB])

  if (!open) return null

  const codesA  = getCodes(mapA)
  const codesB  = getCodes(mapB)
  const namesA  = getNameMap(mapA)
  const namesB  = getNameMap(mapB)
  const nameMap = { ...namesB, ...namesA }

  const onlyA  = mapA ? [...codesA].filter(c => !codesB.has(c)) : []
  const inBoth = mapA ? [...codesA].filter(c =>  codesB.has(c)) : []
  const onlyB  = mapB ? [...codesB].filter(c => !codesA.has(c)) : []
  const hasDiff = mapA && mapB && !loading
  const overlap = hasDiff ? pct(codesA, codesB) : null

  const credA = hasDiff ? totalCredits(mapA).toFixed(1) : null
  const credB = hasDiff ? totalCredits(mapB).toFixed(1) : null

  const bothSelected = progIdA && progIdB

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
            width: 'min(800px, 100%)',
            maxHeight: 'min(700px, calc(100vh - 32px))',
            background: 'var(--color-paper)',
            borderRadius: 10,
            border: '1px solid var(--color-rule)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ height: 3, background: 'var(--color-accent)', flexShrink: 0 }} />

          {/* ── Header ── */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-rule)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 'var(--text-md)', color: 'var(--color-ink)', letterSpacing: '-0.01em',
              }}>
                Compare programs
              </span>
              {overlap !== null && (
                <span style={{
                  background: overlap >= 50 ? 'var(--color-accent-soft)' : 'var(--color-paper-2)',
                  color: overlap >= 50 ? 'var(--color-accent)' : 'var(--color-ink-3)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '2px 10px',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {overlap}% overlap
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-3)', fontSize: 18, lineHeight: 1, padding: 4 }}
            >×</button>
          </div>

          {/* ── Selectors ── */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-rule)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'end' }}>

              {/* Program A */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SelectField
                  label="Department A"
                  value={deptA}
                  onChange={setDeptA}
                  options={[{ value: '', label: 'Select department…' }, ...departments.map(d => ({ value: String(d.dept_id), label: d.name }))]}
                />
                {deptA && (
                  <SelectField
                    label="Program A"
                    value={progIdA}
                    onChange={setProgIdA}
                    options={[{ value: '', label: 'Select program…' }, ...progsA.map(p => ({ value: String(p.program_id), label: p.degree }))]}
                  />
                )}
              </div>

              {/* Swap button */}
              <button
                onClick={swap}
                disabled={!deptA && !deptB}
                title="Swap A and B"
                style={{
                  background: 'none', border: '1px solid var(--color-rule)',
                  borderRadius: 'var(--radius-input)', cursor: 'pointer',
                  color: 'var(--color-ink-2)', fontSize: 16, padding: '6px 10px',
                  lineHeight: 1, alignSelf: 'flex-end', marginBottom: 1,
                  transition: 'border-color var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out)',
                  opacity: (!deptA && !deptB) ? 0.35 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rule)'; e.currentTarget.style.color = 'var(--color-ink-2)' }}
              >
                ⇄
              </button>

              {/* Program B */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SelectField
                  label="Department B"
                  value={deptB}
                  onChange={setDeptB}
                  options={[{ value: '', label: 'Select department…' }, ...departments.map(d => ({ value: String(d.dept_id), label: d.name }))]}
                />
                {deptB && (
                  <SelectField
                    label="Program B"
                    value={progIdB}
                    onChange={setProgIdB}
                    options={[{ value: '', label: 'Select program…' }, ...progsB.map(p => ({ value: String(p.program_id), label: p.degree }))]}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Diff body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {!deptA && !deptB && <Placeholder text="Select two programs to compare" />}
            {(deptA || deptB) && !bothSelected && !loading && <Placeholder text="Select both programs to see the comparison" />}
            {loading && <Placeholder text="Loading…" />}
            {hasDiff && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--color-rule)', borderRadius: 6, overflow: 'hidden' }}>
                <DiffCol
                  title="Only in A"
                  subtitle={mapA.degree}
                  credits={credA}
                  codes={onlyA}
                  nameMap={nameMap}
                  accent="var(--color-science)"
                  bg="var(--color-science-bg)"
                />
                <DiffCol
                  title={`${inBoth.length} shared`}
                  subtitle="In both programs"
                  codes={inBoth}
                  nameMap={nameMap}
                  accent="var(--color-ink-2)"
                  bg="var(--color-paper-3)"
                  center
                />
                <DiffCol
                  title="Only in B"
                  subtitle={mapB.degree}
                  credits={credB}
                  codes={onlyB}
                  nameMap={nameMap}
                  accent="var(--color-complementary)"
                  bg="var(--color-complementary-bg)"
                />
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          {hasDiff && (
            <div style={{
              borderTop: '1px solid var(--color-rule)',
              padding: '8px 16px',
              background: 'var(--color-paper-2)',
              flexShrink: 0,
              display: 'flex', gap: 16, alignItems: 'center',
              fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)',
            }}>
              <span style={{ color: 'var(--color-science)', fontWeight: 600 }}>{onlyA.length} unique to A</span>
              <span>·</span>
              <span>{inBoth.length} shared</span>
              <span>·</span>
              <span style={{ color: 'var(--color-complementary)', fontWeight: 600 }}>{onlyB.length} unique to B</span>
              <span style={{ marginLeft: 'auto' }}>
                A: {credA} cr · B: {credB} cr
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── DiffCol ───────────────────────────────────────────────────────────────────

const DiffCol = ({ title, subtitle, credits, codes, nameMap, accent, bg, center }) => (
  <div style={{ background: 'var(--color-paper)', padding: '12px 12px 16px' }}>
    {/* column header */}
    <div style={{ marginBottom: 10, textAlign: center ? 'center' : 'left' }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 10, color: 'var(--color-ink-3)', lineHeight: 1.4, marginTop: 3,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={subtitle}>
        {subtitle}
      </div>
      {credits && (
        <div style={{ fontSize: 10, color: accent, marginTop: 2, fontWeight: 600 }}>
          {credits} credits total
        </div>
      )}
    </div>

    {/* divider */}
    <div style={{ height: 1, background: 'var(--color-rule)', marginBottom: 10 }} />

    {codes.length === 0
      ? <div style={{ fontSize: 11, color: 'var(--color-ink-3)', fontStyle: 'italic', textAlign: center ? 'center' : 'left' }}>None</div>
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {codes.map(code => (
            <div key={code} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <span style={{
                background: bg, color: accent,
                borderRadius: 3, padding: '2px 6px',
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                letterSpacing: '0.02em', flexShrink: 0, lineHeight: 1.6,
              }}>
                {code}
              </span>
              {nameMap[code] && (
                <span style={{
                  fontSize: 11, color: 'var(--color-ink-2)', lineHeight: 1.4,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {nameMap[code]}
                </span>
              )}
            </div>
          ))}
        </div>
      )
    }
  </div>
)

// ── SelectField ───────────────────────────────────────────────────────────────

const SelectField = ({ label, value, onChange, options }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-input)',
          padding: '6px 28px 6px 10px', fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          color: value ? 'var(--color-ink)' : 'var(--color-ink-3)',
          background: 'var(--color-paper-2)', cursor: 'pointer', outline: 'none', width: '100%',
          transition: 'border-color var(--dur-short) var(--ease-out)',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--color-accent)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--color-rule)' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"
        style={{ position: 'absolute', right: 9, pointerEvents: 'none', color: 'var(--color-ink-3)' }}>
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
)

// ── Placeholder ───────────────────────────────────────────────────────────────

const Placeholder = ({ text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 140, color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)',
  }}>
    {text}
  </div>
)
