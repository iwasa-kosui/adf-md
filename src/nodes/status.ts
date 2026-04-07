import type { NodeConverter } from '../types'
import { toMdxJsxTextElement, getJsxAttr } from './jsx-helpers'

export const status: NodeConverter = {
  adfType: 'status',
  mdastType: [],
  toMdast(node, _context) {
    return toMdxJsxTextElement('Status', {
      text: (node.attrs?.text as string) ?? '',
      color: (node.attrs?.color as string) ?? 'neutral',
    })
  },
  toAdf(node, _context) {
    return {
      type: 'status',
      attrs: {
        text: getJsxAttr(node, 'text') ?? '',
        color: getJsxAttr(node, 'color') ?? 'neutral',
      },
    }
  },
}
