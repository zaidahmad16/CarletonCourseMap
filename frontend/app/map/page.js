'use client'

import { useState, useEffect } from "react"
import ReactFlow, {
  Background, Controls, MiniMap, MarkerType, Handle, Position, getBezierPath
} from "reactflow"
import 'reactflow/dist/style.css'

const API = 'http://localhost:8000'
const COL_WIDTH = 240
const ROW_HEIGHT = 130
const HEADER_HEIGHT = 95

const getNodeStyle = (course) => {
  const code = course.code || ''
  if (code.startsWith('MATH') || code.startsWith('STAT') || code.startsWith('PHYS') || code.startsWith('CHEM'))
    return { border: '3px solid #16a34a', borderRadius: 8 }
  if (course.credit === 0)
    return { border: '3px dashed #000', borderRadius: 8 }
  return { border: '3px solid #000', borderRadius: 8 }
}

const getElectiveStyle = (description = '') => {
  const d = description.toLowerCase()
  if (d.includes('complementary')) return { border: '3px solid #dc2626', borderRadius: 8 }
  if (d.includes('basic science')) return { border: '3px solid #16a34a', borderRadius: 8 }
  return { border: '3px solid #ca8a04', borderRadius: 8 }
}

const CourseNode = ({ data }) => (
  <div style={{
    ...data.style,
    background: '#fff',
    padding: '10px 12px',
    width: 170,
    textAlign: 'center',
    fontSize: 11,
    boxSizing: 'border-box',
    position: 'relative',
  }}>
    <Handle type="target" position={Position.Left} id="left" style={{ background: '#555', width: 8, height: 8 }} />
    <Handle type="target" position={Position.Top} id="top" style={{ background: '#555', width: 8, height: 8 }} />
    <div style={{ fontWeight: 800, fontSize: 12 }}>{data.code}</div>
    <div style={{ marginTop: 3, lineHeight: 1.3, fontSize: 10, color: '#333' }}>{data.name}</div>
    {data.credit !== undefined && (
      <div style={{ marginTop: 4, fontSize: 9, color: '#2563eb' }}>
        ({data.credit} credit{data.credit !== 1 ? 's' : ''})
      </div>
    )}
    <Handle type="source" position={Position.Right} id="right" style={{ background: '#555', width: 8, height: 8 }} />
    <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#555', width: 8, height: 8 }} />
  </div>
)

// Header nodes have NO handles — prevents edges attaching to them
const YearHeaderNode = ({ data }) => (
  <div style={{
    background: '#0f172a', color: '#fff',
    fontWeight: 800, fontSize: 15,
    width: COL_WIDTH * 2, textAlign: 'center',
    borderRadius: 6, padding: '10px 0',
    pointerEvents: 'none',
  }}>
    {data.label}
  </div>
)

const TermHeaderNode = ({ data }) => (
  <div style={{
    background: '#1e293b', color: '#cbd5e1',
    fontWeight: 600, fontSize: 13,
    width: COL_WIDTH, textAlign: 'center',
    borderRadius: 6, padding: '8px 0',
    pointerEvents: 'none',
  }}>
    {data.label}
  </div>
)

const nodeTypes = {
  course: CourseNode,
  yearHeader: YearHeaderNode,
  termHeader: TermHeaderNode,
}

export default function MapPage() {
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [courseMap, setCourseMap] = useState(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  useEffect(() => {
    fetch(`${API}/departments`).then(r => r.json()).then(setDepartments)
  }, [])

  useEffect(() => {
    if (!selectedDept) return
    fetch(`${API}/programs?dept=${selectedDept}`).then(r => r.json()).then(setPrograms)
  }, [selectedDept])

  useEffect(() => {
    if (!selectedProgram) return
    fetch(`${API}/programs/${selectedProgram}`).then(r => r.json()).then(setCourseMap)
  }, [selectedProgram])

  useEffect(() => {
    if (!courseMap) return

    const codes = courseMap.requirements
      .filter(req => req.courses?.length > 0)
      .slice(0, 40)
      .map(req => req.courses[0])

    fetch(`${API}/courses/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codes)
    })
      .then(r => r.json())
      .then(details => {
        const colCounts = [0, 0, 0, 0, 0, 0, 0, 0]

        // Build a position lookup by course code
        const positionMap = {}

        const rawNodes = details.filter(c => c && c.code).map(course => {
          const num = parseInt(course.code.match(/\d+/)?.[0]) || 1000
          const year = Math.min(4, Math.max(1, Math.floor(num / 1000)))
          const hasFall = course.offerings?.includes('fall')
          const hasWinter = course.offerings?.includes('winter')
          const term = hasFall && !hasWinter ? 'fall'
            : hasWinter && !hasFall ? 'winter'
            : num % 2 !== 0 ? 'fall' : 'winter'
          const col = (year - 1) * 2 + (term === 'winter' ? 1 : 0)
          const row = colCounts[col]++
          const x = col * COL_WIDTH
          const y = HEADER_HEIGHT + row * ROW_HEIGHT
          positionMap[course.code] = { x, y, col }
          return {
            id: course.code,
            type: 'course',
            draggable: false,
            selectable: true,
            data: {
              code: course.code,
              name: course.name?.slice(0, 40),
              credit: course.credit,
              style: getNodeStyle(course),
            },
            position: { x, y },
          }
        })

        const electiveNodes = courseMap.requirements
          .filter(req => !req.courses?.length && req.description)
          .map((req, i) => {
            const col = 6 + (i % 2)
            const row = colCounts[col]++
            const x = col * COL_WIDTH
            const y = HEADER_HEIGHT + row * ROW_HEIGHT
            return {
              id: `elective-${i}`,
              type: 'course',
              draggable: false,
              data: {
                code: 'Elective',
                name: req.description?.slice(0, 45),
                style: getElectiveStyle(req.description),
              },
              position: { x, y },
            }
          })

        const yearHeaders = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((label, i) => ({
          id: `year-${i}`,
          type: 'yearHeader',
          draggable: false,
          selectable: false,
          data: { label },
          position: { x: i * 2 * COL_WIDTH, y: 0 },
        }))

        const termHeaders = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'].flatMap((_, yi) =>
          ['Fall', 'Winter'].map((term, ti) => ({
            id: `term-${yi}-${ti}`,
            type: 'termHeader',
            draggable: false,
            selectable: false,
            data: { label: term },
            position: { x: (yi * 2 + ti) * COL_WIDTH, y: 48 },
          }))
        )

        // Build edges — only left-to-right, pick handle based on direction
        const nodeIds = new Set(rawNodes.map(n => n.id))
        const edgeList = []
        const edgeSet = new Set()

        details.filter(Boolean).forEach(course => {
          if (!course.prerequisites) return
          const matches = course.prerequisites.match(/[A-Z]{2,4}\s\d{4}/g) || []
          matches.forEach(prereqCode => {
            const source = prereqCode.trim()
            const target = course.code
            const edgeId = `${source}->${target}`
            if (edgeSet.has(edgeId)) return
            if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) return

            const srcPos = positionMap[source]
            const tgtPos = positionMap[target]
            if (!srcPos || !tgtPos) return

            // Only draw if source is to the left of target
            if (srcPos.col >= tgtPos.col) return

            edgeSet.add(edgeId)
            edgeList.push({
              id: edgeId,
              source,
              target,
              sourceHandle: 'right',
              targetHandle: 'left',
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#000' },
              style: { stroke: '#000', strokeWidth: 2 },
            })
          });

          (course.concurrent_prerequisites || []).forEach(prereqCode => {
            const source = prereqCode.trim()
            const target = course.code
            const edgeId = `conc-${source}->${target}`
            if (edgeSet.has(edgeId)) return
            if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) return

            const srcPos = positionMap[source]
            const tgtPos = positionMap[target]
            if (!srcPos || !tgtPos || srcPos.col >= tgtPos.col) return

            edgeSet.add(edgeId)
            edgeList.push({
              id: edgeId,
              source,
              target,
              sourceHandle: 'right',
              targetHandle: 'left',
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#000' },
              style: { stroke: '#000', strokeWidth: 2, strokeDasharray: '6,4' },
            })
          })
        })

        setNodes([...yearHeaders, ...termHeaders, ...rawNodes, ...electiveNodes])
        setEdges(edgeList)
      })
  }, [courseMap])

  return (
    <div style={{ padding: 20 }}>
      <h1>CarletonCourseMap</h1>

      <select onChange={e => setSelectedDept(e.target.value)} defaultValue="">
        <option value="" disabled>Select a department</option>
        {departments.map(d => (
          <option key={d.dept_id} value={d.dept_id}>{d.name}</option>
        ))}
      </select>

      {programs.length > 0 && (
        <select onChange={e => setSelectedProgram(e.target.value)} defaultValue="">
          <option value="" disabled>Select a program</option>
          {programs.map(p => (
            <option key={p.program_id} value={p.program_id}>{p.degree}</option>
          ))}
        </select>
      )}

      {courseMap && (
        <div>
          <h2>{courseMap.degree}</h2>
          <p>{courseMap.requirements.filter(r => r.courses?.length).length} courses</p>
        </div>
      )}

      {nodes.length > 0 && (
        <div style={{ width: '100vw', height: '85vh', marginTop: 20 }}>
          <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            edgesUpdatable={false}
            nodesDraggable={false}
            elementsSelectable={false}
            minZoom={0.1}
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls />
            <MiniMap nodeColor={n => n.type === 'course' ? '#1d4ed8' : '#0f172a'} />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}