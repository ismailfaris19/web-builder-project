import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { NodeType } from './types'

function Item({ type, label }: { type: NodeType; label: string }){
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `palette-${type}`, data: { type } })
  return <button ref={setNodeRef} {...listeners} {...attributes} className="palette-item">{label}</button>
}

export default function Palette(){
  return (
    <div className="panel">
      <h3>Palette</h3>
      <div className="palette">
        <Item type="container" label="Container" />
        <Item type="text" label="Text" />
        <Item type="image" label="Image" />
        <Item type="button" label="Button" />
        <Item type="link" label="Link" />
        <Item type="input" label="Input" />
      </div>
    </div>
  )
}
