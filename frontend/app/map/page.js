
'use client'

/*
export default function MapPage() {
  return <div>Course Map</div>
}
*/

import { use, useEffect, useState } from "react"
import React,{Background,Controls,MiniMap} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'

const nodeWidth=180
const nodeHeight=60

function layoutNode(nodes,edges){
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(()=>({}))
  g.setGraph({rankdir:'LR',ranksep:80,nodesep:40})
    
  nodes.forEach((n)=> g.setNode(n.id,{width:nodeWidth,height:nodeHeight}))
  edges.forEach((e)=>g.setEdge(e.source,e.target))

  dagre.layout(g)

  return nodes.map((n)=>{
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 } }
  })
}
export default function MapPage() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://carletoncoursemap.ca/programs/1')
      .then((r) => r.json())
      .then((data) => {
        const reqs = data.requirements

        const rawNodes = reqs.map((req, i) => ({
          id: `node-${i}`,
          data: { label: req.courses?.[0] || req.description?.slice(0, 30) || `Req ${i}` },
          position: { x: 0, y: 0 },
          style: {
            background: req.type === 'required' ? '#1d4ed8' : '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            width: nodeWidth,
          },
        }))

        const rawEdges = []
        reqs.forEach((req, i) => {
          if (i > 0) {
            rawEdges.push({
              id: `e-${i - 1}-${i}`,
              source: `node-${i - 1}`,
              target: `node-${i}`,
              type: 'smoothstep',
            })
          }
        })

        const laid = layoutNodes(rawNodes, rawEdges)
        setNodes(laid)
        setEdges(rawEdges)
        setLoading(false)
      })
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}