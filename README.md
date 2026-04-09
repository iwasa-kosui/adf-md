# adf-md

Bidirectional converter between [Atlassian Document Format (ADF)](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/) and Markdown.

Jira / Confluence が内部で使用する ADF を Markdown に変換したり、その逆を行えます。ADF 固有のノード (Panel, Expand, Status, Mention, Emoji など) は MDX の JSX 構文にマッピングされるため、情報の欠落なく双方向変換が可能です。

## Installation

```bash
npm install adf-md
```

## Usage

### ADF → Markdown

```ts
import { adfToMarkdown } from 'adf-md'

const adf = {
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello, world!' }],
    },
  ],
}

const result = adfToMarkdown(adf)
if (result.type === 'Success') {
  console.log(result.value)
  // => "Hello, world!\n"
}
```

### Markdown → ADF

```ts
import { markdownToAdf } from 'adf-md'

const result = markdownToAdf('Hello, **world**!')
if (result.type === 'Success') {
  console.log(JSON.stringify(result.value, null, 2))
}
```

### AST-level conversion

Markdown 文字列ではなく mdast (Markdown AST) を直接扱いたい場合は、低レベル API を使用できます。

```ts
import { adfToMdast, mdastToAdf } from 'adf-md'
```

## Supported nodes

| ADF node | Markdown / MDX |
|---|---|
| paragraph | paragraph |
| heading | `#` ~ `######` |
| bulletList | `- item` |
| orderedList | `1. item` |
| taskList | `- [x] item` |
| codeBlock | fenced code block |
| blockquote | `> quote` |
| rule | `---` |
| table | GFM table |
| hardBreak | hard line break |
| text (bold, italic, strikethrough, code, link) | `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `[link](url)` |
| panel | `<Panel panelType="info">` |
| expand | `<Expand title="...">` |
| status | `<Status text="..." color="..." />` |
| mention | `<Mention id="..." text="..." />` |
| emoji | `<Emoji shortName="..." />` |
| mediaSingle / mediaGroup | `<Media id="..." collection="..." />` |

## Error handling

すべての変換関数は [`@praha/byethrow`](https://github.com/praha-inc/byethrow) の `Result` 型を返します。例外は throw されません。

```ts
const result = adfToMarkdown(adf)
if (result.type === 'Failure') {
  console.error(result.error) // ConvertError
}
```

### Options

```ts
import { adfToMarkdown } from 'adf-md'

const result = adfToMarkdown(adf, {
  // 未知のノードをエラーにするか、スキップするか (default: 'skip')
  unknownNodeBehavior: 'error',
  // スキップ時の警告コールバック
  onWarning: (warning) => console.warn(warning.message),
})
```

## License

MIT
