# adf-md 設計仕様書

## 概要

Atlassian Document Format (ADF) と Markdown を双方向に変換するNode.jsライブラリ。Markdownベースのワークフローで Jira/Confluence コンテンツを管理する用途を想定する。

## 設計方針

- ADF と mdast (remark の AST) の間で直接ツリー変換を行う
- ADF固有の情報はMDX (JSX) 構文で保持し、ラウンドトリップの情報損失を最小化する
- 例外は一切スローせず、`@praha/byethrow` の `Result` 型でエラーを表現する
- 型定義は `interface` ではなく `type` で統一する

## パッケージ情報

- ランタイム: Node.js専用
- モジュール形式: ESM + CJS dual package
- テストフレームワーク: vitest

## 依存ライブラリ

- unified / remark (remarkParse, remarkStringify)
- remark-mdx (MDX JSX構文のパース/生成)
- remark-gfm (GFM table対応)
- mdast-util-gfm-table
- @praha/byethrow (Result型によるエラーハンドリング)

## 公開API

```typescript
import { Result } from '@praha/byethrow'

// ADF JSON → Markdown文字列
function adfToMarkdown(adf: ADFDocument, options?: ConvertOptions): Result<string, ConvertError>

// Markdown文字列 → ADF JSON
function markdownToAdf(markdown: string, options?: ConvertOptions): Result<ADFDocument, ConvertError>

// 上級者向け: AST間変換（remarkパイプラインに組み込む用途）
function adfToMdast(adf: ADFDocument, options?: ConvertOptions): Result<MdastRoot, ConvertError>
function mdastToAdf(mdast: MdastRoot, options?: ConvertOptions): Result<ADFDocument, ConvertError>
```

### 型定義

```typescript
type ConvertWarning = {
  message: string
  node: unknown
}

type ConvertError = {
  kind: 'invalid_document' | 'unknown_node'
  message: string
  node: unknown
}

type ConvertOptions = {
  // 未知ノードの処理: 'skip'(デフォルト) | 'error'
  unknownNodeBehavior?: 'skip' | 'error'
  // 警告のコールバック（デフォルトはnoop）
  onWarning?: (warning: ConvertWarning) => void
}
```

## ノード変換マッピング

### 基本マッピング（情報損失なし）

| ADF Node | Markdown / mdast |
|---|---|
| doc | root |
| paragraph | paragraph |
| heading (level 1-6) | heading |
| text + marks (strong, em, code, strike, underline) | emphasis, strong, inlineCode, delete, `<u>` |
| bulletList / listItem | list (ordered: false) |
| orderedList / listItem | list (ordered: true) |
| codeBlock (language) | code (lang) |
| blockquote | blockquote |
| rule | thematicBreak |
| hardBreak | break |
| link mark | link |
| table / tableRow / tableHeader / tableCell | GFM table (mdast-util-gfm-table) |

### MDX JSX構文によるADF固有ノードの保持

remark-mdxを使い、ADF固有のノードをJSX構文でMarkdown側に保持する。

```markdown
<Panel type="info">
パネルの中身
</Panel>

<Expand title="詳細">
折りたたみの中身
</Expand>

<Status text="IN PROGRESS" color="blue" />

<Mention id="abc123" text="@kosui" />

<Emoji shortName=":thumbsup:" id="1f44d" />

<Media id="file-id" type="file" collection="collection-name" />
```

ADF → Markdown変換時にこのJSX構文を生成し、Markdown → ADF変換時にパースしてADFノードに復元する。

## 内部アーキテクチャ

### ディレクトリ構成

```
src/
├── index.ts                  # 公開API
├── converter.ts              # トラバーサ（レジストリからnodeMapを参照）
├── nodes/
│   ├── index.ts              # レジストリ + NodeConverter型定義
│   ├── paragraph.ts
│   ├── heading.ts
│   ├── text.ts
│   ├── list.ts
│   ├── code-block.ts
│   ├── blockquote.ts
│   ├── table.ts
│   ├── media.ts
│   ├── panel.ts
│   ├── expand.ts
│   ├── status.ts
│   ├── mention.ts
│   └── emoji.ts
└── adf.ts                    # ADF型定義（ADFDocument, ADFNodeなど）
```

### コンパニオンオブジェクトパターン

各ノードファイルは `toMdast` と `toAdf` の双方向変換を1つのオブジェクトにまとめる。

```typescript
// nodes/paragraph.ts
export const paragraph: NodeConverter = {
  adfType: 'paragraph',
  mdastType: 'paragraph',

  toMdast(node: ADFNode, context: TransformContext): MdastNode {
    return { type: 'paragraph', children: context.convertChildren(node) }
  },

  toAdf(node: MdastNode, context: TransformContext): ADFNode {
    return { type: 'paragraph', content: context.convertChildren(node) }
  },
}
```

### 変換フロー

**ADF → Markdown:** ADFDocument → `adfToMdast` でADFツリーを再帰トラバースし各ノードをmdastに変換 → `remarkStringify` + `remark-mdx` + `remark-gfm` でMarkdown文字列を生成

**Markdown → ADF:** Markdown文字列 → `remarkParse` + `remark-mdx` + `remark-gfm` でmdastに変換 → `mdastToAdf` でmdastツリーを再帰トラバースし各ノードをADFに変換

`converter.ts` のトラバーサは `nodes/index.ts` のレジストリから `adfType` / `mdastType` をキーに該当する `NodeConverter` を引き、対応する変換関数を呼ぶ再帰処理。未知のノードタイプはオプションに応じてスキップまたはエラーを返す。

## エラーハンドリング

例外は一切スローしない。すべて `Result` 型で表現する。

- 不正なADF構造（トップレベルが `doc` でないなど）→ `Result.fail({ kind: 'invalid_document', ... })`
- 未知ノードで `unknownNodeBehavior: 'error'` → `Result.fail({ kind: 'unknown_node', ... })`
- 未知ノードで `unknownNodeBehavior: 'skip'`（デフォルト）→ スキップして `onWarning` コールバックで通知し `Result.succeed` を返す

## テスト戦略

```
tests/
├── nodes/              # ノード単位のユニットテスト
│   ├── paragraph.test.ts
│   ├── heading.test.ts
│   └── ...
├── roundtrip.test.ts   # ラウンドトリップテスト
└── fixtures/           # 実際のJira/ConfluenceのADFサンプル
    ├── simple-doc.json
    ├── table-doc.json
    └── ...
```

### テスト観点

- 各ノードの `toMdast` / `toAdf` が正しい出力を返すこと
- ADF → Markdown → ADF のラウンドトリップで元のADFと等価になること（JSX経由のノード含む）
- Markdown → ADF → Markdown のラウンドトリップで元のMarkdownと等価になること
- 未知のノードタイプが来た場合に `skip` モードではスキップされ `Result.succeed` を返すこと
- 未知のノードタイプが来た場合に `error` モードでは `Result.fail` を返すこと
- 不正なADF構造では `Result.fail` を返すこと
