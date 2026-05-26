/* slide-in panel showing course details, closes on Escape or backdrop click */

import { useEffect } from 'react'

export const CoursePanel = ({ node, onClose }) => {
  const isOpen = node != null && !node.data?.isElective

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const { code, name, description, credit, prerequisites, offerings } =
    isOpen ? node.data : {}

  // Slide in from right. When closing: visibility waits for transform to finish
  // so the element doesn't remain tabbable while off-screen.
  const panelStyle = isOpen
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
        }}
      />
    )}
    <div
      aria-hidden={!isOpen}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: 340,
        height: '100vh',
        background: 'var(--color-paper)',
        borderLeft: '1px solid var(--color-rule)',
        overflowY: 'auto',
        zIndex: 20,
        fontFamily: 'var(--font-body)',
        ...panelStyle,
      }}
    >

      {/* ── Header ──────────────────────────────────────────── */}
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

      {/* ── Body ────────────────────────────────────────────── */}
      <div style={{ padding: 'var(--space-md)' }}>

        {/* Credits & Offerings */}
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
      </div>
    </div>
    </>
  )
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
