import React from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import toast, { Toaster } from 'react-hot-toast'
import './styles.css'
import Palette from './builder/Palette'
import Canvas from './builder/Canvas'
import Inspector from './builder/Inspector'
import type { BuilderNode } from './builder/types'
import { listPages, savePage, getPage, deletePage, generateCode } from './api'
import logo from './assets/images/logo.png';

function useHistory<T>(initialState: T, maxHistory: number = 20) {
  const [state, setState] = React.useState<{ past: T[], present: T, future: T[] }>({ past: [], present: initialState, future: [] })

  const set = React.useCallback((newState: T | ((curr: T) => T)) => {
    setState(s => {
      const nextState = typeof newState === 'function' ? (newState as Function)(s.present) : newState
      if (s.present === nextState) return s
      const newPast = [...s.past, s.present]
      if (newPast.length > maxHistory) newPast.shift()
      return { past: newPast, present: nextState, future: [] }
    })
  }, [maxHistory])

  const undo = React.useCallback(() => {
    setState(s => {
      if (s.past.length === 0) return s
      const previous = s.past[s.past.length - 1]
      const newPast = s.past.slice(0, s.past.length - 1)
      return { past: newPast, present: previous, future: [s.present, ...s.future] }
    })
  }, [])

  const redo = React.useCallback(() => {
    setState(s => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      const newFuture = s.future.slice(1)
      return { past: [...s.past, s.present], present: next, future: newFuture }
    })
  }, [])

  const resetHistory = React.useCallback((newState: T) => {
    setState({ past: [], present: newState, future: [] })
  }, [])

  return { state: state.present, set, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0, resetHistory }
}

export default function App(){
  const { state: root, set: setRoot, undo, redo, canUndo, canRedo, resetHistory } = useHistory<BuilderNode>({ id:'root', type:'container', children:[] })
  const [selectedId, setSelectedId] = React.useState<string|null>(null)
  const [pageName, setPageName] = React.useState('')
  const [pages, setPages] = React.useState<Array<{id:string,name:string,updatedAt?:number}>>([])
  const [currentId, setCurrentId] = React.useState<string|null>(null)
  const toasterProps = {
    duration: 4000 // Time in milliseconds
  }

  const handleDrop = (e: DragEndEvent) => {
    const activeData = e?.active?.data?.current as any
    const type = activeData?.type as BuilderNode['type']|undefined
    const isExisting = activeData?.isExisting as boolean | undefined
    if(!type) return
    const overId = e.over?.id as string | undefined
    if(!overId) return

    let dragNode: BuilderNode
    if (isExisting) {
      dragNode = activeData.node as BuilderNode
      if (dragNode.id === overId || `insert-${dragNode.id}` === overId) return

      const isDescendant = (node: BuilderNode, targetId: string): boolean => {
        if (node.id === targetId || `insert-${node.id}` === targetId) return true
        return (node.children || []).some(c => isDescendant(c, targetId))
      }
      if (isDescendant(dragNode, overId)) {
        toast.error("Cannot drop a container into itself!", toasterProps)
        return
      }
    } else {
      const id = (globalThis.crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2)
      dragNode = {
        id, type,
        label: type==='text'?'Paragraph': type==='button'?'Button': type==='link'?'Link': type==='input'?'Input':'',
        name: type==='input'?'field': undefined,
        alt: type==='image'?'Image': undefined,
        children: type==='container'?[]: undefined
      }
    }

    let newChildren = root.children || []
    if (isExisting) {
      const removeNode = (nodes: BuilderNode[]): BuilderNode[] => {
        return nodes.filter(n => n.id !== dragNode.id)
                    .map(n => ({ ...n, children: n.children ? removeNode(n.children) : undefined }))
      }
      newChildren = removeNode(newChildren)
    }

    if (overId === 'canvas-root') {
      newChildren = [...newChildren, dragNode]
    } else {
      const addNode = (nodes: BuilderNode[]): BuilderNode[] => {
        let result: BuilderNode[] = []
        for (const n of nodes) {
          if (`insert-${n.id}` === overId) {
            result.push(dragNode)
            result.push(n)
          } else if (n.id === overId && n.type === 'container') {
            result.push({ ...n, children: [...(n.children || []), dragNode] })
          } else {
            if (n.children) {
              result.push({ ...n, children: addNode(n.children) })
            } else {
              result.push(n)
            }
          }
        }
        return result
      }
      newChildren = addNode(newChildren)
    }
    setRoot(r => ({ ...r, children: newChildren }))
  }

  const selected = React.useMemo(() => {
    const findNode = (nodes: BuilderNode[]): BuilderNode | null => {
      for (const n of nodes) {
        if (n.id === selectedId) return n
        if (n.children) {
          const found = findNode(n.children)
          if (found) return found
        }
      }
      return null
    }
    return findNode(root.children || [])
  }, [root, selectedId])
  React.useEffect(() => { (async()=> setPages(await listPages()))() }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const updateSelected = (n: BuilderNode) => {
    const updateNode = (nodes: BuilderNode[]): BuilderNode[] => {
      return nodes.map(c => {
        if (c.id === n.id) return n
        if (c.children) return { ...c, children: updateNode(c.children) }
        return c
      })
    }
    setRoot({ ...root, children: updateNode(root.children || []) })
  }

  const doSave = async () => {
    const res = await savePage({ id: currentId||undefined, name: pageName, data: root })
    setCurrentId(res.id)
    setPages(await listPages())
    toast.success('Saved!', toasterProps)
  }
  const doLoad = async (id: string) => {
    const res = await getPage(id)
    setCurrentId(res.id); setPageName(res.name); resetHistory(res.data as any)
  }
  const doDelete = () => {
    if (!currentId) { toast.error('No page selected', toasterProps); return; }
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span style={{ fontWeight: 500, color: 'var(--fg)' }}>Do you want to delete this page?</span>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => toast.dismiss(t.id)}>Cancel</button>
          <button className="btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={async () => {
            toast.dismiss(t.id);
            await deletePage(currentId);
            setCurrentId(null); 
            resetHistory({ id: 'root', type: 'container', children: [] }); 
            setPages(await listPages());
            setPageName('');
            toast.success('Page deleted', toasterProps);
          }}>Delete</button>
        </div>
      </div>
    ), { duration: Infinity, id: 'delete-confirm' });
  }
  const exportHTML = async () => {
    let bodyContent = ''
    for (const node of root.children || []) {
      try {
        const res = await generateCode({ target: 'html', design: node as any })
        if (res.html) bodyContent += res.html + '\n'
      } catch (err) {
        console.error('Error generating code for node', node.id, err)
      }
    }

    const html = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>${pageName}</title>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>`

    await downloadTemplate(html);
  }
  const downloadTemplate = async (html: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(pageName || 'template').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await navigator.clipboard.writeText(html);
    toast.success('Export complete! Your HTML file has been downloaded and copied to the clipboard.', toasterProps);
  }

  return (
    <DndContext onDragEnd={handleDrop}>
      <Toaster position="bottom-right" />
      <div className="container">
        <header>
          <img src={logo} alt="QuantumBlocks Logo" className="logo" />
          <p>Drag items onto the canvas, edit properties, save to DB, and export.</p>
        </header>

        <div className="panel toolbar">
          <div className="toolbar-group">
            <button className="btn-secondary redo-undo-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo2 size={16} /> Undo</button>
            <button className="btn-secondary redo-undo-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"><Redo2 size={16} /> Redo</button>
          </div>
          <div className="toolbar-group toolbar-card">
            <label>Page name</label>
            <input 
              value={pageName} 
              onChange={e=>setPageName(e.target.value)} 
              placeholder="Enter page name..." 
            />
            <button className="btn-primary" onClick={doSave} disabled={pageName.trim() === ''}>Save</button>
          </div>
          <div className="toolbar-group toolbar-card">
            <label>Load page</label>
            <select 
              onChange={e=> e.target.value && doLoad(e.target.value)} 
              value={currentId??''} 
            >
              <option value="" disabled>Select…</option>
              {pages.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn-danger" onClick={doDelete}>Delete</button>
          </div>
          <div className="toolbar-group">
            <button className="btn-secondary" onClick={exportHTML} disabled={(root.children||[]).length === 0 || pageName.trim() === ''}>Export Full HTML</button>
          </div>
        </div>

        <div className="grid3">
          <Palette />
          <Canvas root={root} setRoot={setRoot} setSelected={setSelectedId} />
          <Inspector selected={selected} update={updateSelected} />
        </div>

        <footer><small>Built by Ismail Faris • Accessibility-first website Builder (SQLite)</small></footer>
      </div>
    </DndContext>
  )
}
