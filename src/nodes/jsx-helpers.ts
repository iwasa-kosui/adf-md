export function toMdxJsxFlowElement(name: string, attrs: Record<string, string>, children: any[]): any {
  return {
    type: 'mdxJsxFlowElement',
    name,
    attributes: Object.entries(attrs).map(([k, v]) => ({ type: 'mdxJsxAttribute', name: k, value: v })),
    children,
  }
}

export function toMdxJsxTextElement(name: string, attrs: Record<string, string>): any {
  return {
    type: 'mdxJsxTextElement',
    name,
    attributes: Object.entries(attrs).map(([k, v]) => ({ type: 'mdxJsxAttribute', name: k, value: v })),
    children: [],
  }
}

export function getJsxAttr(node: any, name: string): string | undefined {
  const attr = node.attributes?.find((a: any) => a.name === name)
  return attr?.value
}
