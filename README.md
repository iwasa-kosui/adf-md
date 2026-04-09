# adf-md

Bidirectional converter between [Atlassian Document Format (ADF)](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/) and Markdown.

Convert between ADF used internally by Jira / Confluence and Markdown, and vice versa. ADF-specific nodes (Panel, Expand, Status, Mention, Emoji, etc.) are mapped to MDX JSX syntax, enabling lossless bidirectional conversion.

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

If you want to work directly with mdast (Markdown AST) instead of Markdown strings, you can use the low-level API.

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
| inlineCard | `<InlineCard url="..." />` |
| blockCard | `<BlockCard url="..." />` |
| embedCard | `<EmbedCard url="..." layout="..." width="..." />` |

## Middlewares

You can intercept, override, or observe the conversion of individual nodes by passing `middlewares` to the options. Each middleware wraps the built-in converter with a `next()` chain, similar to Express/Koa middleware.

```ts
import { adfToMarkdown, markdownToAdf } from 'adf-md'
import type { Middleware } from 'adf-md'

const middleware: Middleware = {
  toMdast: (node, ctx, next) => {
    // Convert bodiedExtension to an MDX component
    if (node.type === 'bodiedExtension') {
      return {
        type: 'mdxJsxFlowElement',
        name: node.attrs?.extensionKey ?? 'Unknown',
        children: ctx.convertChildren(node),
        attributes: [],
      }
    }
    // Fall through to the built-in converter
    return next()
  },
  toAdf: (node, ctx, next) => {
    // Convert blockquote to ADF panel
    if (node.type === 'blockquote') {
      return {
        type: 'panel',
        attrs: { panelType: 'note' },
        content: ctx.convertChildren(node),
      }
    }
    return next()
  },
}

adfToMarkdown(adf, { middlewares: [middleware] })
markdownToAdf(md, { middlewares: [middleware] })
```

When multiple middlewares are provided, they execute in array order. Each middleware can call `next()` to delegate to the next middleware (or the built-in converter if it is the last one), or return its own result to short-circuit the chain.

## Error handling

All conversion functions return a `Result` type from [`@praha/byethrow`](https://github.com/praha-inc/byethrow). No exceptions are thrown.

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
  // Whether to treat unknown nodes as errors or skip them (default: 'skip')
  unknownNodeBehavior: 'error',
  // Warning callback when nodes are skipped
  onWarning: (warning) => console.warn(warning.message),
})
```

## License

MIT
