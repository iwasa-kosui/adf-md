import { describe, it, expect } from 'vitest'
import { adfToMarkdown, markdownToAdf } from '../src/converter'

describe('roundtrip', () => {
  it('ADF → Markdown → ADF preserves paragraph', () => {
    const adf = {
      version: 1 as const,
      type: 'doc' as const,
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello world' }] },
      ],
    }
    const mdResult = adfToMarkdown(adf)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return

    expect(mdResult.value.trim()).toBe('hello world')

    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return

    expect(adfResult.value).toEqual(adf)
  })

  it('ADF → Markdown → ADF roundtrip with multiple node types', () => {
    const adf = {
      version: 1 as const,
      type: 'doc' as const,
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'italic', marks: [{ type: 'em' }] },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'item one' }] },
              ],
            },
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'item two' }] },
              ],
            },
          ],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: [{ type: 'text', text: 'const x = 1' }],
        },
        { type: 'rule' },
      ],
    }

    const mdResult = adfToMarkdown(adf)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return

    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return

    const result = adfResult.value
    expect(result.type).toBe('doc')
    expect(result.version).toBe(1)

    // heading
    const heading = result.content[0]
    expect(heading.type).toBe('heading')
    expect(heading.attrs?.level).toBe(1)
    expect(heading.content?.[0]).toMatchObject({ type: 'text', text: 'Title' })

    // paragraph with marks
    const para = result.content[1]
    expect(para.type).toBe('paragraph')
    const boldNode = para.content?.find((n) => n.marks?.some((m) => m.type === 'strong'))
    expect(boldNode?.text).toBe('bold')
    const emNode = para.content?.find((n) => n.marks?.some((m) => m.type === 'em'))
    expect(emNode?.text).toBe('italic')

    // bulletList
    const list = result.content[2]
    expect(list.type).toBe('bulletList')
    expect(list.content?.length).toBe(2)

    // codeBlock
    const code = result.content[3]
    expect(code.type).toBe('codeBlock')
    expect(code.content?.[0]).toMatchObject({ type: 'text', text: 'const x = 1' })

    // rule
    const rule = result.content[4]
    expect(rule.type).toBe('rule')
  })

  it('Markdown → ADF → Markdown roundtrip with standard elements', () => {
    const markdown = `# Heading One

Hello **bold** and *italic* text.

* alpha
* beta

\`\`\`js
console.log('hi')
\`\`\`

---
`

    const adfResult = markdownToAdf(markdown)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return

    const mdResult = adfToMarkdown(adfResult.value)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return

    const output = mdResult.value.trim()

    // heading
    expect(output).toMatch(/^# Heading One/m)

    // bold and italic
    expect(output).toMatch(/\*\*bold\*\*/)
    expect(output).toMatch(/\*italic\*/)

    // bullet list items
    expect(output).toMatch(/^\* alpha/m)
    expect(output).toMatch(/^\* beta/m)

    // code block
    expect(output).toMatch(/```js/)
    expect(output).toMatch(/console\.log\('hi'\)/)

    // horizontal rule (remark may use --- or ***)
    expect(output).toMatch(/^(---|(\*\*\*))$/m)
  })

  it('ADF → Markdown → ADF roundtrip with panel', () => {
    const adf = {
      version: 1 as const,
      type: 'doc' as const,
      content: [
        {
          type: 'panel',
          attrs: { panelType: 'info' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'This is an info panel.' }],
            },
          ],
        },
      ],
    }

    const mdResult = adfToMarkdown(adf)
    expect(mdResult.type).toBe('Success')
    if (mdResult.type !== 'Success') return

    const adfResult = markdownToAdf(mdResult.value)
    expect(adfResult.type).toBe('Success')
    if (adfResult.type !== 'Success') return

    const panel = adfResult.value.content[0]
    expect(panel.type).toBe('panel')
    expect(panel.attrs?.panelType).toBe('info')

    const innerPara = panel.content?.[0]
    expect(innerPara?.type).toBe('paragraph')
    expect(innerPara?.content?.[0]).toMatchObject({ type: 'text', text: 'This is an info panel.' })
  })
})
