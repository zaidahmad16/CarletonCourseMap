/* Hallmark · component: Legend · genre: modern-minimal · theme: custom (Carleton) */

export const Legend = ({ degree }) => (
  <div style={{
    background: 'var(--color-paper)',
    borderBottom: '1px solid var(--color-rule)',
    padding: '7px var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-ink-2)',
    flexShrink: 0,
    flexWrap: 'wrap',
    fontFamily: 'var(--font-body)',
  }}>
    <strong style={{
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-sm)',
      fontWeight: 700,
      color: 'var(--color-ink)',
      letterSpacing: '-0.01em',
      marginRight: 4,
      whiteSpace: 'nowrap',
    }}>
      {degree}
    </strong>

    <span style={{
      marginLeft: 'auto',
      display: 'flex',
      gap: 'var(--space-sm)',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      {[
        { label: 'Required prereq',   line: true,  dash: false },
        { label: 'Concurrent prereq', line: true,  dash: true  },
        { label: 'Required',          box: 'var(--color-required)'      },
        { label: 'Math / Science',    box: 'var(--color-science)'       },
        { label: 'Elective',          box: 'var(--color-elective)'      },
        { label: 'Complementary',     box: 'var(--color-complementary)' },
      ].map(({ label, line, dash, box }) => (
        <span key={label} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap',
        }}>
          {line
            ? (
              <svg width="26" height="10" aria-hidden="true">
                <line
                  x1="0" y1="5" x2="18" y2="5"
                  stroke="var(--color-ink)"
                  strokeWidth="1.5"
                  strokeDasharray={dash ? '4,3' : undefined}
                />
                {!dash && (
                  <polygon points="15,2 22,5 15,8" fill="var(--color-ink)" />
                )}
              </svg>
            )
            : (
              <span style={{
                width: 12,
                height: 12,
                border: `2px solid ${box}`,
                borderRadius: 2,
                display: 'inline-block',
                flexShrink: 0,
              }} />
            )
          }
          {label}
        </span>
      ))}
    </span>
  </div>
)
