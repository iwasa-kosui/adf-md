import type { NodeConverter } from '../types'
import type { Table } from 'mdast'

export const table: NodeConverter = {
  adfType: 'table',
  mdastType: 'table',

  toMdast(node, context) {
    const rows = (node.content ?? []).map((row) => ({
      type: 'tableRow' as const,
      children: (row.content ?? []).map((cell) => ({
        type: 'tableCell' as const,
        children: flattenParagraphs(context.convertChildren(cell) as any[]),
      })),
    }))
    return { type: 'table', children: rows } as any
  },

  toAdf(node, context) {
    const mdastTable = node as unknown as Table
    return {
      type: 'table',
      content: mdastTable.children.map((row, rowIndex) => ({
        type: 'tableRow',
        content: row.children.map((cell) => ({
          type: rowIndex === 0 ? 'tableHeader' : 'tableCell',
          content: wrapInParagraphs(context.convertChildren(cell as any) as any[]),
        })),
      })),
    }
  },
}

function flattenParagraphs(nodes: any[]): any[] {
  if (nodes.length === 1 && nodes[0].type === 'paragraph') {
    return nodes[0].children
  }
  return nodes
}

function wrapInParagraphs(nodes: any[]): any[] {
  if (nodes.length === 0) return [{ type: 'paragraph', content: [] }]
  if (nodes.every((n: any) => n.type !== 'paragraph')) {
    return [{ type: 'paragraph', content: nodes }]
  }
  return nodes
}
