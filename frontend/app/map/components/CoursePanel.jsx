/* course detail panel — right sidebar on desktop, bottom drawer on mobile */

export const CoursePanel = ({ node, onClose, isMobile }) => {
  const isOpen = node != null && !node.data?.isElective


  const { code, name, description, credit, prerequisites, offerings } =
    isOpen ? node.data : {}

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
        height: '65vh',
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
        {/* drag handle — mobile only */}
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
