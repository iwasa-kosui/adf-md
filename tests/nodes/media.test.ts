import { describe, it, expect } from 'vitest'
import { adfToMdast, adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('media', () => {
  const adfMediaSingle: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'mediaSingle',
      content: [{
        type: 'media', attrs: { id: 'abc123', type: 'file', collection: 'my-collection' },
      }],
    }],
  }

  it('ADF mediaSingle → mdxJsxFlowElement', () => {
    const result = adfToMdast(adfMediaSingle)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const el = result.value.children[0] as any
      expect(el.type).toBe('mdxJsxFlowElement')
      expect(el.name).toBe('Media')
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'id', value: 'abc123' })
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'type', value: 'file' })
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'collection', value: 'my-collection' })
    }
  })

  it('roundtrip via Markdown', () => {
    const mdResult = adfToMarkdown(adfMediaSingle)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<Media')
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type === 'Success') {
      expect(adfResult.value).toEqual(adfMediaSingle)
    }
  })
})
