/* notes panel with a tab toggle, slides in from the right */

import { useState } from 'react'

export const Notes = ({ notes = [], degree, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const open    = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <>
      {/* toggle tab */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? 'Close notes panel' : 'Open notes panel'}
        style={{
          position: 'fixed',
          right: open ? 320 : 0,
          top: 100,
          zIndex: 10,
          background: 'var(--color-accent)',
          color: 'var(--color-accent-ink)',
          border: 'none',
          padding: '10px 12px',
          borderRadius: '4px 0 0 4px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          fontFamily: 'var(--font-body)',
          transition: 'right var(--dur-medium) var(--ease-out)',
          writingMode: open ? 'horizontal-tb' : 'vertical-rl',
          userSelect: 'none',
        }}
      >
        {open ? '✕ Close' : 'Notes'}
      </button>

      {/* notes panel */}
      <div
        role="complementary"
        aria-label="Program notes"
        style={{
          position: 'fixed',
          right: open ? 0 : -320,
          top: 0,
          width: 320,
          height: '100vh',
          background: 'var(--color-paper)',
          borderLeft: '1px solid var(--color-rule)',
          overflowY: 'auto',
          zIndex: 9,
          transition: 'right var(--dur-medium) var(--ease-out)',
          fontFamily: 'var(--font-body)',
          boxShadow: open ? '-4px 0 20px rgba(0,0,0,0.07)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'var(--color-paper-2)',
          borderBottom: '1px solid var(--color-rule)',
          padding: '16px var(--space-md)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'var(--text-md)',
          color: 'var(--color-ink)',
          letterSpacing: '-0.01em',
        }}>
          Notes
        </div>

        <div style={{ padding: 'var(--space-md)' }}>

          <NotesSection title="Prerequisites & Year Standing">
            <p style={prose}>
              Course prerequisites are shown as arrows between courses in this map. Year standing requirements (2nd, 3rd, or 4th year) appear above the relevant course box.
            </p>
          </NotesSection>

          <NotesSection title="Disclaimer">
            <p style={prose}>
              Course data reflects the <strong>2026–2027</strong> Undergraduate Calendar. Always verify with the official Carleton University calendar before enrolling.
            </p>
            <p style={{ ...prose, color: 'var(--color-ink-3)', marginTop: 8 }}>
              Not affiliated with or endorsed by Carleton University.
            </p>
          </NotesSection>

          {notes.length > 0 && (
            <NotesSection title="Program Notes">
              {notes.map((note, i) => (
                <div key={i} style={{
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.7,
                  color: 'var(--color-ink-2)',
                  marginBottom: 'var(--space-xs)',
                  display: 'flex',
                  gap: 'var(--space-2xs)',
                }}>
                  <span style={{
                    fontWeight: 700,
                    color: 'var(--color-accent)',
                    flexShrink: 0,
                  }}>
                    ({String.fromCharCode(97 + i)})
                  </span>
                  <span>{note && typeof note === 'object' ? note.text : note}</span>
                </div>
              ))}
            </NotesSection>
          )}

        </div>
      </div>
    </>
  )
}

const prose = {
  fontSize: 'var(--text-xs)',
  lineHeight: 1.7,
  color: 'var(--color-ink-2)',
  margin: 0,
}

const NotesSection = ({ title, children }) => (
  <div style={{ marginBottom: 'var(--space-md)' }}>
    <div style={{
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      color: 'var(--color-ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      marginBottom: 'var(--space-xs)',
      paddingBottom: 'var(--space-2xs)',
      borderBottom: '1px solid var(--color-rule)',
    }}>
      {title}
    </div>
    {children}
  </div>
)
