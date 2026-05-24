export const Legend = ({ degree }) => (
  <div style={{
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    padding: '6px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    fontSize: 11,
    color: '#444',
    flexShrink: 0,
    flexWrap: 'wrap',
  }}>
    <strong style={{ fontSize: 12, color: '#1a1a2e', marginRight: 4 }}>{degree}</strong>

    <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
      {[
        { label: 'Required prereq',   line: true, dash: false },
        { label: 'Concurrent prereq', line: true, dash: true  },
        { label: 'Required',          box: '#111'     },
        { label: 'Math/Science',      box: '#16a34a'  },
        { label: 'Elective',          box: '#ea580c'  },
        { label: 'Complementary',     box: '#dc2626'  },
      ].map(({ label, line, dash, box }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {line
            ? <svg width="26" height="10">
                <line x1="0" y1="5" x2="18" y2="5"
                  stroke="#111" strokeWidth="2"
                  strokeDasharray={dash ? '5,3' : undefined} />
                {!dash && <polygon points="16,2 22,5 16,8" fill="#111" />}
              </svg>
            : <span style={{
                width: 14, height: 14,
                border: `2.5px solid ${box}`,
                borderRadius: 2,
                display: 'inline-block',
              }} />
          }
          {label}
        </span>
      ))}
    </span>
  </div>
)