import { describe, it, expect } from 'vitest'
import { adfToMdast, mdastToAdf, adfToMarkdown, markdownToAdf } from '../src/converter'
import type { ADFDocument } from '../src/adf'

describe('complex nesting', () => {
  describe('table cell with bold text containing emoji', () => {
    const adf: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Feature' }],
                    },
                  ],
                },
                {
                  type: 'tableHeader',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Status' }],
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Authentication',
                          marks: [{ type: 'strong' }],
                        },
                        { type: 'text', text: ' ' },
                        {
                          type: 'emoji',
                          attrs: { shortName: ':lock:', id: '1f512' },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'tableCell',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'status',
                          attrs: { text: 'DONE', color: 'green' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    it('ADF → mdast: table cell contains strong + emoji', () => {
      const result = adfToMdast(adf)
      expect(result.type).toBe('Success')
      if (result.type !== 'Success') return

      const table = result.value.children[0] as any
      expect(table.type).toBe('table')

      // Second row, first cell should have strong text + space + emoji
      const dataRow = table.children[1]
      const firstCell = dataRow.children[0]
      expect(firstCell.children[0]).toEqual({
        type: 'strong',
        children: [{ type: 'text', value: 'Authentication' }],
      })
      expect(firstCell.children[1]).toEqual({
        type: 'text',
        value: ' ',
      })
      expect(firstCell.children[2]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'Emoji',
      })

      // Second cell should have status
      const secondCell = dataRow.children[1]
      expect(secondCell.children[0]).toMatchObject({
        type: 'mdxJsxTextElement',
        name: 'Status',
      })
    })
  })

  describe('blockquote containing list with bold + italic + link', () => {
    const adf: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Important',
                          marks: [{ type: 'strong' }, { type: 'em' }],
                        },
                        { type: 'text', text: ': see ' },
                        {
                          type: 'text',
                          text: 'docs',
                          marks: [
                            {
                              type: 'link',
                              attrs: { href: 'https://example.com' },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    it('ADF → mdast preserves nested structure', () => {
      const result = adfToMdast(adf)
      expect(result.type).toBe('Success')
      if (result.type !== 'Success') return

      const bq = result.value.children[0] as any
      expect(bq.type).toBe('blockquote')

      const list = bq.children[0]
      expect(list.type).toBe('list')
      expect(list.ordered).toBe(false)

      const item = list.children[0]
      const para = item.children[0]

      // strong > emphasis > text
      expect(para.children[0]).toEqual({
        type: 'strong',
        children: [
          {
            type: 'emphasis',
            children: [{ type: 'text', value: 'Important' }],
          },
        ],
      })

      // plain text
      expect(para.children[1]).toEqual({ type: 'text', value: ': see ' })

      // link
      expect(para.children[2]).toEqual({
        type: 'link',
        url: 'https://example.com',
        children: [{ type: 'text', value: 'docs' }],
      })
    })

    it('ADF → mdast → ADF roundtrip preserves structure', () => {
      const mdastResult = adfToMdast(adf)
      if (mdastResult.type !== 'Success') return
      const adfResult = mdastToAdf(mdastResult.value)
      expect(adfResult.type).toBe('Success')
      if (adfResult.type !== 'Success') return

      // marks order is semantically equivalent, so compare order-independently
      const importantText = adfResult.value.content[0].content![0].content![0]
        .content![0].content![0]
      expect(importantText.text).toBe('Important')
      expect(importantText.marks).toHaveLength(2)
      expect(importantText.marks!.map((m) => m.type).sort()).toEqual(['em', 'strong'])

      // link and plain text must match exactly
      const paraContent = adfResult.value.content[0].content![0].content![0]
        .content![0].content!
      expect(paraContent[1]).toEqual({ type: 'text', text: ': see ' })
      expect(paraContent[2]).toEqual({
        type: 'text',
        text: 'docs',
        marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
      })
    })
  })

  describe('panel containing table with formatted text', () => {
    const adf: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'panel',
          attrs: { panelType: 'warning' },
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Review the following:',
                  marks: [{ type: 'strong' }],
                },
              ],
            },
            {
              type: 'table',
              content: [
                {
                  type: 'tableRow',
                  content: [
                    {
                      type: 'tableHeader',
                      content: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Item' }],
                        },
                      ],
                    },
                    {
                      type: 'tableHeader',
                      content: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Notes' }],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'tableRow',
                  content: [
                    {
                      type: 'tableCell',
                      content: [
                        {
                          type: 'paragraph',
                          content: [
                            {
                              type: 'text',
                              text: 'API Key',
                              marks: [{ type: 'code' }],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'tableCell',
                      content: [
                        {
                          type: 'paragraph',
                          content: [
                            { type: 'text', text: 'Must be ' },
                            {
                              type: 'text',
                              text: 'rotated',
                              marks: [{ type: 'strong' }, { type: 'em' }],
                            },
                            { type: 'text', text: ' monthly' },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    it('ADF → mdast: panel with table containing formatted text', () => {
      const result = adfToMdast(adf)
      expect(result.type).toBe('Success')
      if (result.type !== 'Success') return

      const panel = result.value.children[0] as any
      expect(panel.type).toBe('mdxJsxFlowElement')
      expect(panel.name).toBe('Panel')

      // First child: paragraph with bold text
      const para = panel.children[0]
      expect(para.type).toBe('paragraph')
      expect(para.children[0]).toEqual({
        type: 'strong',
        children: [{ type: 'text', value: 'Review the following:' }],
      })

      // Second child: table
      const table = panel.children[1]
      expect(table.type).toBe('table')

      // Data row, first cell: inline code
      const dataRow = table.children[1]
      const codeCell = dataRow.children[0]
      expect(codeCell.children[0]).toEqual({
        type: 'inlineCode',
        value: 'API Key',
      })

      // Data row, second cell: "Must be **_rotated_** monthly"
      const notesCell = dataRow.children[1]
      expect(notesCell.children[0]).toEqual({ type: 'text', value: 'Must be ' })
      expect(notesCell.children[1]).toEqual({
        type: 'strong',
        children: [
          {
            type: 'emphasis',
            children: [{ type: 'text', value: 'rotated' }],
          },
        ],
      })
      expect(notesCell.children[2]).toEqual({
        type: 'text',
        value: ' monthly',
      })
    })
  })

  describe('list with nested list and marks', () => {
    const adf: ADFDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Parent item',
                      marks: [{ type: 'strong' }],
                    },
                  ],
                },
                {
                  type: 'bulletList',
                  content: [
                    {
                      type: 'listItem',
                      content: [
                        {
                          type: 'paragraph',
                          content: [
                            {
                              type: 'text',
                              text: 'Child with ',
                            },
                            {
                              type: 'text',
                              text: 'strikethrough',
                              marks: [{ type: 'strike' }],
                            },
                            { type: 'text', text: ' and ' },
                            {
                              type: 'text',
                              text: 'link',
                              marks: [
                                {
                                  type: 'link',
                                  attrs: { href: 'https://example.com' },
                                },
                                { type: 'strong' },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    it('ADF → mdast preserves nested list with marks', () => {
      const result = adfToMdast(adf)
      expect(result.type).toBe('Success')
      if (result.type !== 'Success') return

      const list = result.value.children[0] as any
      expect(list.type).toBe('list')

      const item = list.children[0]
      // First child: paragraph with bold
      const para = item.children[0]
      expect(para.children[0]).toEqual({
        type: 'strong',
        children: [{ type: 'text', value: 'Parent item' }],
      })

      // Second child: nested list
      const nestedList = item.children[1]
      expect(nestedList.type).toBe('list')

      const nestedItem = nestedList.children[0]
      const nestedPara = nestedItem.children[0]

      // "Child with "
      expect(nestedPara.children[0]).toEqual({
        type: 'text',
        value: 'Child with ',
      })
      // ~~strikethrough~~
      expect(nestedPara.children[1]).toEqual({
        type: 'delete',
        children: [{ type: 'text', value: 'strikethrough' }],
      })
      // " and "
      expect(nestedPara.children[2]).toEqual({
        type: 'text',
        value: ' and ',
      })
      // **[link](url)** — strong wrapping link
      expect(nestedPara.children[3]).toEqual({
        type: 'link',
        url: 'https://example.com',
        children: [
          {
            type: 'strong',
            children: [{ type: 'text', value: 'link' }],
          },
        ],
      })
    })
  })

  describe('Markdown string roundtrip with complex table', () => {
    it('Markdown with bold+emoji in table → ADF → Markdown preserves structure', () => {
      const md = `| Feature | Status |
| --- | --- |
| **Auth** | Done |
`
      const adfResult = markdownToAdf(md)
      expect(adfResult.type).toBe('Success')
      if (adfResult.type !== 'Success') return

      // Verify the ADF has the expected structure
      const table = adfResult.value.content[0]
      expect(table.type).toBe('table')

      const dataRow = table.content![1]
      const firstCell = dataRow.content![0]
      // Cell should contain paragraph with bold "Auth"
      const cellPara = firstCell.content![0]
      expect(cellPara.type).toBe('paragraph')
      expect(cellPara.content![0]).toEqual({
        type: 'text',
        text: 'Auth',
        marks: [{ type: 'strong' }],
      })

      // Convert back to Markdown
      const mdResult = adfToMarkdown(adfResult.value)
      expect(mdResult.type).toBe('Success')
      if (mdResult.type !== 'Success') return
      expect(mdResult.value).toContain('**Auth**')
    })
  })
})
