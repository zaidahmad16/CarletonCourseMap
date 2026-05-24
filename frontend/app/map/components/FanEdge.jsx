import { BaseEdge } from 'reactflow'

const COL_W = 220

export const CleanEdge = ({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }) => {
  const span = targetX - sourceX
  const multiCol = span > COL_W + 20  // anything more than 1 column apart

  let path
  if (multiCol) {
    const exitX  = sourceX + 25
    const enterX = targetX - 25
    const goDown  = targetY >= sourceY
    const channelY = goDown ? sourceY + 75 : sourceY - 75
    path = `M ${sourceX},${sourceY} H ${exitX} V ${channelY} H ${enterX} V ${targetY} H ${targetX}`
  } else {
    // Adjacent columns: route through mid-gap
    const midX = sourceX + span / 2
    path = `M ${sourceX},${sourceY} H ${midX} V ${targetY} H ${targetX}`
  }

  return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
}