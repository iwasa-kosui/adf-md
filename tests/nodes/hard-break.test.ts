import { describe, it, expect } from 'vitest'
import { hardBreak } from '../../src/nodes/hard-break'
import type { TransformContext } from '../../src/types'

const makeContext = (): TransformContext => ({
  convertChildren: () => [],
  options: {},
})

describe('hardBreak converter', () => {
  it('ADF hardBreak → mdast break', () => {
    const adfNode = { type: 'hardBreak' }
    const result = hardBreak.toMdast(adfNode, makeContext())
    expect(result).toEqual({ type: 'break' })
  })

  it('mdast break → ADF hardBreak', () => {
    const mdastNode = { type: 'break' as const }
    const result = hardBreak.toAdf(mdastNode, makeContext())
    expect(result).toEqual({ type: 'hardBreak' })
  })
})
