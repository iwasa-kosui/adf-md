import type { ADFNode } from './adf'
import type { Nodes as MdastNode, Root as MdastRoot } from 'mdast'

export type ConvertWarning = {
  message: string
  node: unknown
}

export type ConvertError = {
  kind: 'invalid_document' | 'unknown_node'
  message: string
  node: unknown
}

export type ConvertOptions = {
  unknownNodeBehavior?: 'skip' | 'error'
  onWarning?: (warning: ConvertWarning) => void
  middlewares?: Middleware[]
}

export type TransformContext = {
  convertChildren: (node: ADFNode | MdastNode) => (ADFNode | MdastNode)[]
  options: ConvertOptions
}

export type NodeConverter = {
  adfType: string | string[]
  mdastType: string | string[]
  toMdast: (node: ADFNode, context: TransformContext) => MdastNode | MdastNode[]
  toAdf: (node: MdastNode, context: TransformContext) => ADFNode | ADFNode[]
}

export type Middleware = {
  toMdast: (
    node: ADFNode,
    ctx: TransformContext,
    next: () => MdastNode | MdastNode[]
  ) => MdastNode | MdastNode[]
  toAdf: (
    node: MdastNode,
    ctx: TransformContext,
    next: () => ADFNode | ADFNode[]
  ) => ADFNode | ADFNode[]
}
