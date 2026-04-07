import { describe, it, expect } from 'vitest'
import { adfToMdast, adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('expand', () => {
  const adfExpand: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'expand', attrs: { title: 'Click to expand' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hidden content' }] }],
    }],
  }

  it('ADF expand → mdxJsxFlowElement', () => {
    const result = adfToMdast(adfExpand)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const el = result.value.children[0] as any
      expect(el.type).toBe('mdxJsxFlowElement')
      expect(el.name).toBe('Expand')
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'title', value: 'Click to expand' })
    }
  })

  it('roundtrip via Markdown', () => {
    const mdResult = adfToMarkdown(adfExpand)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<Expand')
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type === 'Success') {
      expect(adfResult.value).toEqual(adfExpand)
    }
  })
})
