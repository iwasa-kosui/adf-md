import { describe, it, expect } from 'vitest'
import { codeBlock } from '../../src/nodes/code-block'
import type { TransformContext } from '../../src/types'

const makeContext = (): TransformContext => ({
  convertChildren: () => [],
  options: {},
})

describe('codeBlock converter', () => {
  it('ADF codeBlock → mdast code', () => {
    const adfNode = {
      type: 'codeBlock',
      attrs: { language: 'typescript' },
      content: [{ type: 'text', text: 'const x = 1' }],
    }
    const result = codeBlock.toMdast(adfNode, makeContext())
    expect(result).toEqual({ type: 'code', lang: 'typescript', value: 'const x = 1' })
  })

  it('ADF codeBlock without language → mdast code with null lang', () => {
    const adfNode = {
      type: 'codeBlock',
      content: [{ type: 'text', text: 'hello' }],
    }
    const result = codeBlock.toMdast(adfNode, makeContext())
    expect(result).toEqual({ type: 'code', lang: null, value: 'hello' })
  })

  it('mdast code → ADF codeBlock', () => {
    const mdastNode = { type: 'code' as const, lang: 'javascript', value: 'console.log(1)' }
    const result = codeBlock.toAdf(mdastNode, makeContext())
    expect(result).toEqual({
      type: 'codeBlock',
      attrs: { language: 'javascript' },
      content: [{ type: 'text', text: 'console.log(1)' }],
    })
  })

  it('mdast code without lang → ADF codeBlock with null language', () => {
    const mdastNode = { type: 'code' as const, lang: null, value: 'hello' }
    const result = codeBlock.toAdf(mdastNode, makeContext())
    expect(result).toEqual({
      type: 'codeBlock',
      attrs: { language: null },
      content: [{ type: 'text', text: 'hello' }],
    })
  })
})
