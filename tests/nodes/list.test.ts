import { describe, it, expect } from 'vitest'
import { bulletListConverter, orderedListConverter, listConverter, listItemConverter } from '../../src/nodes/list'
import type { TransformContext } from '../../src/types'
import type { ADFNode } from '../../src/adf'
import type { Nodes as MdastNode } from 'mdast'

const makeContext = (): TransformContext => ({
  convertChildren: (node) => {
    const adf = node as ADFNode
    if (adf.content) {
      return adf.content.map((child) => {
        if (child.type === 'text') return { type: 'text', value: child.text ?? '' }
        if (child.type === 'paragraph') {
          return {
            type: 'paragraph',
            children: (child.content ?? []).map((c) =>
              c.type === 'text' ? { type: 'text', value: c.text ?? '' } : c,
            ),
          }
        }
        return child as unknown as MdastNode
      })
    }
    const mdast = node as { children?: MdastNode[] }
    if (mdast.children) {
      return mdast.children.map((child) => {
        if (child.type === 'text') return { type: 'text', text: (child as { value: string }).value } as unknown as MdastNode
        if (child.type === 'paragraph') {
          const p = child as { type: 'paragraph'; children: MdastNode[] }
          return {
            type: 'paragraph',
            content: p.children.map((c) =>
              c.type === 'text' ? { type: 'text', text: (c as { value: string }).value } : c,
            ),
          } as unknown as MdastNode
        }
        return child
      })
    }
    return []
  },
  options: {},
})

describe('list converters', () => {
  it('ADF bulletList → mdast unordered list', () => {
    const adfNode: ADFNode = {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'foo' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'bar' }] }] },
      ],
    }
    const result = bulletListConverter.toMdast(adfNode, makeContext())
    expect(result).toMatchObject({
      type: 'list',
      ordered: false,
      children: [
        { type: 'listItem' },
        { type: 'listItem' },
      ],
    })
  })

  it('ADF orderedList → mdast ordered list', () => {
    const adfNode: ADFNode = {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'first' }] }] },
      ],
    }
    const result = orderedListConverter.toMdast(adfNode, makeContext())
    expect(result).toMatchObject({
      type: 'list',
      ordered: true,
      children: [{ type: 'listItem' }],
    })
  })

  it('mdast unordered list → ADF bulletList', () => {
    const mdastNode = {
      type: 'list' as const,
      ordered: false,
      children: [
        {
          type: 'listItem' as const,
          children: [{ type: 'paragraph' as const, children: [{ type: 'text' as const, value: 'foo' }] }],
        },
      ],
    }
    const result = listConverter.toAdf(mdastNode, makeContext())
    expect(result).toMatchObject({
      type: 'bulletList',
      content: [{ type: 'listItem' }],
    })
  })

  it('mdast ordered list → ADF orderedList', () => {
    const mdastNode = {
      type: 'list' as const,
      ordered: true,
      children: [
        {
          type: 'listItem' as const,
          children: [{ type: 'paragraph' as const, children: [{ type: 'text' as const, value: 'first' }] }],
        },
      ],
    }
    const result = listConverter.toAdf(mdastNode, makeContext())
    expect(result).toMatchObject({
      type: 'orderedList',
      content: [{ type: 'listItem' }],
    })
  })

  it('roundtrip: ADF bulletList → mdast → ADF bulletList', () => {
    const adfNode: ADFNode = {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }] },
      ],
    }
    const mdast = bulletListConverter.toMdast(adfNode, makeContext()) as any
    expect(mdast.type).toBe('list')
    expect(mdast.ordered).toBe(false)

    const backToAdf = listConverter.toAdf(mdast, makeContext())
    expect(backToAdf).toMatchObject({ type: 'bulletList' })
  })
})
