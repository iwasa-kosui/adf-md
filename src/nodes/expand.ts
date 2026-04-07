import type { NodeConverter } from '../types'
import { toMdxJsxFlowElement, getJsxAttr } from './jsx-helpers'

export const expand: NodeConverter = {
  adfType: 'expand',
  mdastType: [],
  toMdast(node, context) {
    return toMdxJsxFlowElement('Expand', { title: (node.attrs?.title as string) ?? '' }, context.convertChildren(node) as any[])
  },
  toAdf(node, context) {
    return { type: 'expand', attrs: { title: getJsxAttr(node, 'title') ?? '' }, content: context.convertChildren(node) as any[] }
  },
}
