import { describe, it, expect } from 'vitest'
import { adfToMarkdown, markdownToAdf } from '../src/converter'

describe('roundtrip', () => {
  it('ADF → Markdown → ADF preserves paragraph', () => {
    const adf = {
      version: 1 as const,
      type: 'doc' as const,
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] },
      ],
    }
    const mdResult = adfToMarkdown(adf)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return

    expect(mdResult.value.trim()).toBe('hello world')

    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return

    expect(adfResult.value).toEqual(adf)
  })
})
