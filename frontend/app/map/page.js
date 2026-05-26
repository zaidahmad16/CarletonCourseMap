/* course map page, modern minimal Carleton theme */

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ReactFlow, { Background }                    from 'reactflow'
import 'reactflow/dist/style.css'

import { CourseNode, YearHeaderNode, TermHeaderNode } from './components/CourseNode'
import { CleanEdge }                                  from './components/FanEdge'
import { Legend }                                     from './components/Legend'
import { Notes }                                      from './components/Notes'
import { CoursePanel }                                from './components/CoursePanel'
import { ProgramPicker }                              from './components/ProgramPicker'
import { CompareModal }                               from './components/CompareModal'
import { MapMenubar }                                 from './components/MapMenubar'
import { buildGraph }                                 from './utils/buildGraph'
import { buildHeaders }                               from './utils/buildHeaders'
import { API }                                        from './utils/constants'

// ReactFlow type registries

const nodeTypes = {
  course:     CourseNode,
  yearHeader: YearHeaderNode,
  termHeader: TermHeaderNode,
}
const edgeTypes = { clean: CleanEdge }

// shortens program names to fit the pill strip

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

// Page

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
  const [showCompare,     setShowCompare]     = useState(false)
  const [searchQuery,     setSearchQuery]     = useState('')
  const [highlightedId,   setHighlightedId]   = useState(null)

  const [chainIds,        setChainIds]        = useState(null)
  const rfRef             = useRef(null)
  const initialProgram    = useRef(null)

  // load departments on mount
  useEffect(() => {
    fetch(`${API}/departments`).then(r => r.json()).then(setDepartments)
  }, [])

  // reload programs when the selected department changes
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
      .then(progs => {
        setPrograms(progs)
        if (initialProgram.current) {
          setSelectedProgram(initialProgram.current)
          initialProgram.current = null
        }
      })
  }, [selectedDept])

  // fetch the course map when the selected program changes
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

  // build the graph once course map data arrives
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

  // find a matching node when the search query changes, highlight it, and pan to it
  useEffect(() => {
    if (!searchQuery || nodes.length === 0) { setHighlightedId(null); return }
    const q = searchQuery.toLowerCase()
    const match = nodes.find(n =>
      n.type === 'course' && !n.data.isElective &&
      (n.id.toLowerCase().includes(q) || n.data.name?.toLowerCase().includes(q))
    )
    if (match) {
      setHighlightedId(match.id)
      rfRef.current?.fitView({ nodes: [{ id: match.id }], padding: 0.5, duration: 300 })
    } else {
      setHighlightedId(null)
    }
  }, [searchQuery, nodes])

  const displayNodes = useMemo(
    () => nodes.map(n => {
      const dimmed      = chainIds !== null && !chainIds.has(n.id)
      const highlighted = !chainIds && highlightedId === n.id
      if (!dimmed && !highlighted) return n
      return { ...n, data: { ...n.data, highlighted, dimmed } }
    }),
    [nodes, highlightedId, chainIds]
  )

  const displayEdges = useMemo(
    () => chainIds
      ? edges.map(e => chainIds.has(e.source) && chainIds.has(e.target)
          ? e
          : { ...e, style: { ...e.style, opacity: 0.08 } })
      : edges,
    [edges, chainIds]
  )

  // open the course panel when a non-elective node is clicked
  const onNodeClick = useCallback((event, node) => {
    if (node.data.isElective || node.type !== 'course') return
    setSelectedNode(node)

    const outMap = new Map()
    const inMap  = new Map()
    for (const e of edges) {
      if (!outMap.has(e.source)) outMap.set(e.source, [])
      outMap.get(e.source).push(e.target)
      if (!inMap.has(e.target)) inMap.set(e.target, [])
      inMap.get(e.target).push(e.source)
    }

    const chain = new Set([node.id])
    const bfs = (map, startId) => {
      const q = [startId]
      while (q.length) {
        const id = q.shift()
        for (const neighbour of (map.get(id) || [])) {
          if (!chain.has(neighbour)) { chain.add(neighbour); q.push(neighbour) }
        }
      }
    }
    bfs(inMap, node.id)
    bfs(outMap, node.id)
    setChainIds(chain)
  }, [edges])

  //Copy link
  const onCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }, [])


  return (
    <div className="map-print-root" style={{
      fontFamily: 'var(--font-body)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-paper)',
    }}>

      <style>{`.pill-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* nav bar */}
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

        {nodes.length > 0 && (
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"
              style={{ position: 'absolute', left: 9, pointerEvents: 'none', color: 'var(--color-ink-3)' }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Find a course…"
              style={{
                border: '1px solid var(--color-rule)',
                borderRadius: 'var(--radius-input)',
                padding: '5px 28px 5px 28px',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-ink)',
                background: 'var(--color-paper-2)',
                outline: 'none',
                width: 160,
                transition: 'border-color var(--dur-short) var(--ease-out), width var(--dur-short) var(--ease-out)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.width = '200px' }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-rule)'; e.target.style.width = '160px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute', right: 8, background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--color-ink-3)', padding: 0, lineHeight: 1,
                  fontSize: 14,
                }}
              >×</button>
            )}
          </div>
        )}

        <MapMenubar
          onFitView={() => rfRef.current?.fitView({ padding: 0.07 })}
          onZoomIn={() => rfRef.current?.zoomIn()}
          onZoomOut={() => rfRef.current?.zoomOut()}
          onSelectProgram={() => setShowPicker(true)}
          onShowNotes={() => setShowNotes(v => !v)}
          onCopyLink={onCopyLink}
          hasProgram={!!selectedProgram}
          onCompare={() => setShowCompare(true)}
        />
      </div>

      {/* selection strip */}
      <div style={{
        flexShrink: 0,
        background: 'var(--color-paper)',
        borderBottom: '1px solid var(--color-rule)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>

        {/* department dropdown */}
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

            {/* custom chevron overlaid on the right edge of the select */}
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

        {/* program pills, shown after a department is selected */}
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

      {/* legend */}
      {courseMap && <Legend degree={courseMap.degree} />}

      {/* notes sidebar */}
      {courseMap && (
        <div className="no-print">
          <Notes
            notes={courseMap.notes}
            degree={courseMap.degree}
            open={showNotes}
            onOpenChange={setShowNotes}
          />
        </div>
      )}

      {/* flow canvas */}
      {nodes.length > 0 ? (
        <div className="print-canvas" style={{ flex: 1 }}>
          <ReactFlow
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodes={displayNodes}
            edges={displayEdges}
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
            {/* Background.color is a prop, not a CSS property, so CSS vars don't work here */}
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

      {/* program picker modal */}
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

      {/* course detail panel */}
      <CoursePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  )
}

// Pill

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

// style constants

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
