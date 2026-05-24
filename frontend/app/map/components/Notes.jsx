import { useState } from 'react'

export const Notes = ({ notes = [], degree }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          right: open ? 320 : 0,
          top: 100,
          zIndex: 10,
          background: '#1a1a2e',
          color: '#fff',
          border: 'none',
          padding: '10px 14px',
          borderRadius: '4px 0 0 4px',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
          fontFamily: 'Arial, sans-serif',
          transition: 'right 0.2s ease',
          writingMode: open ? 'horizontal-tb' : 'vertical-rl',
        }}
      >
        {open ? '✕ Close' : 'Notes'}
      </button>

      {/* Notes panel */}
      <div style={{
        position: 'fixed',
        right: open ? 0 : -320,
        top: 0,
        width: 320,
        height: '100vh',
        background: '#fff',
        borderLeft: '2px solid #e2e8f0',
        overflowY: 'auto',
        zIndex: 9,
        transition: 'right 0.2s ease',
        fontFamily: 'Arial, sans-serif',
        boxShadow: open ? '-4px 0 12px rgba(0,0,0,0.08)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          background: '#1a1a2e',
          color: '#fff',
          padding: '14px 18px',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1,
        }}>
          Notes
        </div>

        <div style={{ padding: '16px 18px' }}>
          {/* Prerequisites section */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontWeight: 700, fontSize: 12, marginBottom: 8,
              borderBottom: '1px solid #e2e8f0', paddingBottom: 6,
            }}>
              Course Prerequisites and Year Standing Requirements
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#444', margin: '0 0 8px 0' }}>
              The course prerequisites are found in the Undergraduate Calendar course descriptions,
              and are indicated by arrows between courses in this program map.
            </p>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#444', margin: 0 }}>
              Year Standing is enforced as per the Academic Regulations
              (as noted by 2nd, 3rd, or 4th above the course box).
            </p>
          </div>

          {/* Disclaimer */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontWeight: 700, fontSize: 12, marginBottom: 8,
              borderBottom: '1px solid #e2e8f0', paddingBottom: 6,
            }}>
              Disclaimer
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#444', margin: '0 0 8px 0' }}>
              Course data on this site is based on the <strong>2025–2026 academic calendar</strong>. Information may change — always verify with the official Carleton University Undergraduate Calendar.
            </p>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#888', margin: 0 }}>
              This website is not affiliated with, endorsed by, or officially connected to Carleton University.
            </p>
          </div>

          {/* Program-specific notes */}
          {notes.length > 0 && (
            <div>
              <div style={{
                fontWeight: 700, fontSize: 12, marginBottom: 8,
                borderBottom: '1px solid #e2e8f0', paddingBottom: 6,
              }}>
                Program Notes
              </div>
              {notes.map((note, i) => (
                <div key={i} style={{
                  fontSize: 11, lineHeight: 1.6, color: '#444',
                  marginBottom: 10, display: 'flex', gap: 6,
                }}>
                  <span style={{ fontWeight: 700, color: '#111', flexShrink: 0 }}>
                    ({String.fromCharCode(97 + i)})
                  </span>
                  <span>{note && typeof note === 'object' ? note.text : note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}