import type { NodeConverter } from '../types'
import type { Code } from 'mdast'

export const codeBlock: NodeConverter = {
  adfType: 'codeBlock',
  mdastType: 'code',
  toMdast(node) {
    const text = node.content?.map((c) => c.text ?? '').join('') ?? ''
    return { type: 'code', lang: (node.attrs?.language as string) ?? null, value: text } as any
  },
  toAdf(node) {
    const code = node as unknown as Code
    return {
      type: 'codeBlock',
      attrs: { language: code.lang ?? null },
      content: [{ type: 'text', text: code.value }],
    }
  },
}
