import type { NodeConverter } from '../types'
import { decodeAttachmentUrl, type AttachmentUrlAttrs } from './media'

export const paragraph: NodeConverter = {
  adfType: 'paragraph',
  mdastType: 'paragraph',
  toMdast(node, context) {
    return { type: 'paragraph', children: context.convertChildren(node) as any[] }
  },
  toAdf(node, context) {
    const children: any[] = (node as any).children ?? []

    const decoded = children.map((c: any) =>
      c.type === 'image' ? decodeAttachmentUrl(c.url as string) : { kind: 'other' as const }
    )
    const allAttachment = children.length > 0 && decoded.every(d => d.kind === 'attachment')

    if (allAttachment) {
      const mediaNodes = children.map((c: any, i: number) => {
        const d = decoded[i] as AttachmentUrlAttrs
        return {
          type: 'media',
          attrs: {
            id: d.id,
            type: d.type,
            collection: d.collection,
            ...(c.alt ? { alt: c.alt } : {}),
            ...(d.height !== undefined ? { height: d.height } : {}),
          },
        }
      })

      if (children.length === 1) {
        const d = decoded[0] as AttachmentUrlAttrs
        const wrapperAttrs: Record<string, unknown> = {}
        if (d.layout) wrapperAttrs.layout = d.layout
        if (d.widthType) wrapperAttrs.widthType = d.widthType
        if (d.width !== undefined) wrapperAttrs.width = d.width
        return {
          type: 'mediaSingle',
          ...(Object.keys(wrapperAttrs).length > 0 ? { attrs: wrapperAttrs } : {}),
          content: mediaNodes,
        }
      }

      return { type: 'mediaGroup', content: mediaNodes }
    }

    // Default: regular paragraph (image converter handles attachment: images inline)
    return { type: 'paragraph', content: context.convertChildren(node) as any[] }
  },
}
