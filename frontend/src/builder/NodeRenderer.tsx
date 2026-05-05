import React from 'react'
import type { BuilderNode } from './types'

export default function NodeRenderer({ node, selectById, onChange, onDelete }: { node: BuilderNode; selectById: (id: string)=>void; onChange: (n: BuilderNode)=>void; onDelete: ()=>void; }){
  const [hover, setHover] = React.useState(false)
  const frame: React.CSSProperties = { 
    border: hover ? '2px solid #818cf8' : '1px solid transparent', 
    boxShadow: hover ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 1px 3px 0 rgba(0,0,0,0.1)',
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    position: 'relative',
    background: '#fff',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  }
  const title = node.type.toUpperCase()
  return (
    <div style={frame} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }} role="group" aria-label={`${node.type} node`} tabIndex={0}>
      <div style={{ position:'absolute', top: -12, left: 12, background:'#4f46e5', borderRadius: 6, padding:'2px 8px', color:'#fff', fontSize:10, fontWeight: 600, opacity: hover ? 1 : 0, transition: 'opacity 0.2s', zIndex: 10 }}>{title}</div>
      {node.type==='text' && <p>{node.label||'Text'}</p>}
      {node.type==='image' && <img src={node.src||'https://via.placeholder.com/480x200?text=Image'} alt={node.alt||'Image'} style={{ maxWidth:'100%', borderRadius:6 }} />}
      {node.type==='button' && <button className="btn-primary">{node.label||'Button'}</button>}
      {node.type==='link' && <a href={node.href||'#'}>{node.label||'Link'}</a>}
      {node.type==='input' && <div><label htmlFor={(node.name||'field').toLowerCase()}>{node.label||'Input'}</label><input id={(node.name||'field').toLowerCase()} placeholder={node.placeholder||''} /></div>}
      {node.type==='container' && (
        <div style={{ border:'1px dashed #cbd5e1', borderRadius:8, padding:16, background:'#f8fafc', minHeight: 60 }}>
          {(node.children||[]).length===0 ? <span style={{ color:'#9ca3af' }}>Empty container</span> : null}
          {(node.children||[]).map(child => (
            <NodeRenderer key={child.id} node={child} selectById={selectById}
              onChange={(c)=>{ const updated=(node.children||[]).map(ch=>ch.id===c.id?c:ch); onChange({ ...node, children: updated }) }}
              onDelete={()=>{ const updated=(node.children||[]).filter(ch=>ch.id!==child.id); onChange({ ...node, children: updated }) }}
            />
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginTop:16, opacity: hover ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: hover ? 'auto' : 'none' }}>
        <button className="btn-secondary" onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }}>Edit</button>
        <button className="btn-danger" onClick={(e)=>{ e.stopPropagation(); onDelete() }}>Delete</button>
      </div>
    </div>
  )
}
