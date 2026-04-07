import { describe, it, expect } from 'vitest'
import { blockquote } from '../../src/nodes/blockquote'
import type { TransformContext } from '../../src/types'
import type { ADFNode } from '../../src/adf'
import type { Nodes as MdastNode } from 'mdast'

const makeContext = (): TransformContext => ({
  convertChildren: (node) => {
    const adf = node as ADFNode
    if (adf.content) {
      return adf.content.map((child) => {
        if (child.type === 'text') return { type: 'text', value: child.text ?? '' }
        return child as unknown as MdastNode
      })
    }
    const mdast = node as { children?: MdastNode[] }
    if (mdast.children) {
      return mdast.children.map((child) => {
        if (child.type === 'text') return { type: 'text', text: (child as { value: string }).value } as unknown as MdastNode
        return child
      })
    }
    return []
  },
  options: {},
})

describe('blockquote converter', () => {
  it('ADF blockquote → mdast blockquote', () => {
    const adfNode: ADFNode = {
      type: 'blockquote',
      content: [{ type: 'text', text: 'quote' }],
    }
    const result = blockquote.toMdast(adfNode, makeContext())
    expect(result).toEqual({
      type: 'blockquote',
      children: [{ type: 'text', value: 'quote' }],
    })
  })

  it('mdast blockquote → ADF blockquote', () => {
    const mdastNode = {
      type: 'blockquote' as const,
      children: [{ type: 'text' as const, value: 'quote' }],
    }
    const result = blockquote.toAdf(mdastNode, makeContext())
    expect(result).toEqual({
      type: 'blockquote',
      content: [{ type: 'text', text: 'quote' }],
    })
  })
})
