import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode, AstNodeChildren } from '@/types/ast-node'

import { parseExpression } from '@/parser/expression-related-parser'
import { parseTemplateArguments } from '@/parser/template-related-parser'

export function parseIdentifierPath(tm: TokenManager): AstNode {
  const path: AstNode[] = []

  const symbol = parseIdentifier(tm)
  path.push(symbol)

  while (tm.peek()?.name === 'sign_::') {
    tm.next()

    const subSymbol = parseIdentifier(tm)
    path.push(subSymbol)
  }

  return {
    type: 'node',
    name: 'idendifier_path',
    children: {
      path,
    },
  }
}

export function parseIdentifier(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'symbol':
      children['name'] = tm.next()!
      break
    case 'sign_{{sym':
      children['name'] = parseTemplateInterpolatedSymbol(tm)
      break
    default:
      throw new CompileError(
        `Unexpected token ${firstToken.name}, expect symbol or sign_{{sym`,
        firstToken.start,
      )
  }

  if (tm.peek()?.name === 'sign_<') {
    const templateArguments = parseTemplateArguments(tm)

    if (templateArguments) {
      children['templateArguments'] = templateArguments
    }
  }

  return {
    type: 'node',
    name: 'idendifier',
    children,
  }
}

export function parseTemplateInterpolatedSymbol(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{sym')

  const expression = parseExpression(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_interpolated_symbol',
    children: {
      nameValue: expression,
    },
  }
}
