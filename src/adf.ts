export type ADFDocument = {
  version: 1
  type: 'doc'
  content: ADFNode[]
}

export type ADFMark = {
  type: string
  attrs?: Record<string, unknown>
}

export type ADFNode = {
  type: string
  content?: ADFNode[]
  text?: string
  marks?: ADFMark[]
  attrs?: Record<string, unknown>
}
