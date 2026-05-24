import { Handle, Position } from 'reactflow'
import { NODE_WIDTH, NODE_HEIGHT, COL_WIDTH } from '../utils/constants'

export const CourseNode = ({ data }) => {
  const { style, code, name, isElective } = data

  return (
    <div style={{
      ...style,
      background: '#fff',
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      textAlign: 'center', padding: '8px 10px',
      boxSizing: 'border-box', fontFamily: 'Arial, sans-serif',
      position: 'relative',
    }}>
      {!isElective && (
        <>
          <Handle type="target" position={Position.Left} id="left"
            style={{ top: '50%', background: '#555', width: 6, height: 6, border: 'none' }} />
          <Handle type="source" position={Position.Right} id="right"
            style={{ top: '50%', background: '#555', width: 6, height: 6, border: 'none' }} />
        </>
      )}

      <div style={{
        fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
        fontStyle: isElective ? 'italic' : 'normal', color: '#000',
      }}>
        {code}
      </div>
      <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.35, color: '#222' }}>
        {name}
      </div>
    </div>
  )
}

export const YearHeaderNode = ({ data }) => (
  <div style={{
    background: '#1a1a2e', color: '#fff', fontWeight: 700, fontSize: 13,
    letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif',
    width: COL_WIDTH * 2, textAlign: 'center', padding: '10px 0', borderRadius: 2,
    pointerEvents: 'none', userSelect: 'none',
  }}>{data.label}</div>
)

export const TermHeaderNode = ({ data }) => (
  <div style={{
    background: '#2d2d44', color: '#cbd5e1', fontWeight: 600, fontSize: 11,
    letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif',
    width: COL_WIDTH, textAlign: 'center', padding: '8px 0', borderRadius: 2,
    pointerEvents: 'none', userSelect: 'none',
  }}>{data.label}</div>
)