import type { NodeConverter } from '../types'
import { toMdxJsxTextElement, getJsxAttr } from './jsx-helpers'

export const emoji: NodeConverter = {
  adfType: 'emoji',
  mdastType: [],
  toMdast(node, _context) {
    return toMdxJsxTextElement('Emoji', {
      shortName: (node.attrs?.shortName as string) ?? '',
      id: (node.attrs?.id as string) ?? '',
    })
  },
  toAdf(node, _context) {
    return {
      type: 'emoji',
      attrs: {
        shortName: getJsxAttr(node, 'shortName') ?? '',
        id: getJsxAttr(node, 'id') ?? '',
      },
    }
  },
}
