import { describe, it, expect } from 'vitest'
import { adfToMdast, adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('emoji', () => {
  const adfEmoji: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'emoji', attrs: { shortName: ':smile:', id: '1f604' },
      }],
    }],
  }

  it('ADF emoji → mdxJsxTextElement', () => {
    const result = adfToMdast(adfEmoji)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const para = result.value.children[0] as any
      const el = para.children[0] as any
      expect(el.type).toBe('mdxJsxTextElement')
      expect(el.name).toBe('Emoji')
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'shortName', value: ':smile:' })
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'id', value: '1f604' })
    }
  })

  it('roundtrip via Markdown', () => {
    const mdResult = adfToMarkdown(adfEmoji)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<Emoji')
    // remark-mdx serializes inline JSX as a standalone block, losing paragraph wrapper
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type === 'Success') {
      expect(adfResult.value.content[0]).toMatchObject({ type: 'emoji', attrs: { shortName: ':smile:', id: '1f604' } })
    }
  })
})
