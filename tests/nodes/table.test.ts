import { describe, it, expect } from 'vitest'
import { adfToMdast, mdastToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('table', () => {
  const adfTable: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H1' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H2' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'C1' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'C2' }] }] },
          ],
        },
      ],
    }],
  }

  it('ADF table → mdast table', () => {
    const result = adfToMdast(adfTable)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const table = result.value.children[0] as any
      expect(table.type).toBe('table')
      expect(table.children).toHaveLength(2)
      expect(table.children[0].children[0].children[0]).toEqual({ type: 'text', value: 'H1' })
    }
  })

  it('mdast table → ADF table roundtrip', () => {
    const mdastResult = adfToMdast(adfTable)
    if (mdastResult.type !== 'Success') return
    const adfResult = mdastToAdf(mdastResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type === 'Success') {
      expect(adfResult.value).toEqual(adfTable)
    }
  })
})
