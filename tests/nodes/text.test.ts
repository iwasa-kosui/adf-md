import { test, expect, describe } from 'vitest'
import { adfTextToMdast, mdastStrongToAdf, mdastEmphasisToAdf, mdastDeleteToAdf, mdastLinkToAdf, mdastInlineCodeToAdf } from '../../src/nodes/text'
import type { ADFNode } from '../../src/adf'
import type { Nodes as MdastNode } from 'mdast'
import type { TransformContext } from '../../src/types'

function makeContext(children: ADFNode[] = []): TransformContext {
  return {
    convertChildren: (_node) => children,
    options: {},
  }
}

describe('adfTextToMdast', () => {
  test('plain text - no marks', () => {
    const node: ADFNode = { type: 'text', text: 'hello' }
    const result = adfTextToMdast(node)
    expect(result).toEqual({ type: 'text', value: 'hello' })
  })

  test('strong mark', () => {
    const node: ADFNode = { type: 'text', text: 'bold', marks: [{ type: 'strong' }] }
    const result = adfTextToMdast(node)
    expect(result).toEqual({
      type: 'strong',
      children: [{ type: 'text', value: 'bold' }],
    })
  })

  test('em mark', () => {
    const node: ADFNode = { type: 'text', text: 'italic', marks: [{ type: 'em' }] }
    const result = adfTextToMdast(node)
    expect(result).toEqual({
      type: 'emphasis',
      children: [{ type: 'text', value: 'italic' }],
    })
  })

  test('code mark', () => {
    const node: ADFNode = { type: 'text', text: 'const x = 1', marks: [{ type: 'code' }] }
    const result = adfTextToMdast(node)
    expect(result).toEqual({ type: 'inlineCode', value: 'const x = 1' })
  })

  test('strike mark', () => {
    const node: ADFNode = { type: 'text', text: 'deleted', marks: [{ type: 'strike' }] }
    const result = adfTextToMdast(node)
    expect(result).toEqual({
      type: 'delete',
      children: [{ type: 'text', value: 'deleted' }],
    })
  })

  test('link mark', () => {
    const node: ADFNode = {
      type: 'text',
      text: 'click',
      marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
    }
    const result = adfTextToMdast(node)
    expect(result).toEqual({
      type: 'link',
      url: 'https://example.com',
      children: [{ type: 'text', value: 'click' }],
    })
  })

  test('underline mark - produces html tags', () => {
    const node: ADFNode = { type: 'text', text: 'underlined', marks: [{ type: 'underline' }] }
    const result = adfTextToMdast(node)
    expect(Array.isArray(result)).toBe(true)
    const arr = result as MdastNode[]
    expect(arr[0]).toEqual({ type: 'html', value: '<u>' })
    expect(arr[1]).toEqual({ type: 'text', value: 'underlined' })
    expect(arr[2]).toEqual({ type: 'html', value: '</u>' })
  })

  test('multiple marks - strong + em → nested', () => {
    const node: ADFNode = {
      type: 'text',
      text: 'bold italic',
      marks: [{ type: 'strong' }, { type: 'em' }],
    }
    const result = adfTextToMdast(node)
    expect(result).toEqual({
      type: 'strong',
      children: [
        {
          type: 'emphasis',
          children: [{ type: 'text', value: 'bold italic' }],
        },
      ],
    })
  })
})

describe('mdast → ADF mark converters', () => {
  test('mdastStrongToAdf adds strong mark', () => {
    const textChild: ADFNode = { type: 'text', text: 'bold' }
    const context = makeContext([textChild])
    const node = { type: 'strong', children: [] } as any
    const result = mdastStrongToAdf(node, context)
    expect(result).toEqual([{ type: 'text', text: 'bold', marks: [{ type: 'strong' }] }])
  })

  test('mdastEmphasisToAdf adds em mark', () => {
    const textChild: ADFNode = { type: 'text', text: 'italic' }
    const context = makeContext([textChild])
    const node = { type: 'emphasis', children: [] } as any
    const result = mdastEmphasisToAdf(node, context)
    expect(result).toEqual([{ type: 'text', text: 'italic', marks: [{ type: 'em' }] }])
  })

  test('mdastDeleteToAdf adds strike mark', () => {
    const textChild: ADFNode = { type: 'text', text: 'deleted' }
    const context = makeContext([textChild])
    const node = { type: 'delete', children: [] } as any
    const result = mdastDeleteToAdf(node, context)
    expect(result).toEqual([{ type: 'text', text: 'deleted', marks: [{ type: 'strike' }] }])
  })

  test('mdastLinkToAdf adds link mark with href', () => {
    const textChild: ADFNode = { type: 'text', text: 'click' }
    const context = makeContext([textChild])
    const node = { type: 'link', url: 'https://example.com', children: [] } as any
    const result = mdastLinkToAdf(node, context)
    expect(result).toEqual([
      {
        type: 'text',
        text: 'click',
        marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
      },
    ])
  })

  test('mdastInlineCodeToAdf creates text with code mark', () => {
    const node = { type: 'inlineCode', value: 'const x = 1' } as any
    const result = mdastInlineCodeToAdf(node)
    expect(result).toEqual([{ type: 'text', text: 'const x = 1', marks: [{ type: 'code' }] }])
  })

  test('preserves existing marks when adding new one', () => {
    const textChild: ADFNode = { type: 'text', text: 'bold italic', marks: [{ type: 'em' }] }
    const context = makeContext([textChild])
    const node = { type: 'strong', children: [] } as any
    const result = mdastStrongToAdf(node, context)
    expect(result).toEqual([
      { type: 'text', text: 'bold italic', marks: [{ type: 'em' }, { type: 'strong' }] },
    ])
  })
})
