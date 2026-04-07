import { describe, it, expect } from 'vitest'
import { rule } from '../../src/nodes/rule'
import type { TransformContext } from '../../src/types'

const makeContext = (): TransformContext => ({
  convertChildren: () => [],
  options: {},
})

describe('rule converter', () => {
  it('ADF rule → mdast thematicBreak', () => {
    const adfNode = { type: 'rule' }
    const result = rule.toMdast(adfNode, makeContext())
    expect(result).toEqual({ type: 'thematicBreak' })
  })

  it('mdast thematicBreak → ADF rule', () => {
    const mdastNode = { type: 'thematicBreak' as const }
    const result = rule.toAdf(mdastNode, makeContext())
    expect(result).toEqual({ type: 'rule' })
  })
})
