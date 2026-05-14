import React from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { BuilderNode } from './types'

function ContainerDropZone({ id, styles, children }: { id: string, styles?: React.CSSProperties, children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ border: isOver ? '2px dashed #4f46e5' : '1px dashed #cbd5e1', borderRadius: '12px 4px 12px 4px', padding:16, background: isOver ? '#e0e7ff' : '#f8fafc', minHeight: 60, ...styles, transition: 'all 0.2s' }}>
      {children}
    </div>
  )
}

export default function NodeRenderer({ node, selectById, onChange, onDelete }: { node: BuilderNode; selectById: (id: string)=>void; onChange: (n: BuilderNode)=>void; onDelete: ()=>void; }){
  const [hover, setHover] = React.useState(false)
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `drag-${node.id}`,
    data: { isExisting: true, node, type: node.type }
  })
  const { setNodeRef: setInsertDropRef, isOver: isInsertOver } = useDroppable({
    id: `insert-${node.id}`
  })

  const frame: React.CSSProperties = { 
    outline: 'none', 
    border: hover ? '2px solid #818cf8' : '1px solid transparent', 
    boxShadow: hover ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 1px 3px 0 rgba(0,0,0,0.1)',
    padding: 16, 
    borderRadius: '16px 4px 16px 4px', 
    marginBottom: 12, 
    position: 'relative',
    background: '#fff',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    cursor: 'pointer',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1
  }
  const title = node.type.toUpperCase()
  return (
    <div ref={setDragRef} style={frame} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setHover(true)} onBlur={()=>setHover(false)} onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }} role="group" aria-label={`${node.type} node`} tabIndex={0}>
      <div ref={setInsertDropRef} style={{ position: 'absolute', top: -8, left: 0, right: 0, height: 16, zIndex: 20, background: isInsertOver ? 'rgba(79, 70, 229, 0.4)' : 'transparent', borderRadius: 4, transition: 'background 0.2s' }} />
      <div {...listeners} {...attributes} style={{ position:'absolute', top: -12, left: 12, background:'#4f46e5', borderRadius: '8px 2px 8px 2px', padding:'2px 8px', color:'#fff', fontSize:10, fontWeight: 600, opacity: hover || isDragging ? 1 : 0, transition: 'opacity 0.2s', zIndex: 30, cursor: 'grab' }} title="Drag to move" tabIndex={-1}>{title} ⠿</div>
      {node.type==='text' && <p style={node.styles}>{node.label||'Text'}</p>}
      {node.type==='image' && <img src={node.src||'https://via.placeholder.com/480x200?text=Image'} alt={node.alt||'Image'} style={{ maxWidth:'100%', borderRadius: '10px 2px 10px 2px', ...node.styles }} />}
      {node.type==='button' && <button tabIndex={-1} className={`btn-${node.intent||'primary'} btn-${node.size||'md'}`} style={node.styles}>{node.label||'Button'}</button>}
      {node.type==='link' && <a tabIndex={-1} className={`link-${node.intent||'primary'}`} href={node.href||'#'} style={node.styles}>{node.label||'Link'}</a>}
      {node.type==='input' && <div style={node.styles}><label htmlFor={(node.name||'field').toLowerCase()}>{node.label||'Input'}</label><input tabIndex={-1} id={(node.name||'field').toLowerCase()} placeholder={node.placeholder||''} /></div>}
      {node.type==='container' && (
        <ContainerDropZone id={node.id} styles={node.styles}>
          {(node.children||[]).length===0 ? <span style={{ color:'#9ca3af' }}>Empty container</span> : null}
          {(node.children||[]).map(child => (
            <NodeRenderer key={child.id} node={child} selectById={selectById}
              onChange={(c)=>{ const updated=(node.children||[]).map(ch=>ch.id===c.id?c:ch); onChange({ ...node, children: updated }) }}
              onDelete={()=>{ const updated=(node.children||[]).filter(ch=>ch.id!==child.id); onChange({ ...node, children: updated }) }}
            />
          ))}
        </ContainerDropZone>
      )}
      <div style={{ display:'flex', gap:8, marginTop:16, opacity: hover ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: hover ? 'auto' : 'none' }}>
        <button tabIndex={-1} className="btn-secondary" onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }}>Edit</button>
        <button tabIndex={-1} className="btn-danger" onClick={(e)=>{ e.stopPropagation(); onDelete() }}>Delete</button>
      </div>
    </div>
  )
}
