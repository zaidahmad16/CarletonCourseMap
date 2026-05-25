/* Hallmark · component: CourseNode · genre: modern-minimal · theme: custom (Carleton)
 * states: default · hover (card lift) · pointer-none on electives
 */

import { Handle, Position } from 'reactflow'
import { NODE_WIDTH, NODE_HEIGHT, COL_WIDTH } from '../utils/constants'

export const CourseNode = ({ data }) => {
  const { style, code, name, isElective } = data
  const bg = style?.background ?? 'var(--color-paper)'

  return (
    <div style={{
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
      boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
      transition: 'box-shadow var(--dur-short) var(--ease-out)',
    }}>
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
