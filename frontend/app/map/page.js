'use client'

import { useState, useEffect } from "react"
import ReactFlow, { Background, Controls, MarkerType, Handle, Position, BaseEdge } from "reactflow"
import 'reactflow/dist/style.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const COL_WIDTH = 220
const ROW_HEIGHT = 150
const HEADER_HEIGHT = 100
const NODE_WIDTH = 170
const NODE_HEIGHT = 90

// ─── Styles ──────────────────────────────────────────────────────────────────

const getNodeStyle = (code = '', credit) => {
  if (['MATH','STAT','PHYS','CHEM'].some(p => code.startsWith(p)))
    return { border: '3px solid #16a34a', borderRadius: 4 }
  if (credit === 0)
    return { border: '3px dashed #111', borderRadius: 4 }
  return { border: '3px solid #111', borderRadius: 4 }
}

const getElectiveStyle = (desc = '') => {
  const d = desc.toLowerCase()
  if (d.includes('complementary')) return { border: '3px solid #dc2626', borderRadius: 4 }
  if (d.includes('basic science'))  return { border: '3px solid #16a34a', borderRadius: 4 }
  return { border: '3px solid #ea580c', borderRadius: 4 }
}

// ─── Custom edge ──────────────────────────────────────────────────────────────

const FanEdge = ({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }) => {
  const midX = sourceX + (targetX - sourceX) * 0.5
  const path = `M ${sourceX},${sourceY} H ${midX} V ${targetY} H ${targetX}`
  return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
}

const edgeTypes = { fan: FanEdge }

// ─── Nodes ───────────────────────────────────────────────────────────────────

const CourseNode = ({ data }) => {
  const { inHandles = [], outHandles = [], style, code, name, isElective } = data
  const topPad = 18, botPad = 18
  const spread = (i, n) => n <= 1 ? NODE_HEIGHT / 2 : topPad + (i / (n - 1)) * (NODE_HEIGHT - topPad - botPad)

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
      {inHandles.length === 0
        ? <Handle type="target" position={Position.Left} id="left-default"
            style={{ top: '50%', background: '#555', width: 6, height: 6, border: 'none', transform: 'translateY(-50%)' }} />
        : inHandles.map((h, i) => (
          <Handle key={`in-${i}`} type="target" position={Position.Left} id={h}
            style={{ top: spread(i, inHandles.length), background: '#555', width: 6, height: 6, border: 'none', transform: 'translateY(-50%)' }} />
        ))
      }

      <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.3, fontStyle: isElective ? 'italic' : 'normal', color: '#000' }}>
        {code}
      </div>
      <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.35, color: '#222' }}>
        {name}
      </div>

      {outHandles.length === 0
        ? <Handle type="source" position={Position.Right} id="right-default"
            style={{ top: '50%', background: '#555', width: 6, height: 6, border: 'none', transform: 'translateY(-50%)' }} />
        : outHandles.map((h, i) => (
          <Handle key={`out-${i}`} type="source" position={Position.Right} id={h}
            style={{ top: spread(i, outHandles.length), background: '#555', width: 6, height: 6, border: 'none', transform: 'translateY(-50%)' }} />
        ))
      }
    </div>
  )
}

const YearHeaderNode = ({ data }) => (
  <div style={{
    background: '#1a1a2e', color: '#fff', fontWeight: 700, fontSize: 13,
    letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif',
    width: COL_WIDTH * 2, textAlign: 'center', padding: '10px 0', borderRadius: 2,
    pointerEvents: 'none', userSelect: 'none',
  }}>{data.label}</div>
)

const TermHeaderNode = ({ data }) => (
  <div style={{
    background: '#2d2d44', color: '#cbd5e1', fontWeight: 600, fontSize: 11,
    letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif',
    width: COL_WIDTH, textAlign: 'center', padding: '8px 0', borderRadius: 2,
    pointerEvents: 'none', userSelect: 'none',
  }}>{data.label}</div>
)

const nodeTypes = { course: CourseNode, yearHeader: YearHeaderNode, termHeader: TermHeaderNode }

// ─── Main ─────────────────────────────────────────────────────────────────────

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

    // FIX 1: Collect ALL unique course codes across every requirement (not just courses[0])
    // and raise the cap to 80 so larger programs don't get truncated.
    const codes = [...new Set(
      courseMap.requirements
        .filter(req => req.courses?.length > 0)
        .flatMap(req => req.courses)
    )].slice(0, 80)

    fetch(`${API}/courses/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codes),
    })
      .then(r => r.json())
      .then(details => {
        console.log('batch returned:', details.length, 'courses:', details.map(d => d?.code))

        const colCounts = [0, 0, 0, 0, 0, 0, 0, 0]
        const positionMap = {}

        // ── 1. Place course nodes ────────────────────────────────────────────
        const rawNodes = details.filter(c => c?.code).map(course => {
          const num = parseInt(course.code.match(/\d+/)?.[0]) || 1000
          const year = course.year_standing
            ? Math.min(4, Math.max(1, course.year_standing))
            : Math.min(4, Math.max(1, Math.floor(num / 1000)))
          const hasFall   = course.offerings?.includes('fall')
          const hasWinter = course.offerings?.includes('winter')
          const term = (hasFall && !hasWinter) ? 'fall'
                     : (hasWinter && !hasFall) ? 'winter'
                     : (num % 2 !== 0)         ? 'fall' : 'winter'
          const col = (year - 1) * 2 + (term === 'winter' ? 1 : 0)
          const row = colCounts[col]++
          const x = col * COL_WIDTH
          const y = HEADER_HEIGHT + row * ROW_HEIGHT
          positionMap[course.code] = { x, y, col, row }
          return {
            id: course.code,
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
            position: { x, y },
          }
        })

        // FIX 3: Snapshot which columns have real courses BEFORE electives are placed.
        // Previously this was computed after electiveNodes incremented colCounts,
        // causing elective-only columns to also get padding nodes.
        const colHasRealCourses = colCounts.map(c => c > 0)

        // ── 2. Collect valid edges ───────────────────────────────────────────
        // FIX 4: Allow edges across ANY forward column, not just adjacent ones.
        // A Y1 → Y3 prerequisite is valid and should be drawn.
        const nodeMap = new Map(rawNodes.map(n => [n.id, n]))
        const nodeIds = new Set(nodeMap.keys())
        const edgeSet = new Set()
        const rawEdges = []

        const tryEdge = (source, target, dashed = false) => {
          const id = `${dashed ? 'c' : 'r'}_${source}_${target}`
          if (edgeSet.has(id)) return
          if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) return
          const sp = positionMap[source], tp = positionMap[target]
          // FIX 4: was `tp.col - sp.col !== 1` — now allows any forward edge
          if (!sp || !tp || tp.col <= sp.col) return
          edgeSet.add(id)
          rawEdges.push({ id, source, target, dashed })
        }

        details.filter(Boolean).forEach(course => {
          ;(course.prerequisites || '').match(/[A-Z]{2,4}\s\d{4}/g)?.forEach(c => tryEdge(c.trim(), course.code))
          ;(course.concurrent_prerequisites || []).forEach(c => tryEdge(c.trim(), course.code, true))
        })

        // ── 3. Assign unique handle IDs per edge ─────────────────────────────
        rawEdges.forEach(e => {
          nodeMap.get(e.source)?.data.outHandles.push(e.id)
          nodeMap.get(e.target)?.data.inHandles.push(e.id)
        })

        // ── 4. Build final edge objects ──────────────────────────────────────
        const edgeList = rawEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.id,
          targetHandle: e.id,
          type: 'fan',
          markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: '#111' },
          style: { stroke: '#111', strokeWidth: 1.5, ...(e.dashed ? { strokeDasharray: '6,4' } : {}) },
        }))

        // ── 5. Real elective requirement nodes ───────────────────────────────
        // FIX 2: Spread electives across cols 4–7 (Y3 Fall → Y4 Winter)
        // instead of hardcoding to just cols 6–7 (Y4 only).
        const electiveNodes = courseMap.requirements
          .filter(req => !req.courses?.length && req.description)
          .map((req, i) => {
            const col = 4 + (i % 4)   // spreads across Y3 Fall, Y3 Winter, Y4 Fall, Y4 Winter
            const row = colCounts[col]
            colCounts[col]++
            return {
              id: `elective-${i}`,
              type: 'course',
              draggable: false,
              selectable: false,
              data: {
                code: 'Elective',
                name: req.description?.slice(0, 45),
                style: getElectiveStyle(req.description),
                isElective: true,
                inHandles: [],
                outHandles: [],
              },
              position: { x: col * COL_WIDTH, y: HEADER_HEIGHT + row * ROW_HEIGHT },
            }
          })

        // ── 6. Pad columns that have real courses to same row count ──────────
        // FIX 3: Use the pre-elective snapshot so elective-only columns don't get padded.
        const maxRows = Math.max(...colCounts)
        const paddingNodes = []
        for (let col = 0; col < 8; col++) {
          if (!colHasRealCourses[col]) continue   // only pad columns with real courses
          while (colCounts[col] < maxRows) {
            const row = colCounts[col]++
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
              position: { x: col * COL_WIDTH, y: HEADER_HEIGHT + row * ROW_HEIGHT },
            })
          }
        }

        // ── 7. Headers ───────────────────────────────────────────────────────
        const yearHeaders = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((label, i) => ({
          id: `year-${i}`, type: 'yearHeader', draggable: false, selectable: false,
          data: { label }, position: { x: i * 2 * COL_WIDTH, y: 0 },
        }))

        const termHeaders = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'].flatMap((_, yi) =>
          ['Fall', 'Winter'].map((term, ti) => ({
            id: `term-${yi}-${ti}`, type: 'termHeader', draggable: false, selectable: false,
            data: { label: term }, position: { x: (yi * 2 + ti) * COL_WIDTH, y: 46 },
          }))
        )

        setNodes([...yearHeaders, ...termHeaders, ...rawNodes, ...electiveNodes, ...paddingNodes])
        setEdges(edgeList)
      })
  }, [courseMap])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{ background: '#1a1a2e', color: '#fff', padding: '11px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>CarletonCourseMap</h1>
        <select onChange={e => setSelectedDept(e.target.value)} defaultValue=""
          style={{ padding: '5px 10px', borderRadius: 4, border: 'none', fontSize: 13, cursor: 'pointer', minWidth: 160 }}>
          <option value="" disabled>Select department</option>
          {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.name}</option>)}
        </select>
        {programs.length > 0 && (
          <select onChange={e => setSelectedProgram(e.target.value)} defaultValue=""
            style={{ padding: '5px 10px', borderRadius: 4, border: 'none', fontSize: 13, cursor: 'pointer', minWidth: 260 }}>
            <option value="" disabled>Select program</option>
            {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.degree}</option>)}
          </select>
        )}
        {courseMap && (
          <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 10, fontSize: 11 }}>
            {courseMap.requirements.filter(r => r.courses?.length).length} courses
          </span>
        )}
      </div>

      {courseMap && (
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 18, fontSize: 11, color: '#444', flexShrink: 0, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 12, color: '#1a1a2e', marginRight: 4 }}>{courseMap.degree}</strong>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
            {[
              { label: 'Required prereq',   line: true,  dash: false },
              { label: 'Concurrent prereq', line: true,  dash: true  },
              { label: 'Required',    box: '#111' },
              { label: 'Math/Science',box: '#16a34a' },
              { label: 'Elective',    box: '#ea580c' },
              { label: 'Complementary',box: '#dc2626' },
            ].map(({ label, line, dash, box }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {line
                  ? <svg width="26" height="10"><line x1="0" y1="5" x2="18" y2="5" stroke="#111" strokeWidth="2" strokeDasharray={dash ? '5,3' : undefined} />{!dash && <polygon points="16,2 22,5 16,8" fill="#111"/>}</svg>
                  : <span style={{ width: 14, height: 14, border: `2.5px solid ${box}`, borderRadius: 2, display: 'inline-block' }} />
                }
                {label}
              </span>
            ))}
          </span>
        </div>
      )}

      {nodes.length > 0 ? (
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            nodes={nodes} edges={edges}
            fitView fitViewOptions={{ padding: 0.07 }}
            edgesUpdatable={false} nodesDraggable={false} elementsSelectable={false}
            minZoom={0.05} maxZoom={2}
          >
            <Background color="#e2e8f0" gap={22} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 15 }}>
          Select a department and program to view the course map
        </div>
      )}
    </div>
  )
}