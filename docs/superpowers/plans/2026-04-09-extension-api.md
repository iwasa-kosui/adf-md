# Extension API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ミドルウェア型の Extension API を追加し、ユーザーが ADF ノードのパース方法をカスタム定義できるようにする

**Architecture:** `ConvertOptions` に `extensions: Extension[]` を追加。各ノード変換時に `extensions[0] → extensions[1] → ... → ビルトイン` のミドルウェアチェーンを構築し、`next()` で次に委譲する。ビルトインコンバータのコードは `converter.ts` の `convertChildren` 内のディスパッチロジックに相当する。

**Tech Stack:** TypeScript, bun test, @praha/byethrow

---

### Task 1: Extension 型の追加と ConvertOptions の拡張

**Files:**
- Modify: `src/types.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: `Extension` 型を `src/types.ts` に追加**

```typescript
// src/types.ts の末尾に追加
export type Extension = {
  toMdast: (
    node: ADFNode,
    ctx: TransformContext,
    next: () => MdastNode | MdastNode[]
  ) => MdastNode | MdastNode[]
  toAdf: (
    node: MdastNode,
    ctx: TransformContext,
    next: () => ADFNode | ADFNode[]
  ) => ADFNode | ADFNode[]
}
```

- [ ] **Step 2: `ConvertOptions` に `extensions` フィールドを追加**

`src/types.ts` の `ConvertOptions` を以下に変更:

```typescript
export type ConvertOptions = {
  unknownNodeBehavior?: 'skip' | 'error'
  onWarning?: (warning: ConvertWarning) => void
  extensions?: Extension[]
}
```

- [ ] **Step 3: `Extension` 型を `src/index.ts` からエクスポート**

```typescript
export type { ConvertOptions, ConvertError, ConvertWarning, NodeConverter, TransformContext, Extension } from './types'
```

- [ ] **Step 4: 型チェックの確認**

Run: `cd /Users/kosui/ghq/github.com/iwasa-kosui/adf-md/.wt/extension-api && bunx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/types.ts src/index.ts
git commit -m "feat: Extension型を追加しConvertOptionsにextensionsフィールドを定義"
```

---

### Task 2: ミドルウェアチェーンの実装（ADF → MDAST 方向）

**Files:**
- Modify: `src/converter.ts`
- Test: `tests/extension.test.ts`

- [ ] **Step 1: テストファイルを作成し、新規ノード追加のテストを書く**

```typescript
// tests/extension.test.ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd /Users/kosui/ghq/github.com/iwasa-kosui/adf-md/.wt/extension-api && bun test tests/extension.test.ts`
Expected: bodiedExtension のテストが FAIL（unknown node として skip される）

- [ ] **Step 3: `converter.ts` の `adfToMdast` にミドルウェアチェーンを実装**

`src/converter.ts` の `adfToMdast` 関数内の `convertChildren` を以下のように変更:

```typescript
const extensions = options.extensions ?? []

const convertChildren = (node: ADFNode | MdastNode): (ADFNode | MdastNode)[] => {
  const adf = node as ADFNode
  const content = adf.content ?? []
  return content.flatMap((child) => {
    if (child.type === 'text') {
      const result = adfTextToMdast(child)
      return Array.isArray(result) ? result : [result]
    }

    const builtinConvert = (): MdastNode | MdastNode[] => {
      const converter = adfConverters.get(child.type)
      if (!converter) {
        const error: ConvertError = {
          kind: 'unknown_node',
          message: `Unknown ADF node type: '${child.type}'`,
          node: child,
        }
        if (options.unknownNodeBehavior === 'error') {
          throw error
        }
        options.onWarning?.({ message: error.message, node: child })
        return []
      }
      return converter.toMdast(child, context)
    }

    const chain = extensions.reduceRight<() => MdastNode | MdastNode[]>(
      (next, ext) => () => ext.toMdast(child, context, next),
      builtinConvert,
    )

    const result = chain()
    return Array.isArray(result) ? result : [result]
  })
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `cd /Users/kosui/ghq/github.com/iwasa-kosui/adf-md/.wt/extension-api && bun test tests/extension.test.ts`
Expected: 全テスト PASS

- [ ] **Step 5: 既存テストが壊れていないことを確認**

Run: `cd /Users/kosui/ghq/github.com/iwasa-kosui/adf-md/.wt/extension-api && bun test`
Expected: 全テスト PASS

- [ ] **Step 6: コミット**

```bash
git add src/converter.ts tests/extension.test.ts
git commit -m "feat: ADF→MDAST方向のミドルウェアチェーンを実装"
```

---

### Task 3: ミドルウェアチェーンの実装（MDAST → ADF 方向）

**Files:**
- Modify: `src/converter.ts`
- Modify: `tests/extension.test.ts`

- [ ] **Step 1: MDAST → ADF 方向のテストを追加**

`tests/extension.test.ts` に追加:

```typescript
describe('Extension API (Markdown → ADF)', () => {
  test('extension で MDX コンポーネントを ADF ノードに変換できる', () => {
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

  test('extension で既存の MDAST → ADF 変換をオーバーライドできる', () => {
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
```

import に `markdownToAdf` を追加すること。

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd /Users/kosui/ghq/github.com/iwasa-kosui/adf-md/.wt/extension-api && bun test tests/extension.test.ts`
Expected: MyMacro のテストが FAIL（unknown node として skip される）

- [ ] **Step 3: `converter.ts` の `mdastToAdf` にミドルウェアチェーンを実装**

`src/converter.ts` の `mdastToAdf` 関数内の `convertChildren` を以下のように変更:

```typescript
const extensions = options.extensions ?? []

const convertChildren = (node: ADFNode | MdastNode): (ADFNode | MdastNode)[] => {
  const mdast = node as { children?: MdastNode[] }
  const children = mdast.children ?? []
  return children.flatMap((child) => {
    if (child.type === 'text') {
      return [{ type: 'text', text: (child as { value: string }).value } as ADFNode]
    }

    const builtinConvert = (): ADFNode | ADFNode[] => {
      if (child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement') {
        const jsxName = (child as any).name
        const jsxConverter = jsxConverters.get(jsxName)
        if (jsxConverter) {
          return jsxConverter.toAdf(child as any, context)
        }
      }
      const converter = mdastConverters.get(child.type)
      if (!converter) {
        const error: ConvertError = {
          kind: 'unknown_node',
          message: `Unknown mdast node type: '${child.type}'`,
          node: child,
        }
        if (options.unknownNodeBehavior === 'error') {
          throw error
        }
        options.onWarning?.({ message: error.message, node: child })
        return []
      }
      return converter.toAdf(child, context)
    }

    const chain = extensions.reduceRight<() => ADFNode | ADFNode[]>(
      (next, ext) => () => ext.toAdf(child, context, next),
      builtinConvert,
    )

    const result = chain()
    return Array.isArray(result) ? result : [result]
  })
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `cd /Users/kosui/ghq/github.com/iwasa-kosui/adf-md/.wt/extension-api && bun test tests/extension.test.ts`
Expected: 全テスト PASS

- [ ] **Step 5: 全テストが通ることを確認**

Run: `cd /Users/kosui/ghq/github.com/iwasa-kosui/adf-md/.wt/extension-api && bun test`
Expected: 全テスト PASS

- [ ] **Step 6: コミット**

```bash
git add src/converter.ts tests/extension.test.ts
git commit -m "feat: MDAST→ADF方向のミドルウェアチェーンを実装"
```
