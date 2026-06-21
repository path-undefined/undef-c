import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'

import { parseExpression } from '@/parser/expression-related-parser'

export function parseSymbol(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'symbol':
      return parseSimpleSymbol(tm)
    case 'sign_{{sym':
      return parseTemplateInterpolatedSymbol(tm)
    default:
      throw new CompileError(
        `Unexpected token ${firstToken.name}, expect symbol or sign_{{sym`,
        firstToken.start,
      )
  }
}

export function parseSimpleSymbol(tm: TokenManager): AstNode {
  return {
    type: 'node',
    name: 'simple_symbol',
    children: [
      tm.expectNextToBe('symbol'),
    ],
  }
}

export function parseTemplateInterpolatedSymbol(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{sym')

  const expression = parseExpression(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_interpolated_symbol',
    children: [
      expression,
    ],
  }
}
