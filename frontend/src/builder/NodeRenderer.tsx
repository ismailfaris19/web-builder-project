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

export default function NodeRenderer({ node, selectById, onChange, onDelete, isSelected, selectedId }: { node: BuilderNode; selectById: (id: string)=>void; onChange: (n: BuilderNode)=>void; onDelete: ()=>void; isSelected?: boolean; selectedId?: string|null; }){
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
    border: isSelected ? '2px solid #ABE7B2' : hover ? '2px solid #818cf8' : '1px solid transparent', 
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if(e.key === 'Delete' || e.key === 'Backspace') {
      e.stopPropagation();

      // Find next or previous focusable node before this one is deleted
      const canvasNodes = Array.from(document.querySelectorAll('.canvas [role="group"]'));
      const currentIndex = canvasNodes.indexOf(e.currentTarget as Element);
      
      let targetNode: Element | null = null;
      for (let i = currentIndex + 1; i < canvasNodes.length; i++) {
        if (!e.currentTarget.contains(canvasNodes[i])) {
          targetNode = canvasNodes[i];
          break;
        }
      }
      if (!targetNode) {
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (!e.currentTarget.contains(canvasNodes[i])) {
            targetNode = canvasNodes[i];
            break;
          }
        }
      }
      
      if (targetNode) {
        (targetNode as HTMLElement).focus();
      } else {
        const firstPaletteItem = document.querySelector('.palette-item');
        if (firstPaletteItem) (firstPaletteItem as HTMLElement).focus();
      }

      onDelete();
    } else if(e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      e.preventDefault();
      selectById(node.id);
      setTimeout(() => {
        const descInput = document.querySelector('.description-input') as HTMLInputElement | null;
        if (descInput) descInput.focus();
      }, 0);
    }
  }

  return (
    <div id={`node-${node.id}`} ref={setDragRef} style={frame} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setHover(true)} onBlur={()=>setHover(false)} onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }} onKeyDown={(e)=>handleKeyDown(e)} role="group" aria-label={`${node.type} node`} tabIndex={0}>
      <div ref={setInsertDropRef} style={{ position: 'absolute', top: -8, left: 0, right: 0, height: 16, zIndex: 20, background: isInsertOver ? 'rgba(79, 70, 229, 0.4)' : 'transparent', borderRadius: 4, transition: 'background 0.2s' }} aria-hidden='true'/>
      <div {...listeners} {...attributes} style={{ position:'absolute', top: -12, left: 12, background:'#4f46e5', borderRadius: '8px 2px 8px 2px', padding:'2px 8px', color:'#fff', fontSize:10, fontWeight: 600, opacity: hover || isDragging ? 1 : 0, transition: 'opacity 0.2s', zIndex: 30, cursor: 'grab' }} title="Drag to move" tabIndex={-1} aria-hidden='true'>{title} ⠿</div>
      {node.type==='text' && <p aria-hidden='true' style={node.styles}>{node.label||'Text'}</p>}
      {node.type==='image' && <img aria-hidden='true' src={node.src||'https://via.placeholder.com/480x200?text=Image'} alt={node.alt||'Image'} style={{ maxWidth:'100%', borderRadius: '10px 2px 10px 2px', ...node.styles }} />}
      {node.type==='button' && <button aria-hidden='true' tabIndex={-1} className={`btn-${node.intent||'primary'} btn-${node.size||'md'}`} style={node.styles}>{node.label||'Button'}</button>}
      {node.type==='link' && <a aria-hidden='true' tabIndex={-1} className={`link-${node.intent||'primary'}`} href={node.href||'#'} style={node.styles}>{node.label||'Link'}</a>}
      {node.type==='input' && <div aria-hidden='true' style={node.styles}><label htmlFor={(node.name||'field').toLowerCase()}>{node.label||'Input'}</label><input tabIndex={-1} id={(node.name||'field').toLowerCase()} placeholder={node.placeholder||''} /></div>}
      {node.type==='container' && (
        <ContainerDropZone id={node.id} styles={node.styles} aria-hidden='true'>
          {(node.children||[]).length===0 ? <span style={{ color:'#9ca3af' }}>Empty container</span> : null}
          {(node.children||[]).map(child => (
            <NodeRenderer key={child.id} node={child} selectById={selectById}
              isSelected={selectedId === child.id}
              selectedId={selectedId}
              onChange={(c)=>{ const updated=(node.children||[]).map(ch=>ch.id===c.id?c:ch); onChange({ ...node, children: updated }) }}
              onDelete={()=>{ const updated=(node.children||[]).filter(ch=>ch.id!==child.id); onChange({ ...node, children: updated }) }}
            />
          ))}
        </ContainerDropZone>
      )}
      <div style={{ display:'flex', gap:8, marginTop:16, opacity: hover ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: hover ? 'auto' : 'none' }}>
        <button aria-hidden='true' tabIndex={-1} className="btn-secondary" onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }}>Edit</button>
        <button aria-hidden='true' tabIndex={-1} className="btn-danger" onClick={(e)=>{ e.stopPropagation(); onDelete() }}>Delete</button>
      </div>
    </div>
  )
}
