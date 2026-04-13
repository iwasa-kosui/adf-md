import { describe, it, expect } from 'vitest'
import { encodeAttachmentUrl, decodeAttachmentUrl } from '../../src/nodes/media'
import { adfToMarkdown, markdownToAdf } from '../../src/converter'
import type { ADFDocument } from '../../src/adf'

describe('URL helpers', () => {
  it('encodes basic attachment URL', () => {
    const url = encodeAttachmentUrl({ id: 'abc123', type: 'file', collection: 'my-collection' })
    expect(url).toBe('attachment:file/my-collection/abc123')
  })

  it('encodes attachment URL with all optional attrs', () => {
    const url = encodeAttachmentUrl({
      id: 'abc123',
      type: 'file',
      collection: 'my-collection',
      width: 800,
      height: 600,
      layout: 'center',
      widthType: 'pixel',
    })
    expect(url).toBe('attachment:file/my-collection/abc123?height=600&layout=center&width=800&widthType=pixel')
  })

  it('URL-encodes id and collection with special characters', () => {
    const url = encodeAttachmentUrl({ id: 'a/b:c', type: 'file', collection: 'col/lect:ion' })
    expect(url).toBe('attachment:file/col%2Flect%3Aion/a%2Fb%3Ac')
  })

  it('omits query string when no optional attrs', () => {
    const url = encodeAttachmentUrl({ id: 'x', type: 'link', collection: 'col' })
    expect(url).toBe('attachment:link/col/x')
    expect(url).not.toContain('?')
  })

  it('decodes basic attachment URL', () => {
    const result = decodeAttachmentUrl('attachment:file/my-collection/abc123')
    expect(result).toEqual({ kind: 'attachment', id: 'abc123', type: 'file', collection: 'my-collection' })
  })

  it('decodes attachment URL with all optional attrs', () => {
    const result = decodeAttachmentUrl('attachment:file/my-collection/abc123?height=600&layout=center&width=800&widthType=pixel')
    expect(result).toEqual({
      kind: 'attachment',
      id: 'abc123',
      type: 'file',
      collection: 'my-collection',
      width: 800,
      height: 600,
      layout: 'center',
      widthType: 'pixel',
    })
  })

  it('decodes URL-encoded id and collection', () => {
    const result = decodeAttachmentUrl('attachment:file/col%2Flect%3Aion/a%2Fb%3Ac')
    expect(result).toEqual({ kind: 'attachment', id: 'a/b:c', type: 'file', collection: 'col/lect:ion' })
  })

  it('returns { kind: other } for non-attachment URLs', () => {
    expect(decodeAttachmentUrl('https://example.com/image.png')).toEqual({ kind: 'other' })
    expect(decodeAttachmentUrl('mailto:foo@bar.com')).toEqual({ kind: 'other' })
    expect(decodeAttachmentUrl('')).toEqual({ kind: 'other' })
  })

  it('encode/decode roundtrip preserves all attrs', () => {
    const attrs = {
      id: 'a/b:c',
      type: 'file' as const,
      collection: 'col/lect:ion',
      width: 800,
      height: 600,
      layout: 'center',
      widthType: 'pixel',
    }
    const url = encodeAttachmentUrl(attrs)
    const decoded = decodeAttachmentUrl(url)
    expect(decoded).toEqual({ kind: 'attachment', ...attrs })
  })
})

describe('mediaSingle', () => {
  const adfMediaSingle: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'mediaSingle',
      content: [{
        type: 'media', attrs: { id: 'abc123', type: 'file', collection: 'my-collection' },
      }],
    }],
  }

  it('ADF mediaSingle → Markdown image with attachment: URL', () => {
    const result = adfToMarkdown(adfMediaSingle)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    expect(result.value).toContain('![](attachment:file/my-collection/abc123)')
  })

  it('preserves alt text', () => {
    const adf: ADFDocument = {
      version: 1, type: 'doc',
      content: [{
        type: 'mediaSingle',
        content: [{
          type: 'media', attrs: { id: 'abc123', type: 'file', collection: 'col', alt: 'my image' },
        }],
      }],
    }
    const result = adfToMarkdown(adf)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    expect(result.value).toContain('![my image](attachment:file/col/abc123)')
  })

  it('preserves layout, widthType, width, height in URL', () => {
    const adf: ADFDocument = {
      version: 1, type: 'doc',
      content: [{
        type: 'mediaSingle',
        attrs: { layout: 'center', widthType: 'pixel', width: 800 },
        content: [{
          type: 'media', attrs: { id: 'abc123', type: 'file', collection: 'col', height: 600 },
        }],
      }],
    }
    const result = adfToMarkdown(adf)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    // remark-stringify escapes & as \& in URLs; CommonMark parsers correctly unescape \& to &
    expect(result.value).toContain('attachment:file/col/abc123?')
    expect(result.value).toMatch(/height=600/)
    expect(result.value).toMatch(/layout=center/)
    expect(result.value).toMatch(/width=800/)
    expect(result.value).toMatch(/widthType=pixel/)
  })

  it('ADF → Markdown → ADF roundtrip (basic)', () => {
    const mdResult = adfToMarkdown(adfMediaSingle)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value).toEqual(adfMediaSingle)
  })

  it('ADF → Markdown → ADF roundtrip (with all attrs)', () => {
    const adf: ADFDocument = {
      version: 1, type: 'doc',
      content: [{
        type: 'mediaSingle',
        attrs: { layout: 'center', widthType: 'pixel', width: 800 },
        content: [{
          type: 'media', attrs: { id: 'abc123', type: 'file', collection: 'col', alt: 'my image', height: 600 },
        }],
      }],
    }
    const mdResult = adfToMarkdown(adf)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value).toEqual(adf)
  })
})

describe('mediaGroup', () => {
  const adfMediaGroup: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'mediaGroup',
      content: [
        { type: 'media', attrs: { id: 'id1', type: 'file', collection: 'col' } },
        { type: 'media', attrs: { id: 'id2', type: 'file', collection: 'col' } },
        { type: 'media', attrs: { id: 'id3', type: 'file', collection: 'col' } },
      ],
    }],
  }

  it('ADF mediaGroup → Markdown with multiple images', () => {
    const result = adfToMarkdown(adfMediaGroup)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    expect(result.value).toContain('![](attachment:file/col/id1)')
    expect(result.value).toContain('![](attachment:file/col/id2)')
    expect(result.value).toContain('![](attachment:file/col/id3)')
  })

  it('ADF → Markdown → ADF roundtrip (3 children)', () => {
    const mdResult = adfToMarkdown(adfMediaGroup)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value).toEqual(adfMediaGroup)
  })
})

describe('mediaInline', () => {
  const adfWithInline: ADFDocument = {
    version: 1, type: 'doc',
    content: [{
      type: 'paragraph',
      content: [
        { type: 'text', text: 'See ' },
        { type: 'mediaInline', attrs: { id: 'img1', type: 'file', collection: 'col' } },
        { type: 'text', text: ' here' },
      ],
    }],
  }

  it('ADF mediaInline → inline image with attachment: URL', () => {
    const result = adfToMarkdown(adfWithInline)
    expect(result.type).toBe('Success')
    if (result.type !== 'Success') return
    expect(result.value).toContain('![](attachment:file/col/img1)')
  })

  it('ADF → Markdown → ADF roundtrip (mediaInline inside paragraph with text)', () => {
    const mdResult = adfToMarkdown(adfWithInline)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return
    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    expect(adfResult.value).toEqual(adfWithInline)
  })
})

describe('non-attachment images', () => {
  it('regular markdown image stays as-is and is not converted to ADF media', () => {
    const md = '![alt text](https://example.com/image.png)\n'
    const adfResult = markdownToAdf(md)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return
    // Should produce a paragraph, not mediaSingle/mediaGroup
    const firstNode = adfResult.value.content[0]
    expect(firstNode.type).toBe('paragraph')
    // No media nodes
    const hasMedia = JSON.stringify(adfResult.value).includes('"mediaSingle"')
      || JSON.stringify(adfResult.value).includes('"mediaGroup"')
      || JSON.stringify(adfResult.value).includes('"mediaInline"')
    expect(hasMedia).toBe(false)
  })
})
