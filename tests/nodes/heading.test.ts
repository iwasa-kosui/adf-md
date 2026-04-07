import { describe, it, expect } from 'vitest'
import { heading } from '../../src/nodes/heading'
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

describe('heading converter', () => {
  it.each([1, 2, 3, 4, 5, 6])('ADF heading level %i → mdast heading', (level) => {
    const adfNode: ADFNode = {
      type: 'heading',
      attrs: { level },
      content: [{ type: 'text', text: 'Title' }],
    }
    const result = heading.toMdast(adfNode, makeContext())
    expect(result).toEqual({
      type: 'heading',
      depth: level,
      children: [{ type: 'text', value: 'Title' }],
    })
  })

  it('mdast heading → ADF heading', () => {
    const mdastNode = {
      type: 'heading' as const,
      depth: 2,
      children: [{ type: 'text' as const, value: 'Title' }],
    }
    const result = heading.toAdf(mdastNode, makeContext())
    expect(result).toEqual({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Title' }],
    })
  })
})
