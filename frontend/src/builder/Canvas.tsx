import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { BuilderNode } from './types'
import NodeRenderer from './NodeRenderer'

function CanvasDropZone({ children }: { children: React.ReactNode }){
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-root' })
  return <div ref={setNodeRef} className="canvas" style={{ outline: isOver ? '2px dashed #2563eb' : 'none' }}>{children}</div>
}

export default function Canvas({ root, setRoot, setSelected }: { root: BuilderNode; setRoot: (n: BuilderNode) => void; setSelected: (id: string|null) => void; }){
  return (
    <div className="panel">
      <h3>Canvas</h3>
      <CanvasDropZone>
        {(root.children||[]).length===0 ? (
          <div className="empty">Drag items here…</div>
        ) : (
          (root.children||[]).map(node => (
            <NodeRenderer key={node.id} node={node}
              selectById={(id)=>setSelected(id)}
              onChange={(n)=>{ const children=(root.children||[]).map(c=>c.id===n.id?n:c); setRoot({ ...root, children }) }}
              onDelete={()=>{ const children=(root.children||[]).filter(c=>c.id!==node.id); setRoot({ ...root, children }); setSelected(null); }}
            />
          ))
        )}
      </CanvasDropZone>
    </div>
  )
}
