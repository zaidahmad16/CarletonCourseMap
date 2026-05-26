import { BaseEdge } from 'reactflow'
import { COL_WIDTH } from '../utils/constants'

export const CleanEdge = ({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }) => {
  const span = targetX - sourceX
  const multiCol = span > COL_WIDTH + 20

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