import { MarkerType } from 'reactflow'
import { COL_WIDTH, ROW_HEIGHT, HEADER_HEIGHT } from './constants'
import { getNodeStyle, getElectiveStyle } from './styles'

const MIN_ROWS = 5

export const buildGraph = (requirements, edges, courseDetails, numCols = 8) => {
  const detailMap   = new Map(courseDetails.filter(Boolean).map(d => [d.code, d]))
  const positionMap = {}
  const colMaxRow   = Array(numCols).fill(-1)

  const trackRow = (col, row) => {
    if (col >= 0 && col < numCols)
      colMaxRow[col] = Math.max(colMaxRow[col], row)
  }

  // ── Course nodes ──────────────────────────────────────────────────────────
  const courseNodes = requirements
    .filter(req => req.courses?.length > 0 && req.layout_col != null)
    .map(req => {
      const code   = req.courses[0]
      const course = detailMap.get(code)
      if (!course) return null

      positionMap[code] = { col: req.layout_col, row: req.layout_row }
      trackRow(req.layout_col, req.layout_row)

      return {
        id: code,
        type: 'course',
        draggable: false,
        selectable: false,
        data: {
          code: course.code,
          name: course.name?.slice(0, 42),
          style: getNodeStyle(course.code, course.credit),
          inHandles: [],
          outHandles: [],
        },
        position: {
          x: req.layout_col * COL_WIDTH,
          y: HEADER_HEIGHT + req.layout_row * ROW_HEIGHT,
        },
      }
    })
    .filter(Boolean)

  // ── Elective nodes ────────────────────────────────────────────────────────
  const electiveNodes = requirements
    .filter(req => (!req.courses?.length) && req.layout_col != null)
    .map((req, i) => {
      trackRow(req.layout_col, req.layout_row)
      return {
        id: `elective-${i}`,
        type: 'course',
        draggable: false,
        selectable: false,
        data: {
          code: 'Elective',
          name: req.description?.slice(0, 45) ?? '',
          style: req.description
            ? getElectiveStyle(req.description)
            : { border: '3px solid #ea580c', borderRadius: 4 },
          isElective: true,
          inHandles: [],
          outHandles: [],
        },
        position: {
          x: req.layout_col * COL_WIDTH,
          y: HEADER_HEIGHT + req.layout_row * ROW_HEIGHT,
        },
      }
    })

  // ── Padding nodes ─────────────────────────────────────────────────────────
  const paddingNodes = []
  for (let col = 0; col < numCols; col++) {
    if (colMaxRow[col] === -1) continue
    for (let row = colMaxRow[col] + 1; row < MIN_ROWS; row++) {
      paddingNodes.push({
        id: `pad-${col}-${row}`,
        type: 'course',
        draggable: false,
        selectable: false,
        data: {
          code: 'Elective', name: '', isElective: true,
          style: { border: '3px solid #ea580c', borderRadius: 4 },
          inHandles: [], outHandles: [],
        },
        position: {
          x: col * COL_WIDTH,
          y: HEADER_HEIGHT + row * ROW_HEIGHT,
        },
      })
    }
  }

  // ── Edges from API + assign spread handles ────────────────────────────────
  const nodeMap = new Map(courseNodes.map(n => [n.id, n]))
  const nodeIds = new Set(nodeMap.keys())

  const validEdges = (edges || [])
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map(e => {
      const id = `${e.type === 'concurrent' ? 'c' : 'r'}_${e.source}_${e.target}`
      // Assign unique handle IDs so edges spread across node height
      nodeMap.get(e.source)?.data.outHandles.push(id)
      nodeMap.get(e.target)?.data.inHandles.push(id)
      return {
        id,
        source: e.source,
        target: e.target,
        sourceHandle: id,
        targetHandle: id,
        type: 'clean',
        markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: '#111' },
        style: {
          stroke: '#111',
          strokeWidth: 1.5,
          ...(e.type === 'concurrent' ? { strokeDasharray: '6,4' } : {}),
        },
      }
    })

  return {
    nodes: [...courseNodes, ...electiveNodes, ...paddingNodes],
    edges: validEdges,
  }
}