import type { NodeConverter } from '../types'

export const paragraph: NodeConverter = {
  adfType: 'paragraph',
  mdastType: 'paragraph',
  toMdast(node, context) {
    return { type: 'paragraph', children: context.convertChildren(node) as any[] }
  },
  toAdf(node, context) {
    return { type: 'paragraph', content: context.convertChildren(node) as any[] }
  },
}
