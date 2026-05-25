/* Hallmark · genre: modern-minimal · macrostructure: Workbench
 * theme: custom (Carleton) · design-system: design.md · designed-as-app
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ReactFlow, { Background }                    from 'reactflow'
import 'reactflow/dist/style.css'

import { CourseNode, YearHeaderNode, TermHeaderNode } from './components/CourseNode'
import { CleanEdge }                                  from './components/FanEdge'
import { Legend }                                     from './components/Legend'
import { Notes }                                      from './components/Notes'
import { CoursePanel }                                from './components/CoursePanel'
import { ProgramPicker }                              from './components/ProgramPicker'
import { MapMenubar }                                 from './components/MapMenubar'
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

// ─── Program name shortener ───────────────────────────────────────────────────

const shortenProgram = (degree = '') => {
  const specifics = [
    [/artificial intelligence|machine learning/i, 'AI & Machine Learning'],
    [/cybersecurity|cyber security/i,             'Cybersecurity'],
    [/game development/i,                         'Game Development'],
    [/software engineering/i,                     'Software Engineering'],
    [/user experience|ux.{0,5}ui/i,               'UX/UI Design'],
    [/\balgorithms\b/i,                           'Algorithms'],
    [/computing theory/i,                         'Computing Theory'],
    [/data science/i,                             'Data Science'],
    [/bioinformatics/i,                           'Bioinformatics'],
    [/cognitive science/i,                        'Cognitive Science'],
    [/network security|computer networking/i,     'Networking'],
  ]
  for (const [re, label] of specifics) if (re.test(degree)) return label

  let s = degree
    .replace(/^(Honours\s+)?Bachelor\s+of\s+\S+\s+/i, '')
    .replace(/^Computer\s+Science\s+/i, '')
    .replace(/\s+B\.[A-Z][A-Za-z.]+\.?\s*(Honours|Major|Minor)?\s*$/i, '')
    .replace(/,?\s*(Honours|Major|Minor|Concentration)\s*$/i, '')
    .replace(/\s+Stream\b/i, '')
    .trim()

  if (!s) {
    const m = degree.match(/\b(Honours|Major|Minor)\b/i)
    return m ? m[1] : degree.split(' ').slice(0, 3).join(' ')
  }
  return s.length > 30 ? s.slice(0, 28) + '…' : s
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [departments,     setDepartments]     = useState([])
  const [selectedDept,    setSelectedDept]    = useState(null)
  const [programs,        setPrograms]        = useState([])
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [courseMap,       setCourseMap]       = useState(null)
  const [nodes,           setNodes]           = useState([])
  const [edges,           setEdges]           = useState([])
  const [selectedNode,    setSelectedNode]    = useState(null)
  const [showPicker,      setShowPicker]      = useState(false)
  const [showNotes,       setShowNotes]       = useState(false)
  const rfRef = useRef(null)

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
    setSelectedNode(null)
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
    setSelectedNode(null)
    fetch(`${API}/programs/${selectedProgram}`)
      .then(r => r.json())
      .then(setCourseMap)
  }, [selectedProgram])

  // ── Build graph when course map arrives ─────────────────────────────────────
  useEffect(() => {
    if (!courseMap) return
    const codes = [...new Set(
      courseMap.requirements
        .filter(req => req.courses?.length > 0)
        .flatMap(req => req.courses)
    )]
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

  // ── Click handler ──────────────────────────────────────────────────────────
  const onNodeClick = useCallback((event, node) => {
    if (node.data.isElective || node.type !== 'course') return
    setSelectedNode(node)
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-paper)',
    }}>

      {/* Scrollbar-hiding utility for pill row */}
      <style>{`.pill-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* ── Nav bar ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-paper)',
        padding: '0 var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        height: 52,
        flexShrink: 0,
      }}>
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'var(--text-lg)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            color: 'var(--color-ink)',
          }}>
            <span style={{ color: 'var(--color-accent)' }}>Carleton</span>CourseMap
          </span>
        </a>

        {courseMap && (
          <span style={{
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            {courseMap.requirements.filter(r => r.courses?.length).length} courses
          </span>
        )}

        <div style={{ flex: 1 }} />

        <MapMenubar
          onFitView={() => rfRef.current?.fitView({ padding: 0.07 })}
          onZoomIn={() => rfRef.current?.zoomIn()}
          onZoomOut={() => rfRef.current?.zoomOut()}
          onSelectProgram={() => setShowPicker(true)}
          onShowNotes={() => setShowNotes(v => !v)}
        />
      </div>

      {/* ── Selection strip ──────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'var(--color-paper)',
        borderBottom: '1px solid var(--color-rule)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>

        {/* Row 1 — Department dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          height: 44,
          borderBottom: selectedDept ? '1px solid var(--color-rule)' : 'none',
        }}>
          <span style={rowLabelStyle}>Department</span>

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              value={selectedDept ?? ''}
              onChange={e => setSelectedDept(e.target.value === '' ? null : e.target.value)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                border: '1px solid var(--color-rule)',
                borderRadius: 'var(--radius-input)',
                padding: '5px 32px 5px 12px',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-body)',
                color: selectedDept ? 'var(--color-ink)' : 'var(--color-ink-3)',
                background: 'var(--color-paper-2)',
                cursor: 'pointer',
                outline: 'none',
                minWidth: 180,
                maxWidth: 300,
                transition: 'border-color var(--dur-short) var(--ease-out)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--color-accent)'
                e.target.style.background  = 'var(--color-paper)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--color-rule)'
                e.target.style.background  = 'var(--color-paper-2)'
              }}
            >
              <option value="">Select department…</option>
              {departments.map(dept => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Custom chevron (sits over the select's right edge) */}
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
              style={{
                position: 'absolute',
                right: 10,
                pointerEvents: 'none',
                color: 'var(--color-ink-3)',
              }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Row 2 — Program pills (only once a dept is selected) */}
        {selectedDept && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
            height: 44,
          }}>
            <span style={rowLabelStyle}>Program</span>

            <div className="pill-scroll" style={scrollRowStyle}>
              {programs.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
                  Loading programs…
                </span>
              ) : (
                programs.map(prog => (
                  <Pill
                    key={prog.program_id}
                    label={shortenProgram(prog.degree)}
                    active={String(prog.program_id) === String(selectedProgram)}
                    onClick={() => setSelectedProgram(prog.program_id)}
                    title={prog.degree}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ───────────────────────────────────────────────── */}
      {courseMap && <Legend degree={courseMap.degree} />}

      {/* ── Notes sidebar ────────────────────────────────────────── */}
      {courseMap && (
        <Notes
          notes={courseMap.notes}
          degree={courseMap.degree}
          open={showNotes}
          onOpenChange={setShowNotes}
        />
      )}

      {/* ── Flow canvas ──────────────────────────────────────────── */}
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
            onInit={inst => { rfRef.current = inst }}
            onNodeClick={onNodeClick}
            minZoom={0.4}
            maxZoom={1.5}
            translateExtent={[[-200, -200], [2000, 1000]]}
          >
            {/* ReactFlow Background.color is a prop, not a CSS property — can't use var() */}
            <Background color="#e5e2dc" gap={22} size={1} />
          </ReactFlow>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 'var(--text-md)',
            fontWeight: 500,
            color: 'var(--color-ink-3)',
          }}>
            {selectedDept
              ? 'Choose a program above to see the course map'
              : 'Choose a department above to begin'}
          </span>
        </div>
      )}

      {/* ── Program picker modal (via menubar) ──────────────────── */}
      <ProgramPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        departments={departments}
        programs={programs}
        selectedDept={selectedDept}
        selectedProgram={selectedProgram}
        onDeptSelect={setSelectedDept}
        onProgramSelect={setSelectedProgram}
      />

      {/* ── Course detail panel ─────────────────────────────────── */}
      <CoursePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

const Pill = ({ label, active, onClick, title }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      flexShrink: 0,
      background: active ? 'var(--color-accent)' : 'var(--color-paper-2)',
      color: active ? 'var(--color-accent-ink)' : 'var(--color-ink-2)',
      border: 'none',
      borderRadius: 20,
      padding: '5px 14px',
      fontSize: 12,
      fontWeight: active ? 500 : 400,
      fontFamily: 'var(--font-body)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
      transition: 'background var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out)',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-paper-3)' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'var(--color-paper-2)' }}
  >
    {label}
  </button>
)

// ─── Style constants ──────────────────────────────────────────────────────────

const rowLabelStyle = {
  flexShrink: 0,
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--color-ink-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  width: 80,
  lineHeight: 1,
}

const scrollRowStyle = {
  display: 'flex',
  gap: 6,
  overflowX: 'auto',
  alignItems: 'center',
  flex: 1,
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
}
