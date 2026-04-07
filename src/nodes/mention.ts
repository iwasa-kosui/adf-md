import type { NodeConverter } from '../types'
import { toMdxJsxTextElement, getJsxAttr } from './jsx-helpers'

export const mention: NodeConverter = {
  adfType: 'mention',
  mdastType: [],
  toMdast(node, _context) {
    return toMdxJsxTextElement('Mention', {
      id: (node.attrs?.id as string) ?? '',
      text: (node.attrs?.text as string) ?? '',
    })
  },
  toAdf(node, _context) {
    return {
      type: 'mention',
      attrs: {
        id: getJsxAttr(node, 'id') ?? '',
        text: getJsxAttr(node, 'text') ?? '',
      },
    }
  },
}
