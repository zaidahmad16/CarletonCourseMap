/* course node card, electives are non-interactive */

import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import { NODE_WIDTH, NODE_HEIGHT, COL_WIDTH } from '../utils/constants'

export const CourseNode = ({ data }) => {
  const { style, code, name, isElective, isMissing, highlighted, dimmed } = data
  const bg = style?.background ?? 'var(--color-paper)'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => { if (!isElective) setHovered(true) }}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        background: bg,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '8px 10px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        cursor: isElective ? 'default' : 'pointer',
        opacity: dimmed ? 0.15 : 1,
        boxShadow: highlighted
          ? '0 0 0 2px var(--color-accent), 0 4px 12px rgba(0,0,0,0.14)'
          : hovered
          ? '0 4px 12px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow var(--dur-short) var(--ease-out), opacity var(--dur-medium) var(--ease-out)',
      }}
    >
      {!isElective && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            style={{
              top: '50%',
              background: 'var(--color-paper-2)',
              width: 6,
              height: 6,
              border: '1.5px solid var(--color-ink-3)',
            }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            style={{
              top: '50%',
              background: 'var(--color-paper-2)',
              width: 6,
              height: 6,
              border: '1.5px solid var(--color-ink-3)',
            }}
          />
        </>
      )}

      {!isElective && !isMissing && hovered && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 5,
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--color-accent)',
          opacity: 0.7,
          pointerEvents: 'none',
          letterSpacing: '0.03em',
        }}>
          click for info
        </div>
      )}

      <div style={{
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 0.2,
        fontStyle: isElective ? 'italic' : 'normal',
        color: 'var(--color-ink)',
        lineHeight: 1.2,
      }}>
        {code}
      </div>
      <div style={{
        marginTop: 5,
        fontSize: 10,
        lineHeight: 1.35,
        color: 'var(--color-ink-2)',
      }}>
        {name}
      </div>
    </div>
  )
}

export const YearHeaderNode = ({ data }) => (
  <div style={{
    background: 'var(--color-paper)',
    color: 'var(--color-ink)',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
    width: COL_WIDTH * 2,
    textAlign: 'center',
    padding: '10px 0',
    borderRadius: 'var(--radius-card)',
    borderBottom: '2px solid var(--color-accent)',
    pointerEvents: 'none',
    userSelect: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }}>
    {data.label}
  </div>
)

export const TermHeaderNode = ({ data }) => (
  <div style={{
    background: 'var(--color-paper-2)',
    color: 'var(--color-ink-2)',
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
    width: COL_WIDTH,
    textAlign: 'center',
    padding: '8px 0',
    borderRadius: 'var(--radius-card)',
    pointerEvents: 'none',
    userSelect: 'none',
  }}>
    {data.label}
  </div>
)
