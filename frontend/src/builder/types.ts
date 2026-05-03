export type NodeType = 'container' | 'button' | 'link' | 'input' | 'text' | 'image'
export interface BaseNode {
  id: string
  type: NodeType
  name?: string
  label?: string
  description?: string
  intent?: 'primary'|'secondary'|'danger'
  size?: 'sm'|'md'|'lg'
  href?: string
  required?: boolean
  placeholder?: string
  src?: string
  alt?: string
  children?: BuilderNode[]
}
export type BuilderNode = BaseNode
