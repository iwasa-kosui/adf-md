# Extension API 設計: ミドルウェア型カスタムコンバータ

## 概要

ユーザーが ADF ノードのパース方法を自由に定義できるミドルウェア型の Extension API を提供する。Confluence の Macro（`bodiedExtension` / `inlineExtension` / `extension`）への対応や、既存ビルトインコンバータのオーバーライドが主なユースケース。

## 型定義

```typescript
type Extension = {
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

- `toMdast` / `toAdf` は両方向とも必須
- ノードタイプの指定フィールドは持たない。全ノードに対して呼ばれ、ユーザーが `node.type` で分岐する
- `next()` を呼ぶと次の extension またはビルトインコンバータに委譲される

## ミドルウェアチェーン

すべてのノード変換で以下の順に呼ばれる:

```
extensions[0] → extensions[1] → ... → ビルトインディスパッチ
```

各 extension は `next()` で次に委譲するか、自分で結果を返すかを選択できる。

ビルトインが存在しないノードタイプで `next()` が最終的に呼ばれた場合、既存の `unknownNodeBehavior` オプションに従う（`'skip'` なら空配列、`'error'` ならエラー）。

## API

既存の変換関数のオプションに `extensions` フィールドを追加する:

```typescript
type ConvertOptions = {
  unknownNodeBehavior?: 'skip' | 'error'
  onWarning?: (warning: ConvertWarning) => void
  extensions?: Extension[]
}
```

```typescript
adfToMarkdown(adf, { extensions: [myExtension] })
markdownToAdf(md, { extensions: [myExtension] })
adfToMdast(adf, { extensions: [myExtension] })
mdastToAdf(mdast, { extensions: [myExtension] })
```

## 使用例

### 新規ノード追加（bodiedExtension）

```typescript
adfToMarkdown(adf, {
  extensions: [{
    toMdast: (node, ctx, next) => {
      if (node.type === 'bodiedExtension') {
        const name = node.attrs?.extensionKey ?? 'UnknownMacro'
        return {
          type: 'mdxJsxFlowElement',
          name,
          children: ctx.convertChildren(node),
          attributes: [],
        }
      }
      return next()
    },
    toAdf: (node, ctx, next) => next(),
  }]
})
```

### ビルトインのオーバーライド（panel を blockquote に変換）

```typescript
adfToMarkdown(adf, {
  extensions: [{
    toMdast: (node, ctx, next) => {
      if (node.type === 'panel') {
        return { type: 'blockquote', children: ctx.convertChildren(node) }
      }
      return next()
    },
    toAdf: (node, ctx, next) => next(),
  }]
})
```

### ビルトイン変換結果の加工（プロキシ）

```typescript
adfToMarkdown(adf, {
  extensions: [{
    toMdast: (node, ctx, next) => {
      if (node.type === 'panel') {
        const result = next()
        return Array.isArray(result)
          ? result
          : { ...result, /* 加工 */ }
      }
      return next()
    },
    toAdf: (node, ctx, next) => next(),
  }]
})
```

## 変更箇所

1. `src/types.ts` — `Extension` 型を追加、`ConvertOptions` に `extensions` フィールドを追加
2. `src/nodes/index.ts` — ディスパッチ処理をミドルウェアチェーンでラップ
3. `src/index.ts` — `Extension` 型をエクスポート
4. テスト追加 — 新規ノード追加、オーバーライド、プロキシの3パターン
