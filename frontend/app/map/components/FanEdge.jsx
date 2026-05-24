import { BaseEdge } from 'reactflow'

// CleanEdge: exits source → goes right 25px → vertical to target row → horizontal to target
// The vertical segment stays in the gap between columns, never crossing through nodes.

export const CleanEdge = ({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }) => {
  const gapX = sourceX + 25  // vertical line sits 25px right of source handle (in the column gap)
  const path = `M ${sourceX},${sourceY} H ${gapX} V ${targetY} H ${targetX}`
  return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
}