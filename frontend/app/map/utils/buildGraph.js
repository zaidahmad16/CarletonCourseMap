import { MarkerType } from 'reactflow'
import { COL_WIDTH, ROW_HEIGHT, HEADER_HEIGHT } from './constants'
import { getNodeStyle, getElectiveStyle } from './styles'

const MIN_ROWS = 5

// SVG presentation attributes like markerEnd.color can't use CSS vars, so we mirror the token value directly
const REQUIRED_COLOR = 'oklch(11% 0 0)' // matches --color-required

export const buildGraph = (requirements, edges, courseDetails, numCols = 8) => {
  const detailMap   = new Map(courseDetails.filter(Boolean).map(d => [d.code, d]))
  const positionMap = {}

  // track which (col, row) positions are occupied
  const occupied = new Set()
  const occupy = (col, row) => occupied.add(`${col}-${row}`)
  const isOccupied = (col, row) => occupied.has(`${col}-${row}`)

  // track which columns have at least one node
  const colUsed = Array(numCols).fill(false)

  // course nodes
  const courseNodes = requirements
    .filter(req => req.courses?.length > 0 && req.layout_col != null)
    .map(req => {
      const code   = req.courses[0]
      const course = detailMap.get(code)
      if (!course) return null

      positionMap[code] = { col: req.layout_col, row: req.layout_row }
      occupy(req.layout_col, req.layout_row)
      colUsed[req.layout_col] = true

      return {
        id: code,
        type: 'course',
        draggable: false,
        selectable: false,
        data: {
          code: course.code,
          name: course.name?.slice(0, 42),
          description: course.description || '',
          credit: course.credit,
          prerequisites: course.prerequisites || '',
          offerings: [
            course.offerings?.includes('fall') ? 'Fall' : '',
            course.offerings?.includes('winter') ? 'Winter' : '',
            course.offerings?.includes('summer') ? 'Summer' : '',
          ].filter(Boolean).join(', ') || null,
          style: getNodeStyle(course.code, course.credit),
        },
        position: {
          x: req.layout_col * COL_WIDTH,
          y: HEADER_HEIGHT + req.layout_row * ROW_HEIGHT,
        },
      }
    })
    .filter(Boolean)

  // elective nodes from the DB
  const simplifyDesc = (desc) => {
    if (!desc) return ''
    const d = desc.toLowerCase()
    if (d.includes('breadth'))       return 'Breadth Elective'
    if (d.includes('free'))          return 'Free Elective'
    if (d.includes('complementary')) return 'Complementary Elective'
    return desc.slice(0, 45)
  }

  const electiveNodes = requirements
    .filter(req => (!req.courses?.length) && req.layout_col != null)
    .map((req, i) => {
      occupy(req.layout_col, req.layout_row)
      colUsed[req.layout_col] = true
      return {
        id: `elective-${i}`,
        type: 'course',
        draggable: false,
        selectable: false,
        data: {
          code: 'Elective',
          name: simplifyDesc(req.description),
          style: req.description
            ? getElectiveStyle(req.description)
            : { border: '2px solid var(--color-elective)', borderRadius: 'var(--radius-card)', background: 'var(--color-elective-bg)' },
          isElective: true,
        },
        position: {
          x: req.layout_col * COL_WIDTH,
          y: HEADER_HEIGHT + req.layout_row * ROW_HEIGHT,
        },
      }
    })

  // fill every column up to MIN_ROWS with padding nodes
  const paddingNodes = []
  for (let col = 0; col < numCols; col++) {
    for (let row = 0; row < MIN_ROWS; row++) {
      if (isOccupied(col, row)) continue
      // row 4 and above get Free Elective, everything earlier gets Breadth Elective
      const label = row >= 4 ? 'Free Elective' : 'Breadth Elective'
      paddingNodes.push({
        id: `pad-${col}-${row}`,
        type: 'course',
        draggable: false,
        selectable: false,
        data: {
          code: 'Elective', name: label, isElective: true,
          style: { border: '2px solid var(--color-elective)', borderRadius: 'var(--radius-card)', background: 'var(--color-elective-bg)' },
        },
        position: {
          x: col * COL_WIDTH,
          y: HEADER_HEIGHT + row * ROW_HEIGHT,
        },
      })
    }
  }

  // edges from the API
  const nodeIds = new Set(courseNodes.map(n => n.id))

  const edgeList = (edges || [])
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map(e => ({
      id: `${e.type === 'concurrent' ? 'c' : 'r'}_${e.source}_${e.target}`,
      source: e.source,
      target: e.target,
      type: 'clean',
      markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: REQUIRED_COLOR },
      style: {
        stroke: 'var(--color-required)',
        strokeWidth: 1.5,
        ...(e.type === 'concurrent' ? { strokeDasharray: '6,4' } : {}),
      },
    }))

  return {
    nodes: [...courseNodes, ...electiveNodes, ...paddingNodes],
    edges: edgeList,
  }
}