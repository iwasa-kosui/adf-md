import { describe, it, expect } from 'vitest'
import { taskListConverter, taskItemConverter, listConverter } from '../../src/nodes/list'
import type { TransformContext } from '../../src/types'
import type { ADFNode } from '../../src/adf'
import type { Nodes as MdastNode } from 'mdast'

const makeContext = (): TransformContext => ({
  convertChildren: (node) => {
    const adf = node as ADFNode
    if (adf.content) {
      return adf.content.map((child) => {
        if (child.type === 'text') return { type: 'text', value: child.text ?? '' }
        if (child.type === 'paragraph') {
          return {
            type: 'paragraph',
            children: (child.content ?? []).map((c) =>
              c.type === 'text' ? { type: 'text', value: c.text ?? '' } : c,
            ),
          }
        }
        return child as unknown as MdastNode
      })
    }
    const mdast = node as { children?: MdastNode[] }
    if (mdast.children) {
      return mdast.children.map((child) => {
        if (child.type === 'text') return { type: 'text', text: (child as { value: string }).value } as unknown as MdastNode
        if (child.type === 'paragraph') {
          const p = child as { type: 'paragraph'; children: MdastNode[] }
          return {
            type: 'paragraph',
            content: p.children.map((c) =>
              c.type === 'text' ? { type: 'text', text: (c as { value: string }).value } : c,
            ),
          } as unknown as MdastNode
        }
        return child
      })
    }
    return []
  },
  options: {},
})

describe('taskList converters', () => {
  it('ADF taskList → mdast list with checked items', () => {
    const adfNode: ADFNode = {
      type: 'taskList',
      attrs: { localId: 'abc' },
      content: [
        { type: 'taskItem', attrs: { localId: '1', state: 'TODO' }, content: [{ type: 'text', text: 'todo item' }] },
        { type: 'taskItem', attrs: { localId: '2', state: 'DONE' }, content: [{ type: 'text', text: 'done item' }] },
      ],
    }
    const result = taskListConverter.toMdast(adfNode, makeContext()) as any
    expect(result).toMatchObject({
      type: 'list',
      ordered: false,
      children: [
        { type: 'listItem', checked: false },
        { type: 'listItem', checked: true },
      ],
    })
  })

  it('ADF taskItem (DONE) → mdast listItem with checked: true', () => {
    const adfNode: ADFNode = {
      type: 'taskItem',
      attrs: { localId: '1', state: 'DONE' },
      content: [{ type: 'text', text: 'done' }],
    }
    const result = taskItemConverter.toMdast(adfNode, makeContext()) as any
    expect(result).toMatchObject({ type: 'listItem', checked: true })
  })

  it('ADF taskItem (TODO) → mdast listItem with checked: false', () => {
    const adfNode: ADFNode = {
      type: 'taskItem',
      attrs: { localId: '1', state: 'TODO' },
      content: [{ type: 'text', text: 'todo' }],
    }
    const result = taskItemConverter.toMdast(adfNode, makeContext()) as any
    expect(result).toMatchObject({ type: 'listItem', checked: false })
  })

  it('mdast task list → ADF taskList', () => {
    const mdastNode = {
      type: 'list' as const,
      ordered: false,
      children: [
        { type: 'listItem' as const, checked: false, children: [{ type: 'paragraph' as const, children: [{ type: 'text' as const, value: 'todo' }] }] },
        { type: 'listItem' as const, checked: true, children: [{ type: 'paragraph' as const, children: [{ type: 'text' as const, value: 'done' }] }] },
      ],
    }
    const result = listConverter.toAdf(mdastNode, makeContext())
    expect(result).toMatchObject({
      type: 'taskList',
      attrs: { localId: '' },
      content: [
        { type: 'taskItem', attrs: { localId: '', state: 'TODO' } },
        { type: 'taskItem', attrs: { localId: '', state: 'DONE' } },
      ],
    })
  })

  it('mdast non-task list is not converted to taskList', () => {
    const mdastNode = {
      type: 'list' as const,
      ordered: false,
      children: [
        { type: 'listItem' as const, children: [{ type: 'paragraph' as const, children: [{ type: 'text' as const, value: 'normal' }] }] },
      ],
    }
    const result = listConverter.toAdf(mdastNode, makeContext())
    expect(result).toMatchObject({ type: 'bulletList' })
  })

  it('roundtrip: ADF taskList → mdast → ADF taskList', () => {
    const adfNode: ADFNode = {
      type: 'taskList',
      attrs: { localId: 'abc' },
      content: [
        { type: 'taskItem', attrs: { localId: '1', state: 'TODO' }, content: [{ type: 'text', text: 'todo' }] },
        { type: 'taskItem', attrs: { localId: '2', state: 'DONE' }, content: [{ type: 'text', text: 'done' }] },
      ],
    }
    const mdast = taskListConverter.toMdast(adfNode, makeContext()) as any
    expect(mdast.type).toBe('list')
    expect(mdast.children[0].checked).toBe(false)
    expect(mdast.children[1].checked).toBe(true)

    const backToAdf = listConverter.toAdf(mdast, makeContext())
    expect(backToAdf).toMatchObject({
      type: 'taskList',
      content: [
        { type: 'taskItem', attrs: { state: 'TODO' } },
        { type: 'taskItem', attrs: { state: 'DONE' } },
      ],
    })
  })
})
