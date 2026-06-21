import { TokenManager } from '@/parser/token-manager'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import { parseSymbol } from '@/parser/symbol-related-parser'
import { parseTemplateArguments } from '@/parser/template-related-parser'

export function parseIdentifier(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const symbol = parseSymbol(tm)

  children.push(symbol)

  while (tm.peek()?.name === 'sign_::') {
    tm.next()

    const subSymbol = parseSymbol(tm)
    children.push(subSymbol)
  }

  if (tm.peek()?.name === 'sign_<') {
    const templateParam = parseTemplateArguments(tm)

    if (templateParam) {
      children.push(templateParam)
    }
  }

  return {
    type: 'node',
    name: 'identifier',
    children,
  }
}
