import { describe, it, expect, vi } from 'vitest'
import { adfToMdast, mdastToAdf } from '../src/converter'
import type { ADFDocument } from '../src/adf'

describe('adfToMdast', () => {
  it('returns Result.fail when top-level type is not doc', () => {
    const invalid = { version: 1, type: 'notdoc', content: [] } as unknown as ADFDocument
    const result = adfToMdast(invalid, {})
    expect(result.type).toBe('Failure')
    if (result.type === 'Failure') {
      expect(result.error.kind).toBe('invalid_document')
    }
  })

  it('unknown node with skip calls onWarning and returns Result.succeed', () => {
    const onWarning = vi.fn()
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [{ type: 'unknownXyz', content: [] }],
    }
    const result = adfToMdast(doc, { unknownNodeBehavior: 'skip', onWarning })
    expect(result.type).toBe('Success')
    expect(onWarning).toHaveBeenCalledOnce()
  })

  it('unknown node with error returns Result.fail', () => {
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [{ type: 'unknownXyz', content: [] }],
    }
    const result = adfToMdast(doc, { unknownNodeBehavior: 'error' })
    expect(result.type).toBe('Failure')
    if (result.type === 'Failure') {
      expect(result.error.kind).toBe('unknown_node')
    }
  })
})

describe('mdastToAdf', () => {
  it('returns Result.fail when top-level type is not root', () => {
    const invalid = { type: 'paragraph', children: [] } as any
    const result = mdastToAdf(invalid, {})
    expect(result.type).toBe('Failure')
    if (result.type === 'Failure') {
      expect(result.error.kind).toBe('invalid_document')
    }
  })
})
