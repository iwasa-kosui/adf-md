import type { ADFNode, ADFMark } from '../adf'
import type { Nodes as MdastNode } from 'mdast'
import type { TransformContext } from '../types'

// ADF text with marks → mdast nodes
export function adfTextToMdast(node: ADFNode): MdastNode | MdastNode[] {
  const base: MdastNode = { type: 'text', value: node.text ?? '' } as any
  if (!node.marks || node.marks.length === 0) return base
  return wrapWithMarks(base, node.marks)
}

function wrapWithMarks(node: MdastNode, marks: ADFMark[]): MdastNode | MdastNode[] {
  let result: MdastNode | MdastNode[] = node
  for (const mark of [...marks].reverse()) {
    result = applyMark(result, mark)
  }
  return result
}

function applyMark(inner: MdastNode | MdastNode[], mark: ADFMark): MdastNode | MdastNode[] {
  const children = Array.isArray(inner) ? inner : [inner]
  switch (mark.type) {
    case 'strong':
      return { type: 'strong', children } as any
    case 'em':
      return { type: 'emphasis', children } as any
    case 'code':
      return { type: 'inlineCode', value: extractText(children) } as any
    case 'strike':
      return { type: 'delete', children } as any
    case 'link':
      return { type: 'link', url: (mark.attrs?.href as string) ?? '', children } as any
    case 'underline':
      return [
        { type: 'html', value: '<u>' } as any,
        ...children,
        { type: 'html', value: '</u>' } as any,
      ]
    default:
      return children.length === 1 ? children[0] : children
  }
}

function extractText(nodes: MdastNode[]): string {
  return nodes.map((n) => ('value' in n ? (n as any).value : '')).join('')
}

// mdast mark nodes → ADF nodes with marks
function addMarkToChildren(node: MdastNode, mark: ADFMark, context: TransformContext): ADFNode[] {
  const children = context.convertChildren(node) as ADFNode[]
  return children.map((child) => ({
    ...child,
    marks: [...(child.marks ?? []), mark],
  }))
}

export const mdastStrongToAdf = (node: MdastNode, context: TransformContext): ADFNode[] =>
  addMarkToChildren(node, { type: 'strong' }, context)

export const mdastEmphasisToAdf = (node: MdastNode, context: TransformContext): ADFNode[] =>
  addMarkToChildren(node, { type: 'em' }, context)

export const mdastDeleteToAdf = (node: MdastNode, context: TransformContext): ADFNode[] =>
  addMarkToChildren(node, { type: 'strike' }, context)

export const mdastLinkToAdf = (node: MdastNode, context: TransformContext): ADFNode[] =>
  addMarkToChildren(node, { type: 'link', attrs: { href: (node as any).url } }, context)

export const mdastInlineCodeToAdf = (node: MdastNode): ADFNode[] =>
  [{ type: 'text', text: (node as any).value, marks: [{ type: 'code' }] }]
