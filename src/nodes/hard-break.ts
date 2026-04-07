import type { NodeConverter } from '../types'

export const hardBreak: NodeConverter = {
  adfType: 'hardBreak',
  mdastType: 'break',
  toMdast() { return { type: 'break' } as any },
  toAdf() { return { type: 'hardBreak' } },
}
