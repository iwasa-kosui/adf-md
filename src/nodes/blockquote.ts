import type { NodeConverter } from '../types'

export const blockquote: NodeConverter = {
  adfType: 'blockquote',
  mdastType: 'blockquote',
  toMdast(node, context) {
    return { type: 'blockquote', children: context.convertChildren(node) } as any
  },
  toAdf(node, context) {
    return { type: 'blockquote', content: context.convertChildren(node) as any[] }
  },
}
