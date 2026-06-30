import { AstNode } from '@/types/ast-node'

export function printAst(ast: AstNode | AstNode[], indent: number = 0, key: string = '') {
  const isArray = Array.isArray(ast)
  const nodes = isArray ? ast : [ast]

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    const arrayIndex = isArray ? `[${i}]` : ''
    const rawString = node.type === 'token' ? node.raw : ''

    console.log(''.padStart(indent, ' ') + `${key}${arrayIndex}: ${node.type} ${node.name} ${rawString}`)

    if (node.type === 'node') {
      for (const [key, value] of Object.entries(node.children)) {
        printAst(value, indent + 2, key)
      }
    }
  }
}
