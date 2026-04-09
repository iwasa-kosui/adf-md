import { describe, it, expect } from 'vitest'
import { adfToMdast, adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('inlineCard', () => {
  const adfWithUrl: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'inlineCard',
        attrs: { url: 'https://example.com' },
      }],
    }],
  }

  const adfWithData: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'inlineCard',
        attrs: { data: { '@type': 'Document', name: 'Test' } },
      }],
    }],
  }

  it('ADF inlineCard with url → mdxJsxTextElement', () => {
    const result = adfToMdast(adfWithUrl)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    const para = result.value.children[0] as any
    const el = para.children[0]
    expect(el.type).toBe('mdxJsxTextElement')
    expect(el.name).toBe('InlineCard')
    expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'url', value: 'https://example.com' })
  })

  it('ADF inlineCard with data → serialized JSON attribute', () => {
    const result = adfToMdast(adfWithData)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    const para = result.value.children[0] as any
    const el = para.children[0]
    expect(el.attributes).toContainEqual({
      type: 'mdxJsxAttribute', name: 'data',
      value: JSON.stringify({ '@type': 'Document', name: 'Test' }),
    })
  })

  it('roundtrip with url', () => {
    const mdResult = adfToMarkdown(adfWithUrl)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<InlineCard')
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value.content[0]).toMatchObject({
      type: 'inlineCard',
      attrs: { url: 'https://example.com' },
    })
  })

  it('roundtrip with data', () => {
    const mdResult = adfToMarkdown(adfWithData)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value.content[0]).toMatchObject({
      type: 'inlineCard',
      attrs: { data: { '@type': 'Document', name: 'Test' } },
    })
  })
})

describe('blockCard', () => {
  const adf: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'blockCard',
      attrs: { url: 'https://example.com/page' },
    }],
  }

  it('ADF blockCard → mdxJsxFlowElement', () => {
    const result = adfToMdast(adf)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    const el = result.value.children[0] as any
    expect(el.type).toBe('mdxJsxFlowElement')
    expect(el.name).toBe('BlockCard')
    expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'url', value: 'https://example.com/page' })
  })

  it('roundtrip', () => {
    const mdResult = adfToMarkdown(adf)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<BlockCard')
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value.content[0]).toMatchObject({
      type: 'blockCard',
      attrs: { url: 'https://example.com/page' },
    })
  })
})

describe('embedCard', () => {
  const adf: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'embedCard',
      attrs: { url: 'https://example.com/embed', layout: 'center', width: 80 },
    }],
  }

  it('ADF embedCard → mdxJsxFlowElement with layout and width', () => {
    const result = adfToMdast(adf)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    const el = result.value.children[0] as any
    expect(el.type).toBe('mdxJsxFlowElement')
    expect(el.name).toBe('EmbedCard')
    expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'url', value: 'https://example.com/embed' })
    expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'layout', value: 'center' })
    expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'width', value: '80' })
  })

  it('roundtrip preserves numeric attrs', () => {
    const mdResult = adfToMarkdown(adf)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<EmbedCard')
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value.content[0]).toMatchObject({
      type: 'embedCard',
      attrs: { url: 'https://example.com/embed', layout: 'center', width: 80 },
    })
  })
})
