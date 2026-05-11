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
          <label>Required</label><div style={{ display: 'flex', alignItems: 'center', height: '100%' }}><input type="checkbox" checked={!!n.required} onChange={e=>update({ ...n, required: e.target.checked })} /></div>
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
        </>)}
        {n.type==='button' && (<>
          <label>Size</label>
          <select value={n.size||'md'} onChange={e=>update({ ...n, size: e.target.value as any })}>
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </>)}

        <div style={{ gridColumn: '1 / -1', margin: '1rem 0 0.5rem 0', fontWeight: 600, color: 'var(--fg)', borderBottom: '1px solid var(--line)', paddingBottom: '0.25rem' }}>Styles</div>
        <label>Padding</label>
        <input value={n.styles?.padding||''} onChange={e=>update({ ...n, styles: { ...n.styles, padding: e.target.value } })} placeholder="e.g., 10px" />
        <label>Margin</label>
        <input value={n.styles?.margin||''} onChange={e=>update({ ...n, styles: { ...n.styles, margin: e.target.value } })} placeholder="e.g., 10px" />
        <label>Border Radius</label>
        <input value={n.styles?.borderRadius||''} onChange={e=>update({ ...n, styles: { ...n.styles, borderRadius: e.target.value } })} placeholder="e.g., 8px" />
        <label>Background</label>
        <input type="color" value={n.styles?.backgroundColor||'#ffffff'} onChange={e=>update({ ...n, styles: { ...n.styles, backgroundColor: e.target.value } })} style={{ padding: '0 0.25rem', height: '2.5rem' }} />
        <label>Font Size</label>
        <input value={n.styles?.fontSize||''} onChange={e=>update({ ...n, styles: { ...n.styles, fontSize: e.target.value } })} placeholder="e.g., 16px" />
        <label>Width</label>
        <input value={n.styles?.width||''} onChange={e=>update({ ...n, styles: { ...n.styles, width: e.target.value } })} placeholder="e.g., 200px" />
        <label>Height</label>
        <input value={n.styles?.height||''} onChange={e=>update({ ...n, styles: { ...n.styles, height: e.target.value } })} placeholder="e.g., 200px" />
      </div>
    </div>
  )
}
