import { describe, it, expect } from 'vitest'
import { adfToMdast, adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('mention', () => {
  const adfMention: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'mention', attrs: { id: 'user123', text: '@John' },
      }],
    }],
  }

  it('ADF mention → mdxJsxTextElement', () => {
    const result = adfToMdast(adfMention)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const para = result.value.children[0] as any
      const el = para.children[0] as any
      expect(el.type).toBe('mdxJsxTextElement')
      expect(el.name).toBe('Mention')
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'id', value: 'user123' })
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'text', value: '@John' })
    }
  })

  it('roundtrip via Markdown', () => {
    const mdResult = adfToMarkdown(adfMention)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<Mention')
    // remark-mdx serializes inline JSX as a standalone block, losing paragraph wrapper
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type === 'Success') {
      expect(adfResult.value.content[0]).toMatchObject({ type: 'mention', attrs: { id: 'user123', text: '@John' } })
    }
  })
})
