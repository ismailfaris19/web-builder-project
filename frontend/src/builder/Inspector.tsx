import React from 'react'
import type { BuilderNode } from './types'
export default function Inspector({ selected, update }: { selected: BuilderNode|null; update: (n: BuilderNode)=>void; }){
  if(!selected) return (<div className="panel"><h3>Inspector</h3><div style={{ color:'#6b7280' }}>Select a node to edit properties.</div></div>)
  const n = selected
  return (
    <div className="panel">
      <h3>Inspector</h3>
      <div className="grid">
        <label>Type</label><input value={n.type} disabled />
        {['text','button','link','input'].includes(n.type) && (<>
          <label>Label</label><input value={n.label||''} onChange={e=>update({ ...n, label: e.target.value })} />
        </>)}
        <label>Description</label><input value={n.description||''} onChange={e=>update({ ...n, description: e.target.value })} placeholder='e.g., "Blue small submit"' />
        {n.type==='link' && (<>
          <label>Href</label><input value={n.href||''} onChange={e=>update({ ...n, href: e.target.value })} placeholder="https://..." />
        </>)}
        {n.type==='input' && (<>
          <label>Name (id)</label><input value={n.name||'field'} onChange={e=>update({ ...n, name: e.target.value })} />
          <label>Required</label><input type="checkbox" checked={!!n.required} onChange={e=>update({ ...n, required: e.target.checked })} />
          <label>Placeholder</label><input value={n.placeholder||''} onChange={e=>update({ ...n, placeholder: e.target.value })} />
        </>)}
        {n.type==='image' && (<>
          <label>Src</label><input value={n.src||''} onChange={e=>update({ ...n, src: e.target.value })} placeholder="https://..." />
          <label>Alt</label><input value={n.alt||''} onChange={e=>update({ ...n, alt: e.target.value })} placeholder="Descriptive alt" />
        </>)}
        {['button','link'].includes(n.type) && (<>
          <label>Intent</label>
          <select value={n.intent||'primary'} onChange={e=>update({ ...n, intent: e.target.value as any })}>
            <option value="primary">primary</option>
            <option value="secondary">secondary</option>
            <option value="danger">danger</option>
          </select>
          <label>Size</label>
          <select value={n.size||'md'} onChange={e=>update({ ...n, size: e.target.value as any })}>
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </>)}
      </div>
    </div>
  )
}
