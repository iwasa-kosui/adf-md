import type { NodeConverter } from '../types'
import { toMdxJsxTextElement, toMdxJsxFlowElement, getJsxAttr } from './jsx-helpers'

function serializeData(data: unknown): string {
  return JSON.stringify(data)
}

function deserializeData(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined
  return JSON.parse(value) as Record<string, unknown>
}

function buildCardAttrs(node: { attrs?: Record<string, unknown> }): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (node.attrs?.url) attrs.url = node.attrs.url as string
  if (node.attrs?.data) attrs.data = serializeData(node.attrs.data)
  return attrs
}

function restoreCardAttrs(node: any): Record<string, unknown> {
  const attrs: Record<string, unknown> = {}
  const url = getJsxAttr(node, 'url')
  if (url) attrs.url = url
  const data = deserializeData(getJsxAttr(node, 'data'))
  if (data) attrs.data = data
  return attrs
}

export const inlineCard: NodeConverter = {
  adfType: 'inlineCard',
  mdastType: [],
  toMdast(node, _context) {
    return toMdxJsxTextElement('InlineCard', buildCardAttrs(node))
  },
  toAdf(node, _context) {
    return { type: 'inlineCard', attrs: restoreCardAttrs(node) }
  },
}

export const blockCard: NodeConverter = {
  adfType: 'blockCard',
  mdastType: [],
  toMdast(node, _context) {
    return toMdxJsxFlowElement('BlockCard', buildCardAttrs(node), [])
  },
  toAdf(node, _context) {
    return { type: 'blockCard', attrs: restoreCardAttrs(node) }
  },
}

export const embedCard: NodeConverter = {
  adfType: 'embedCard',
  mdastType: [],
  toMdast(node, _context) {
    const attrs: Record<string, string> = {}
    if (node.attrs?.url) attrs.url = node.attrs.url as string
    if (node.attrs?.layout) attrs.layout = node.attrs.layout as string
    if (node.attrs?.width != null) attrs.width = String(node.attrs.width)
    if (node.attrs?.originalHeight != null) attrs.originalHeight = String(node.attrs.originalHeight)
    if (node.attrs?.originalWidth != null) attrs.originalWidth = String(node.attrs.originalWidth)
    return toMdxJsxFlowElement('EmbedCard', attrs, [])
  },
  toAdf(node, _context) {
    const attrs: Record<string, unknown> = {}
    const url = getJsxAttr(node, 'url')
    if (url) attrs.url = url
    const layout = getJsxAttr(node, 'layout')
    if (layout) attrs.layout = layout
    const width = getJsxAttr(node, 'width')
    if (width) attrs.width = Number(width)
    const originalHeight = getJsxAttr(node, 'originalHeight')
    if (originalHeight) attrs.originalHeight = Number(originalHeight)
    const originalWidth = getJsxAttr(node, 'originalWidth')
    if (originalWidth) attrs.originalWidth = Number(originalWidth)
    return { type: 'embedCard', attrs }
  },
}
