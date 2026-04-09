import { describe, test, expect } from 'bun:test'
import { adfToMarkdown, markdownToAdf } from '../src'
import type { ADFDocument, Extension } from '../src'

describe('Extension API (ADF → Markdown)', () => {
  test('converts bodiedExtension to MDX component via extension', () => {
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'bodiedExtension',
          attrs: { extensionKey: 'MyMacro' },
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
          ],
        },
      ],
    }

    const extension: Extension = {
      toMdast: (node, ctx, next) => {
        if (node.type === 'bodiedExtension') {
          return {
            type: 'mdxJsxFlowElement',
            name: (node as any).attrs?.extensionKey ?? 'Unknown',
            children: ctx.convertChildren(node) as any[],
            attributes: [],
          }
        }
        return next()
      },
      toAdf: (_node, _ctx, next) => next(),
    }

    const result = adfToMarkdown(doc, { extensions: [extension] })
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      expect(result.value).toContain('<MyMacro>')
      expect(result.value).toContain('hello')
    }
  })

  test('overrides built-in converter via extension', () => {
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'panel',
          attrs: { panelType: 'info' },
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'info text' }] },
          ],
        },
      ],
    }

    const extension: Extension = {
      toMdast: (node, ctx, next) => {
        if (node.type === 'panel') {
          return {
            type: 'blockquote',
            children: ctx.convertChildren(node) as any[],
          }
        }
        return next()
      },
      toAdf: (_node, _ctx, next) => next(),
    }

    const result = adfToMarkdown(doc, { extensions: [extension] })
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      expect(result.value).toContain('> info text')
      expect(result.value).not.toContain('<Panel')
    }
  })

  test('proxies through next() to observe built-in conversion', () => {
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'body' }],
        },
      ],
    }

    const visited: string[] = []
    const extension: Extension = {
      toMdast: (node, _ctx, next) => {
        visited.push(node.type)
        return next()
      },
      toAdf: (_node, _ctx, next) => next(),
    }

    const result = adfToMarkdown(doc, { extensions: [extension] })
    expect(result.type).toBe('Success')
    expect(visited).toContain('heading')
    expect(visited).toContain('paragraph')
  })

  test('chains multiple extensions in order', () => {
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
      ],
    }

    const order: number[] = []
    const ext1: Extension = {
      toMdast: (_node, _ctx, next) => { order.push(1); return next() },
      toAdf: (_node, _ctx, next) => next(),
    }
    const ext2: Extension = {
      toMdast: (_node, _ctx, next) => { order.push(2); return next() },
      toAdf: (_node, _ctx, next) => next(),
    }

    const result = adfToMarkdown(doc, { extensions: [ext1, ext2] })
    expect(result.type).toBe('Success')
    expect(order).toEqual([1, 2])
  })

  test('works the same without extensions', () => {
    const doc: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
      ],
    }

    const result = adfToMarkdown(doc)
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      expect(result.value).toContain('hello')
    }
  })
})

describe('Extension API (Markdown → ADF)', () => {
  test('converts MDX component to ADF node via extension', () => {
    const md = '<MyMacro>\n\nhello\n\n</MyMacro>'

    const extension: Extension = {
      toMdast: (_node, _ctx, next) => next(),
      toAdf: (node, ctx, next) => {
        if ((node as any).type === 'mdxJsxFlowElement' && (node as any).name === 'MyMacro') {
          return {
            type: 'bodiedExtension',
            attrs: { extensionKey: 'MyMacro', extensionType: 'com.example', layout: 'default' },
            content: ctx.convertChildren(node),
          } as any
        }
        return next()
      },
    }

    const result = markdownToAdf(md, { extensions: [extension] })
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      const ext = result.value.content[0]
      expect(ext.type).toBe('bodiedExtension')
      expect((ext as any).attrs.extensionKey).toBe('MyMacro')
    }
  })

  test('overrides built-in MDAST to ADF conversion via extension', () => {
    const md = '> quoted text'

    const extension: Extension = {
      toMdast: (_node, _ctx, next) => next(),
      toAdf: (node, ctx, next) => {
        if (node.type === 'blockquote') {
          return {
            type: 'panel',
            attrs: { panelType: 'note' },
            content: ctx.convertChildren(node),
          } as any
        }
        return next()
      },
    }

    const result = markdownToAdf(md, { extensions: [extension] })
    expect(result.type).toBe('Success')
    if (result.type === 'Success') {
      expect(result.value.content[0].type).toBe('panel')
    }
  })
})
