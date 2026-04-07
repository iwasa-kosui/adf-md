import type { List } from 'mdast'
import type { NodeConverter } from '../types'

export const bulletListConverter: NodeConverter = {
  adfType: 'bulletList',
  mdastType: [],
  toMdast(node, context) {
    return {
      type: 'list',
      ordered: false,
      children: (node.content ?? []).map((item) => ({
        type: 'listItem',
        children: context.convertChildren(item) as any[],
      })),
    } as any
  },
  toAdf: () => ({ type: 'bulletList', content: [] }),
}

export const orderedListConverter: NodeConverter = {
  adfType: 'orderedList',
  mdastType: [],
  toMdast(node, context) {
    return {
      type: 'list',
      ordered: true,
      children: (node.content ?? []).map((item) => ({
        type: 'listItem',
        children: context.convertChildren(item) as any[],
      })),
    } as any
  },
  toAdf: () => ({ type: 'orderedList', content: [] }),
}

export const listConverter: NodeConverter = {
  adfType: [],
  mdastType: 'list',
  toMdast: () => ({ type: 'text', value: '' } as any),
  toAdf(node, context) {
    const mdastList = node as unknown as List
    const adfType = mdastList.ordered ? 'orderedList' : 'bulletList'
    return {
      type: adfType,
      content: mdastList.children.map((item) => ({
        type: 'listItem',
        content: context.convertChildren(item) as any[],
      })),
    }
  },
}

export const listItemConverter: NodeConverter = {
  adfType: 'listItem',
  mdastType: 'listItem',
  toMdast(node, context) {
    return {
      type: 'listItem',
      children: context.convertChildren(node) as any[],
    } as any
  },
  toAdf(node, context) {
    return {
      type: 'listItem',
      content: context.convertChildren(node) as any[],
    }
  },
}
