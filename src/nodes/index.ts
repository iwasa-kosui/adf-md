import { paragraph } from './paragraph'
import { heading } from './heading'
import { codeBlock } from './code-block'
import { blockquote } from './blockquote'
import { rule } from './rule'
import { hardBreak } from './hard-break'
import { mdastStrongToAdf, mdastEmphasisToAdf, mdastDeleteToAdf, mdastLinkToAdf, mdastInlineCodeToAdf } from './text'
import { bulletListConverter, orderedListConverter, listConverter, listItemConverter, taskListConverter, taskItemConverter } from './list'
import { table } from './table'
import { panel } from './panel'
import { expand } from './expand'
import { status } from './status'
import { mention } from './mention'
import { emoji } from './emoji'
import { mediaSingle, mediaGroup } from './media'
import { inlineCard, blockCard, embedCard } from './card'
import type { NodeConverter } from '../types'

const strongConverter: NodeConverter = {
  adfType: [],
  mdastType: 'strong',
  toMdast: () => ({ type: 'text', value: '' } as any),
  toAdf: (node, context) => mdastStrongToAdf(node, context),
}

const emphasisConverter: NodeConverter = {
  adfType: [],
  mdastType: 'emphasis',
  toMdast: () => ({ type: 'text', value: '' } as any),
  toAdf: (node, context) => mdastEmphasisToAdf(node, context),
}

const deleteConverter: NodeConverter = {
  adfType: [],
  mdastType: 'delete',
  toMdast: () => ({ type: 'text', value: '' } as any),
  toAdf: (node, context) => mdastDeleteToAdf(node, context),
}

const linkConverter: NodeConverter = {
  adfType: [],
  mdastType: 'link',
  toMdast: () => ({ type: 'text', value: '' } as any),
  toAdf: (node, context) => mdastLinkToAdf(node, context),
}

const inlineCodeConverter: NodeConverter = {
  adfType: [],
  mdastType: 'inlineCode',
  toMdast: () => ({ type: 'text', value: '' } as any),
  toAdf: (node, _context) => mdastInlineCodeToAdf(node),
}

const converters: NodeConverter[] = [
  paragraph,
  heading,
  codeBlock,
  blockquote,
  rule,
  hardBreak,
  bulletListConverter,
  orderedListConverter,
  listConverter,
  listItemConverter,
  taskListConverter,
  taskItemConverter,
  table,
  strongConverter,
  emphasisConverter,
  deleteConverter,
  linkConverter,
  inlineCodeConverter,
  panel,
  expand,
  status,
  mention,
  emoji,
  mediaSingle,
  mediaGroup,
  inlineCard,
  blockCard,
  embedCard,
]

export const adfConverters = new Map<string, NodeConverter>()
export const mdastConverters = new Map<string, NodeConverter>()
export const jsxConverters = new Map<string, NodeConverter>()

for (const c of converters) {
  const adfTypes = Array.isArray(c.adfType) ? c.adfType : [c.adfType]
  for (const t of adfTypes) if (t) adfConverters.set(t, c)
  const mdastTypes = Array.isArray(c.mdastType) ? c.mdastType : [c.mdastType]
  for (const t of mdastTypes) if (t) mdastConverters.set(t, c)
}

// Register JSX converters by component name
jsxConverters.set('Panel', panel)
jsxConverters.set('Expand', expand)
jsxConverters.set('Status', status)
jsxConverters.set('Mention', mention)
jsxConverters.set('Emoji', emoji)
jsxConverters.set('Media', mediaSingle)
jsxConverters.set('InlineCard', inlineCard)
jsxConverters.set('BlockCard', blockCard)
jsxConverters.set('EmbedCard', embedCard)
