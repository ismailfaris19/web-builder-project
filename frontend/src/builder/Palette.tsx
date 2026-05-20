import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { NodeType } from './types'

function Item({ type, label, onAddNode }: { type: NodeType; label: string; onAddNode?: (type: NodeType) => void }){
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `palette-${type}`, data: { type } })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onAddNode?.(type);
    } else if (listeners?.onKeyDown) {
      listeners.onKeyDown(e as any);
    }
  }

  return (
    <button 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      onKeyDown={(e) => handleKeyDown(e)} 
      className="palette-item"
      aria-label={ 'Palette item: '+ label + '(Use Enter to choose this item)'}
    >
      {label}
    </button>
  )
}

export default function Palette({ onAddNode }: { onAddNode?: (type: NodeType) => void }){
  return (
    <div className="panel">
      <h3>Palette</h3>
      <div className="palette">
        <Item type="container" label="Container" onAddNode={onAddNode} />
        <Item type="text" label="Text" onAddNode={onAddNode} />
        <Item type="image" label="Image" onAddNode={onAddNode} />
        <Item type="button" label="Button" onAddNode={onAddNode} />
        <Item type="link" label="Link" onAddNode={onAddNode} />
        <Item type="input" label="Input" onAddNode={onAddNode} />
      </div>
    </div>
  )
}
