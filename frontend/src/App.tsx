import React from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import './styles.css'
import Palette from './builder/Palette'
import Canvas from './builder/Canvas'
import Inspector from './builder/Inspector'
import type { BuilderNode } from './builder/types'
import { listPages, savePage, getPage, deletePage, generateCode } from './api'

export default function App(){
  const [root, setRoot] = React.useState<BuilderNode>({ id:'root', type:'container', children:[] })
  const [selectedId, setSelectedId] = React.useState<string|null>(null)
  const [pageName, setPageName] = React.useState('Untitled Page')
  const [pages, setPages] = React.useState<Array<{id:string,name:string,updatedAt?:number}>>([])
  const [currentId, setCurrentId] = React.useState<string|null>(null)

  const handleDrop = (e: DragEndEvent) => {
    const type = (e?.active?.data?.current as any)?.type as BuilderNode['type']|undefined
    if(!type) return
    const id = (globalThis.crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2)
    const newNode: BuilderNode = {
      id, type,
      label: type==='text'?'Paragraph': type==='button'?'Button': type==='link'?'Link': type==='input'?'Input':'',
      name: type==='input'?'field': undefined,
      alt: type==='image'?'Image': undefined,
      children: type==='container'?[]: undefined
    }
    setRoot(r => ({ ...r, children: [ ...(r.children||[]), newNode ] }))
  }

  const selected = React.useMemo(() => (root.children||[]).find(n=>n.id===selectedId)||null, [root, selectedId])
  React.useEffect(() => { (async()=> setPages(await listPages()))() }, [])

  const updateSelected = (n: any) => setRoot({ ...root, children: (root.children||[]).map(c=>c.id===n.id?n:c) })

  const doSave = async () => {
    const res = await savePage({ id: currentId||undefined, name: pageName, data: root })
    setCurrentId(res.id)
    setPages(await listPages())
    alert('Saved!')
  }
  const doLoad = async (id: string) => {
    const res = await getPage(id)
    setCurrentId(res.id); setPageName(res.name); setRoot(res.data as any)
  }
  const doDelete = async () => {
    if(!currentId){ alert('No page selected'); return }
    await deletePage(currentId)
    setCurrentId(null); setRoot({ id:'root', type:'container', children:[] }); setPages(await listPages())
  }
  const exportHTML = async () => {
    const processNodes = async (nodes: BuilderNode[]): Promise<string> => {
      let result = ''
      for (const node of nodes) {
        if (['button', 'link', 'input'].includes(node.type)) {
          try {
            const { children, ...design } = node
            const res = await generateCode({ target: 'html', design })
            if (res.html) result += res.html + '\n'
          } catch (err) {
            console.error('Error generating code for node', node.id, err)
          }
        } else if (node.type === 'container') {
          result += `<div>\n${await processNodes(node.children || [])}</div>\n`
        } else if (node.type === 'text') {
          result += `<p>${node.label || 'Text'}</p>\n`
        } else if (node.type === 'image') {
          result += `<img src="${node.src || 'https://via.placeholder.com/480x200?text=Image'}" alt="${node.alt || 'Image'}" style="max-width:100%; border-radius:6px;" />\n`
        }
      }
      return result
    }

    const bodyContent = await processNodes(root.children || [])

    const html = `<!doctype html>
      <html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${pageName}</title></head><body>
      ${bodyContent}
      </body></html>`
    downloadTemplate(html);
  }
  const downloadTemplate = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(pageName || 'template').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('Export complete! Your HTML file has been downloaded.')
  }

  return (
    <DndContext onDragEnd={handleDrop}>
      <div className="container">
        <header>
          <h2>QuantumBlocks</h2>
          <p>Drag items onto the canvas, edit properties, save to DB, and export.</p>
        </header>

        <div className="panel toolbar">
          <div className="toolbar-group">
            <label>Page name</label>
            <input value={pageName} onChange={e=>setPageName(e.target.value)} style={{ width: '200px' }} />
            <button className="btn-primary" onClick={doSave}>Save</button>
          </div>
          <div className="toolbar-group">
            <label>Load page</label>
            <select onChange={e=> e.target.value && doLoad(e.target.value)} value={currentId??''} style={{ width: '150px' }}>
              <option value="" disabled>Select…</option>
              {pages.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn-danger" onClick={doDelete}>Delete</button>
          </div>
          <div className="toolbar-group">
            <button className="btn-secondary" onClick={exportHTML}>Export Full HTML</button>
          </div>
        </div>

        <div className="grid3">
          <Palette />
          <Canvas root={root} setRoot={setRoot} setSelected={setSelectedId} />
          <Inspector selected={selected} update={updateSelected} />
        </div>

        <footer><small>Built by Ismail • Accessibility-first Builder (SQLite)</small></footer>
      </div>
    </DndContext>
  )
}
