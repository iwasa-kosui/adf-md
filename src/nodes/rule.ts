import type { NodeConverter } from '../types'

export const rule: NodeConverter = {
  adfType: 'rule',
  mdastType: 'thematicBreak',
  toMdast() { return { type: 'thematicBreak' } as any },
  toAdf() { return { type: 'rule' } },
}
