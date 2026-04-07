import { describe, it, expect } from 'vitest'
import { adfToMdast, adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('status', () => {
  const adfStatus: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'status', attrs: { text: 'In Progress', color: 'blue' },
      }],
    }],
  }

  it('ADF status → mdxJsxTextElement', () => {
    const result = adfToMdast(adfStatus)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const para = result.value.children[0] as any
      const el = para.children[0] as any
      expect(el.type).toBe('mdxJsxTextElement')
      expect(el.name).toBe('Status')
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'text', value: 'In Progress' })
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'color', value: 'blue' })
    }
  })

  it('roundtrip via Markdown', () => {
    const mdResult = adfToMarkdown(adfStatus)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<Status')
    // remark-mdx serializes inline JSX as a standalone block, losing paragraph wrapper
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type === 'Success') {
      expect(adfResult.value.content[0]).toMatchObject({ type: 'status', attrs: { text: 'In Progress', color: 'blue' } })
    }
  })
})
