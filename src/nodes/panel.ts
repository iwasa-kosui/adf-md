import type { NodeConverter } from '../types'
import { toMdxJsxFlowElement, getJsxAttr } from './jsx-helpers'

export const panel: NodeConverter = {
  adfType: 'panel',
  mdastType: [],
  toMdast(node, context) {
    return toMdxJsxFlowElement('Panel', { type: (node.attrs?.panelType as string) ?? 'info' }, context.convertChildren(node) as any[])
  },
  toAdf(node, context) {
    return { type: 'panel', attrs: { panelType: getJsxAttr(node, 'type') ?? 'info' }, content: context.convertChildren(node) as any[] }
  },
}
