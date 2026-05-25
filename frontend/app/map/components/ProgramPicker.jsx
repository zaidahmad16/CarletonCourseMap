/* Hallmark · component: ProgramPicker · genre: modern-minimal · theme: custom (Carleton)
 * states: closed (unmounted) · open (backdrop + dialog animate in)
 * centering: flex overlay — most reliable across zoom levels, avoids inset/margin-auto height-fit-content bug
 */

import { useState, useEffect, useRef } from 'react'

// ── Degree abbreviation helper ─────────────────────────────────────────────────

const abbrev = (degree = '') => {
  const d = degree.toLowerCase()
  if (d.includes('engineering'))       return 'B.Eng.'
  if (d.includes('computer science'))  return 'B.C.S.'
  if (d.includes('science'))           return 'B.Sc.'
  if (d.includes('arts'))              return 'B.A.'
  if (d.includes('commerce'))          return 'B.Com.'
  if (d.includes('music'))             return 'B.Mus.'
  if (d.includes('journalism'))        return 'B.J.'
  if (d.includes('social work'))       return 'B.S.W.'
  if (d.includes('health'))            return 'B.H.S.'
  if (d.includes('law'))               return 'LL.B.'
  if (d.includes('education'))         return 'B.Ed.'
  if (d.includes('architecture'))      return 'B.Arch.'
  if (d.includes('information'))       return 'B.I.T.'
  if (d.includes('public'))            return 'B.P.A.'
  // strip "Bachelor of" / "Honours Bachelor of"
  const m = degree.match(/bachelor\s+of\s+(.+)/i)
  if (m) {
    return m[1].split(' ').map(w => w[0].toUpperCase() + '.').join('')
  }
  return degree.slice(0, 4).toUpperCase()
}

const abbrevColor = (ab = '') => {
  if (ab.startsWith('B.Eng'))  return { bg: 'oklch(97% 0.012 144)', fg: 'oklch(38% 0.14 144)' }
  if (ab.startsWith('B.Sc'))   return { bg: 'oklch(97% 0.012 220)', fg: 'oklch(40% 0.12 220)' }
  if (ab.startsWith('B.C.S'))  return { bg: 'oklch(97% 0.018 26)',  fg: 'oklch(49.5% 0.222 26)' }
  if (ab.startsWith('B.A'))    return { bg: 'oklch(97% 0.012 50)',  fg: 'oklch(46% 0.14 50)' }
  if (ab.startsWith('B.Com'))  return { bg: 'oklch(97% 0.012 290)', fg: 'oklch(42% 0.12 290)' }
  return                               { bg: 'var(--color-paper-2)', fg: 'var(--color-ink-2)' }
}

// ── Component ──────────────────────────────────────────────────────────────────

export const ProgramPicker = ({
  open,
  onClose,
  departments,
  programs,
  selectedDept,
  selectedProgram,
  onDeptSelect,
  onProgramSelect,
}) => {
  const [view, setView]     = useState('depts')
  const [search, setSearch] = useState('')
  const searchRef           = useRef(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      setView(selectedDept ? 'programs' : 'depts')
      const t = setTimeout(() => searchRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const currentDept      = departments.find(d => String(d.dept_id) === String(selectedDept))
  const filteredDepts    = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
  const filteredPrograms = programs.filter(p => p.degree.toLowerCase().includes(search.toLowerCase()))

  const handleDeptClick = (deptId) => {
    onDeptSelect(deptId)
    setView('programs')
    setSearch('')
  }

  const handleProgramClick = (programId) => {
    onProgramSelect(programId)
    onClose()
  }

  const handleBack = () => {
    setView('depts')
    setSearch('')
  }

  const isEmpty = view === 'depts'
    ? filteredDepts.length === 0
    : programs.length > 0 && filteredPrograms.length === 0

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.32)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          animation: 'backdrop-in 180ms var(--ease-out) both',
        }}
      />

      {/* ── Flex overlay for reliable centering at any zoom ───────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 51,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          pointerEvents: 'none',
        }}
      >
        {/* ── Dialog ──────────────────────────────────────────────────────── */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select your program"
          style={{
            pointerEvents: 'auto',
            width: 'min(520px, 100%)',
            maxHeight: 'min(580px, calc(100vh - 32px))',
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
          {/* Red accent bar */}
          <div style={{ height: 3, background: 'var(--color-accent)', flexShrink: 0 }} />

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderBottom: '1px solid var(--color-rule)',
            flexShrink: 0,
          }}>
            {view === 'programs' && currentDept && (
              <button
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 0 var(--space-xs) 0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.02em',
                }}
              >
                ← {currentDept.name}
              </button>
            )}

            <div style={{ position: 'relative' }}>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                style={{
                  position: 'absolute', left: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-ink-3)', pointerEvents: 'none',
                }}
              >
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={view === 'depts' ? 'Search departments…' : 'Search programs…'}
                aria-label={view === 'depts' ? 'Search departments' : 'Search programs'}
                style={{
                  width: '100%',
                  border: '1.5px solid var(--color-rule)',
                  borderRadius: 'var(--radius-input)',
                  padding: 'var(--space-xs) var(--space-sm) var(--space-xs) 32px',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-body)',
                  background: 'var(--color-paper-2)',
                  color: 'var(--color-ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color var(--dur-short) var(--ease-out)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--color-accent)'
                  e.target.style.background  = 'var(--color-paper)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--color-rule)'
                  e.target.style.background  = 'var(--color-paper-2)'
                }}
              />
            </div>
          </div>

          {/* ── List / Grid ───────────────────────────────────────────────── */}
          <div style={{ overflowY: 'auto', flex: 1 }}>

            {/* Loading */}
            {view === 'programs' && programs.length === 0 && (
              <div style={emptyStyle}>Loading programs…</div>
            )}

            {/* Empty search */}
            {isEmpty && (
              <div style={emptyStyle}>
                No results for <strong style={{ color: 'var(--color-ink-2)' }}>"{search}"</strong>
              </div>
            )}

            {/* ── Department rows (compact list) ──────────────────────────── */}
            {view === 'depts' && !isEmpty && filteredDepts.map(dept => {
              const isActive = String(dept.dept_id) === String(selectedDept)
              return (
                <PickerRow
                  key={dept.dept_id}
                  label={dept.name}
                  isActive={isActive}
                  trailingIcon="→"
                  onClick={() => handleDeptClick(dept.dept_id)}
                />
              )
            })}

            {/* ── Program cards (2-col grid) ───────────────────────────────── */}
            {view === 'programs' && !isEmpty && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                padding: 'var(--space-sm) var(--space-md)',
              }}>
                {filteredPrograms.map(prog => {
                  const isActive = String(prog.program_id) === String(selectedProgram)
                  const ab       = abbrev(prog.degree)
                  const colors   = abbrevColor(ab)
                  return (
                    <ProgramCard
                      key={prog.program_id}
                      degree={prog.degree}
                      abbrev={ab}
                      colors={colors}
                      isActive={isActive}
                      onClick={() => handleProgramClick(prog.program_id)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div style={{
            borderTop: '1px solid var(--color-rule)',
            padding: 'var(--space-xs) var(--space-md)',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-paper-2)',
          }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>
              {view === 'depts'
                ? `${filteredDepts.length} department${filteredDepts.length !== 1 ? 's' : ''}`
                : `${filteredPrograms.length} program${filteredPrograms.length !== 1 ? 's' : ''}`
              }
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>esc to close</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Department row ─────────────────────────────────────────────────────────────

const PickerRow = ({ label, isActive, trailingIcon, onClick }) => (
  <button
    role="option"
    aria-selected={isActive}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      background: isActive ? 'var(--color-accent-soft)' : 'transparent',
      border: 'none',
      borderBottom: '1px solid var(--color-rule)',
      padding: 'var(--space-sm) var(--space-md)',
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: isActive ? 'var(--color-accent)' : 'var(--color-ink)',
      fontWeight: isActive ? 600 : 400,
      lineHeight: 1.45,
      transition: 'background var(--dur-short) var(--ease-out)',
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-paper-2)' }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
  >
    <span style={{
      flex: 1, minWidth: 0,
      overflow: 'hidden', textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      paddingRight: 'var(--space-xs)',
    }}>
      {label}
    </span>
    {trailingIcon && (
      <span style={{ color: 'var(--color-ink-3)', fontSize: 13, flexShrink: 0 }}>{trailingIcon}</span>
    )}
  </button>
)

// ── Program card ───────────────────────────────────────────────────────────────

const ProgramCard = ({ degree, abbrev: ab, colors, isActive, onClick }) => (
  <button
    role="option"
    aria-selected={isActive}
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
      background: isActive ? 'var(--color-accent-soft)' : 'var(--color-paper)',
      border: isActive
        ? '1.5px solid var(--color-accent)'
        : '1.5px solid var(--color-rule)',
      borderRadius: 8,
      padding: '12px 14px',
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      transition: 'border-color var(--dur-short) var(--ease-out), background var(--dur-short) var(--ease-out)',
      width: '100%',
    }}
    onMouseEnter={e => {
      if (!isActive) {
        e.currentTarget.style.borderColor = 'var(--color-accent)'
        e.currentTarget.style.background  = 'var(--color-accent-soft)'
      }
    }}
    onMouseLeave={e => {
      if (!isActive) {
        e.currentTarget.style.borderColor = 'var(--color-rule)'
        e.currentTarget.style.background  = 'var(--color-paper)'
      }
    }}
  >
    {/* Degree type badge */}
    <span style={{
      display: 'inline-block',
      background: colors.bg,
      color: colors.fg,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      padding: '2px 7px',
      borderRadius: 4,
      fontFamily: 'var(--font-mono)',
      lineHeight: 1.6,
    }}>
      {ab}
    </span>

    {/* Degree name */}
    <span style={{
      fontSize: 'var(--text-xs)',
      lineHeight: 1.45,
      color: isActive ? 'var(--color-accent)' : 'var(--color-ink)',
      fontWeight: isActive ? 600 : 400,
    }}>
      {degree}
    </span>

    {/* Active checkmark */}
    {isActive && (
      <span style={{
        alignSelf: 'flex-end',
        color: 'var(--color-accent)',
        fontSize: 12,
        fontWeight: 700,
        marginTop: 'auto',
      }}>
        ✓ Selected
      </span>
    )}
  </button>
)

const emptyStyle = {
  padding: 'var(--space-xl) var(--space-md)',
  textAlign: 'center',
  color: 'var(--color-ink-3)',
  fontSize: 'var(--text-sm)',
}
