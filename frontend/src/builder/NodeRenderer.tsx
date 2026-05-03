import React from 'react'
import type { BuilderNode } from './types'

export default function NodeRenderer({ node, selectById, onChange, onDelete }: { node: BuilderNode; selectById: (id: string)=>void; onChange: (n: BuilderNode)=>void; onDelete: ()=>void; }){
  const [hover, setHover] = React.useState(false)
  const frame: React.CSSProperties = { border: hover ? '1px dashed #9ca3af' : '1px solid #e5e7eb', padding: 8, borderRadius: 8, marginBottom: 8, position: 'relative' }
  const title = node.type.toUpperCase()
  return (
    <div style={frame} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }} role="group" aria-label={`${node.type} node`} tabIndex={0}>
      <div style={{ position:'absolute', top: -10, left: 8, background:'#fff', padding:'0 6px', color:'#6b7280', fontSize:12 }}>{title}</div>
      {node.type==='text' && <p>{node.label||'Text'}</p>}
      {node.type==='image' && <img src={node.src||'https://via.placeholder.com/480x200?text=Image'} alt={node.alt||'Image'} style={{ maxWidth:'100%', borderRadius:6 }} />}
      {node.type==='button' && <button>{node.label||'Button'}</button>}
      {node.type==='link' && <a href={node.href||'#'}>{node.label||'Link'}</a>}
      {node.type==='input' && <div><label htmlFor={(node.name||'field').toLowerCase()}>{node.label||'Input'}</label><input id={(node.name||'field').toLowerCase()} placeholder={node.placeholder||''} /></div>}
      {node.type==='container' && (
        <div style={{ border:'1px dashed #d1d5db', borderRadius:6, padding:8, background:'#fafafa' }}>
          {(node.children||[]).length===0 ? <span style={{ color:'#9ca3af' }}>Empty container</span> : null}
          {(node.children||[]).map(child => (
            <NodeRenderer key={child.id} node={child} selectById={selectById}
              onChange={(c)=>{ const updated=(node.children||[]).map(ch=>ch.id===c.id?c:ch); onChange({ ...node, children: updated }) }}
              onDelete={()=>{ const updated=(node.children||[]).filter(ch=>ch.id!==child.id); onChange({ ...node, children: updated }) }}
            />
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button onClick={(e)=>{ e.stopPropagation(); selectById(node.id) }}>Edit</button>
        <button onClick={(e)=>{ e.stopPropagation(); onDelete() }} style={{ color:'#dc2626' }}>Delete</button>
      </div>
    </div>
  )
}
