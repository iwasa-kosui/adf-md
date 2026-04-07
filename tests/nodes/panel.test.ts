import { describe, it, expect } from 'vitest'
import { adfToMdast, adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('panel', () => {
  const adfPanel: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'panel', attrs: { panelType: 'info' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'info text' }] }],
    }],
  }

  it('ADF panel → mdxJsxFlowElement', () => {
    const result = adfToMdast(adfPanel)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const el = result.value.children[0] as any
      expect(el.type).toBe('mdxJsxFlowElement')
      expect(el.name).toBe('Panel')
      expect(el.attributes).toContainEqual({ type: 'mdxJsxAttribute', name: 'type', value: 'info' })
    }
  })

  it('roundtrip via Markdown', () => {
    const mdResult = adfToMarkdown(adfPanel)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    expect(mdResult.value).toContain('<Panel')
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type === 'Success') {
      expect(adfResult.value).toEqual(adfPanel)
    }
  })
})
