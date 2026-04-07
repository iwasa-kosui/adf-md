import type { NodeConverter } from '../types'
import type { Heading } from 'mdast'

export const heading: NodeConverter = {
  adfType: 'heading',
  mdastType: 'heading',

  toMdast(node, context) {
    return {
      type: 'heading',
      depth: (node.attrs?.level ?? 1) as Heading['depth'],
      children: context.convertChildren(node) as any[],
    }
  },

  toAdf(node, context) {
    const mdastHeading = node as unknown as Heading
    return {
      type: 'heading',
      attrs: { level: mdastHeading.depth },
      content: context.convertChildren(node) as any[],
    }
  },
}
