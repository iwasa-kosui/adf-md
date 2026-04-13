import type { NodeConverter } from '../types'

// Discriminated union for attachment URL decode result
export type AttachmentUrlAttrs = {
  kind: 'attachment'
  id: string
  type: string
  collection: string
  width?: number
  height?: number
  layout?: string
  widthType?: string
}

type OtherUrl = { kind: 'other' }

export function encodeAttachmentUrl(attrs: {
  id: string
  type: string
  collection: string
  width?: number
  height?: number
  layout?: string
  widthType?: string
}): string {
  const { id, type, collection, width, height, layout, widthType } = attrs
  const path = `attachment:${type}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`

  const params: Record<string, string> = {}
  if (height !== undefined) params.height = String(height)
  if (layout) params.layout = layout
  if (width !== undefined) params.width = String(width)
  if (widthType) params.widthType = widthType

  const queryKeys = Object.keys(params).sort()
  if (queryKeys.length === 0) return path
  const query = queryKeys.map(k => `${k}=${params[k]}`).join('&')
  return `${path}?${query}`
}

export function decodeAttachmentUrl(url: string): AttachmentUrlAttrs | OtherUrl {
  if (!url.startsWith('attachment:')) return { kind: 'other' }

  const rest = url.slice('attachment:'.length)
  const questionIdx = rest.indexOf('?')
  const pathPart = questionIdx === -1 ? rest : rest.slice(0, questionIdx)
  const queryPart = questionIdx === -1 ? undefined : rest.slice(questionIdx + 1)

  const slashCount = pathPart.split('/').length - 1
  if (slashCount < 2) return { kind: 'other' }

  // Split into exactly 3 parts: type, collection, id (only first two slashes are separators)
  const firstSlash = pathPart.indexOf('/')
  const secondSlash = pathPart.indexOf('/', firstSlash + 1)
  const type = pathPart.slice(0, firstSlash)
  const encodedCollection = pathPart.slice(firstSlash + 1, secondSlash)
  const encodedId = pathPart.slice(secondSlash + 1)

  const collection = decodeURIComponent(encodedCollection)
  const id = decodeURIComponent(encodedId)

  const result: AttachmentUrlAttrs = { kind: 'attachment', id, type, collection }

  if (queryPart) {
    const params = new URLSearchParams(queryPart)
    const widthStr = params.get('width')
    const heightStr = params.get('height')
    const layout = params.get('layout')
    const widthType = params.get('widthType')
    if (widthStr !== null) result.width = Number(widthStr)
    if (heightStr !== null) result.height = Number(heightStr)
    if (layout !== null) result.layout = layout
    if (widthType !== null) result.widthType = widthType
  }

  return result
}

export const mediaSingle: NodeConverter = {
  adfType: 'mediaSingle',
  mdastType: [],
  toMdast(node, _context) {
    const mediaChild = node.content?.[0]
    const url = encodeAttachmentUrl({
      id: (mediaChild?.attrs?.id as string) ?? '',
      type: (mediaChild?.attrs?.type as string) ?? 'file',
      collection: (mediaChild?.attrs?.collection as string) ?? '',
      width: node.attrs?.width as number | undefined,
      layout: node.attrs?.layout as string | undefined,
      widthType: node.attrs?.widthType as string | undefined,
      height: mediaChild?.attrs?.height as number | undefined,
    })
    return {
      type: 'paragraph',
      children: [{
        type: 'image',
        url,
        alt: (mediaChild?.attrs?.alt as string) ?? '',
      }],
    } as any
  },
  toAdf(_node, _context) {
    // Handled by paragraph.toAdf disambiguation logic
    return { type: 'mediaSingle', content: [] }
  },
}

export const mediaGroup: NodeConverter = {
  adfType: 'mediaGroup',
  mdastType: [],
  toMdast(node, _context) {
    const images = (node.content ?? []).map(mediaChild => ({
      type: 'image',
      url: encodeAttachmentUrl({
        id: (mediaChild.attrs?.id as string) ?? '',
        type: (mediaChild.attrs?.type as string) ?? 'file',
        collection: (mediaChild.attrs?.collection as string) ?? '',
        height: mediaChild.attrs?.height as number | undefined,
      }),
      alt: (mediaChild.attrs?.alt as string) ?? '',
    }))
    return { type: 'paragraph', children: images } as any
  },
  toAdf(_node, _context) {
    // Handled by paragraph.toAdf disambiguation logic
    return { type: 'mediaGroup', content: [] }
  },
}

export const mediaInline: NodeConverter = {
  adfType: 'mediaInline',
  mdastType: [],
  toMdast(node, _context) {
    return {
      type: 'image',
      url: encodeAttachmentUrl({
        id: (node.attrs?.id as string) ?? '',
        type: (node.attrs?.type as string) ?? 'file',
        collection: (node.attrs?.collection as string) ?? '',
      }),
      alt: (node.attrs?.alt as string) ?? '',
    } as any
  },
  toAdf(_node, _context) {
    // Handled by image converter in text.ts
    return { type: 'mediaInline', attrs: {} }
  },
}
