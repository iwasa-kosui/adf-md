import type { NodeConverter } from '../types'
import { toMdxJsxFlowElement, getJsxAttr } from './jsx-helpers'

export const mediaSingle: NodeConverter = {
  adfType: 'mediaSingle',
  mdastType: [],
  toMdast(node, _context) {
    // Flatten: extract attrs from the first media child
    const mediaChild = node.content?.[0]
    return toMdxJsxFlowElement('Media', {
      id: (mediaChild?.attrs?.id as string) ?? '',
      type: (mediaChild?.attrs?.type as string) ?? 'file',
      collection: (mediaChild?.attrs?.collection as string) ?? '',
    }, [])
  },
  toAdf(node, _context) {
    return {
      type: 'mediaSingle',
      content: [{
        type: 'media',
        attrs: {
          id: getJsxAttr(node, 'id') ?? '',
          type: getJsxAttr(node, 'type') ?? 'file',
          collection: getJsxAttr(node, 'collection') ?? '',
        },
      }],
    }
  },
}

export const mediaGroup: NodeConverter = {
  adfType: 'mediaGroup',
  mdastType: [],
  toMdast(node, _context) {
    const mediaChild = node.content?.[0]
    return toMdxJsxFlowElement('Media', {
      id: (mediaChild?.attrs?.id as string) ?? '',
      type: (mediaChild?.attrs?.type as string) ?? 'file',
      collection: (mediaChild?.attrs?.collection as string) ?? '',
    }, [])
  },
  toAdf(node, _context) {
    return {
      type: 'mediaGroup',
      content: [{
        type: 'media',
        attrs: {
          id: getJsxAttr(node, 'id') ?? '',
          type: getJsxAttr(node, 'type') ?? 'file',
          collection: getJsxAttr(node, 'collection') ?? '',
        },
      }],
    }
  },
}
