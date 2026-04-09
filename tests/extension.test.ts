import { describe, test, expect } from 'bun:test'
import { adfToMarkdown } from '../src'
import type { ADFDocument, Extension } from '../src'

describe('Extension API (ADF → Markdown)', () => {
  test('extension で bodiedExtension を MDX コンポーネントに変換できる', () => {
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

  test('extension で既存コンバータをオーバーライドできる', () => {
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

  test('extension で next() を呼んでビルトイン結果を加工できる', () => {
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

  test('複数の extension がチェーンされる', () => {
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

  test('extension なしの場合は既存の動作と同じ', () => {
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
