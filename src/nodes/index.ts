import { paragraph } from './paragraph'
import { heading } from './heading'
import type { NodeConverter } from '../types'

const converters: NodeConverter[] = [paragraph, heading]

export const adfConverters = new Map<string, NodeConverter>()
export const mdastConverters = new Map<string, NodeConverter>()

for (const c of converters) {
  const adfTypes = Array.isArray(c.adfType) ? c.adfType : [c.adfType]
  for (const t of adfTypes) adfConverters.set(t, c)
  const mdastTypes = Array.isArray(c.mdastType) ? c.mdastType : [c.mdastType]
  for (const t of mdastTypes) mdastConverters.set(t, c)
}
