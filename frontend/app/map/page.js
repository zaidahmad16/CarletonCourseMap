'use client'

import { useState, useEffect }             from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

import { CourseNode, YearHeaderNode, TermHeaderNode } from './components/CourseNode'
import { CleanEdge }                                  from './components/FanEdge'
import { Legend }                                     from './components/Legend'
import { Notes }                                      from './components/Notes'
import { buildGraph }                                 from './utils/buildGraph'
import { buildHeaders }                               from './utils/buildHeaders'
import { API }                                        from './utils/constants'

// ─── ReactFlow type registries ────────────────────────────────────────────────

const nodeTypes = {
  course:     CourseNode,
  yearHeader: YearHeaderNode,
  termHeader: TermHeaderNode,
}

const edgeTypes = { clean: CleanEdge }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [departments,     setDepartments]     = useState([])
  const [selectedDept,    setSelectedDept]    = useState(null)
  const [programs,        setPrograms]        = useState([])
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [courseMap,       setCourseMap]       = useState(null)
  const [nodes,           setNodes]           = useState([])
  const [edges,           setEdges]           = useState([])

  // ── Load departments on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/departments`).then(r => r.json()).then(setDepartments)
  }, [])

  // ── Load programs when department changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedDept) return
    setPrograms([])
    setSelectedProgram(null)
    setCourseMap(null)
    setNodes([])
    setEdges([])
    fetch(`${API}/programs?dept=${selectedDept}`)
      .then(r => r.json())
      .then(setPrograms)
  }, [selectedDept])

  // ── Load course map when program changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedProgram) return
    setCourseMap(null)
    setNodes([])
    setEdges([])
    fetch(`${API}/programs/${selectedProgram}`)
      .then(r => r.json())
      .then(setCourseMap)
  }, [selectedProgram])

  // ── Build graph when course map arrives ─────────────────────────────────────
  useEffect(() => {
    if (!courseMap) return

    // Collect all unique course codes from requirements
    const codes = [...new Set(
      courseMap.requirements
        .filter(req => req.courses?.length > 0)
        .flatMap(req => req.courses)
    )]

    // Fetch full course details (name, credit, prerequisites etc.)
    fetch(`${API}/courses/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codes),
    })
      .then(r => r.json())
      .then(courseDetails => {
        const numCols = courseMap.layout_cols ?? 8
        const { nodes: graphNodes, edges: graphEdges } =
          buildGraph(courseMap.requirements, courseMap.edges, courseDetails, numCols)

        setNodes([...buildHeaders(numCols), ...graphNodes])
        setEdges(graphEdges)
      })
  }, [courseMap])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Nav bar */}
      <div style={{
        background: '#1a1a2e', color: '#fff',
        padding: '11px 24px',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>
          CarletonCourseMap
        </h1>

        <select
          onChange={e => setSelectedDept(e.target.value)}
          defaultValue=""
          style={{ padding: '5px 10px', borderRadius: 4, border: 'none', fontSize: 13, cursor: 'pointer', minWidth: 160 }}
        >
          <option value="" disabled>Select department</option>
          {departments.map(d => (
            <option key={d.dept_id} value={d.dept_id}>{d.name}</option>
          ))}
        </select>

        {programs.length > 0 && (
          <select
            onChange={e => setSelectedProgram(e.target.value)}
            defaultValue=""
            style={{ padding: '5px 10px', borderRadius: 4, border: 'none', fontSize: 13, cursor: 'pointer', minWidth: 260 }}
          >
            <option value="" disabled>Select program</option>
            {programs.map(p => (
              <option key={p.program_id} value={p.program_id}>{p.degree}</option>
            ))}
          </select>
        )}

        {courseMap && (
          <span style={{
            marginLeft: 6,
            background: 'rgba(255,255,255,0.15)',
            padding: '3px 10px', borderRadius: 10, fontSize: 11,
          }}>
            {courseMap.requirements.filter(r => r.courses?.length).length} courses
          </span>
        )}
      </div>

      {/* Legend */}
      {courseMap && <Legend degree={courseMap.degree} />}

      {/* Notes sidebar */}
      {courseMap && <Notes notes={courseMap.notes} degree={courseMap.degree} />}

      {/* Flow canvas */}
      {nodes.length > 0 ? (
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.07 }}
            edgesUpdatable={false}
            nodesDraggable={false}
            elementsSelectable={false}
            minZoom={0.05}
            maxZoom={2}
          >
            <Background color="#e2e8f0" gap={22} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', fontSize: 15,
        }}>
          Select a department and program to view the course map
        </div>
      )}
    </div>
  )
}