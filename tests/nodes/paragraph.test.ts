import { describe, it, expect } from 'vitest'
import { paragraph } from '../../src/nodes/paragraph'
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

describe('paragraph converter', () => {
  it('ADF paragraph with text → mdast paragraph with text', () => {
    const adfNode: ADFNode = {
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello' }],
    }
    const result = paragraph.toMdast(adfNode, makeContext())
    expect(result).toEqual({
      type: 'paragraph',
      children: [{ type: 'text', value: 'hello' }],
    })
  })

  it('mdast paragraph with text → ADF paragraph with text', () => {
    const mdastNode = {
      type: 'paragraph' as const,
      children: [{ type: 'text' as const, value: 'hello' }],
    }
    const result = paragraph.toAdf(mdastNode, makeContext())
    expect(result).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello' }],
    })
  })
})
