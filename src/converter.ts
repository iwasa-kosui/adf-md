import { Result } from '@praha/byethrow'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkGfm from 'remark-gfm'
import type { Root as MdastRoot, Nodes as MdastNode } from 'mdast'
import type { ADFDocument, ADFNode } from './adf'
import type { ConvertOptions, ConvertError, TransformContext } from './types'
import { adfConverters, mdastConverters } from './nodes/index'

export function adfToMdast(
  doc: ADFDocument,
  options: ConvertOptions,
): ReturnType<typeof Result.succeed<MdastRoot>> | ReturnType<typeof Result.fail<ConvertError>> {
  if (doc.type !== 'doc') {
    return Result.fail<ConvertError>({
      kind: 'invalid_document',
      message: `Expected top-level type 'doc', got '${doc.type}'`,
      node: doc,
    })
  }

  try {
    const convertChildren = (node: ADFNode | MdastNode): (ADFNode | MdastNode)[] => {
      const adf = node as ADFNode
      const content = adf.content ?? []
      return content.map((child) => {
        if (child.type === 'text') {
          return { type: 'text', value: child.text ?? '' } as unknown as MdastNode
        }
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
          return null
        }
        return converter.toMdast(child, context) as unknown as MdastNode
      }).filter((n): n is MdastNode => n !== null)
    }

    const context: TransformContext = { convertChildren, options }

    const children = convertChildren(doc as unknown as ADFNode)
    const root: MdastRoot = { type: 'root', children: children as MdastRoot['children'] }
    return Result.succeed(root)
  } catch (e) {
    return Result.fail<ConvertError>(e as ConvertError)
  }
}

export function mdastToAdf(
  root: MdastRoot,
  options: ConvertOptions,
): ReturnType<typeof Result.succeed<ADFDocument>> | ReturnType<typeof Result.fail<ConvertError>> {
  if (root.type !== 'root') {
    return Result.fail<ConvertError>({
      kind: 'invalid_document',
      message: `Expected top-level type 'root', got '${(root as any).type}'`,
      node: root,
    })
  }

  try {
    const convertChildren = (node: ADFNode | MdastNode): (ADFNode | MdastNode)[] => {
      const mdast = node as { children?: MdastNode[] }
      const children = mdast.children ?? []
      return children.map((child) => {
        if (child.type === 'text') {
          return { type: 'text', text: (child as { value: string }).value } as ADFNode
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
          return null
        }
        return converter.toAdf(child, context) as unknown as ADFNode
      }).filter((n): n is ADFNode => n !== null)
    }

    const context: TransformContext = { convertChildren, options }

    const content = convertChildren(root as unknown as MdastNode)
    const doc: ADFDocument = { version: 1, type: 'doc', content: content as ADFNode[] }
    return Result.succeed(doc)
  } catch (e) {
    return Result.fail<ConvertError>(e as ConvertError)
  }
}

export function adfToMarkdown(
  adf: ADFDocument,
  options: ConvertOptions = {},
): ReturnType<typeof Result.succeed<string>> | ReturnType<typeof Result.fail<ConvertError>> {
  const mdastResult = adfToMdast(adf, options)
  if (mdastResult.type === 'Failure') return mdastResult

  const processor = unified()
    .use(remarkStringify)
    .use(remarkGfm)

  const markdown = processor.stringify(mdastResult.value)
  return Result.succeed(String(markdown))
}

export function markdownToAdf(
  markdown: string,
  options: ConvertOptions = {},
): ReturnType<typeof Result.succeed<ADFDocument>> | ReturnType<typeof Result.fail<ConvertError>> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)

  const mdast = processor.parse(markdown) as MdastRoot
  return mdastToAdf(mdast, options)
}
