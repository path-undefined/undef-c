import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'

import { parseIdentifier } from '@/parser/identifier-related-parser'
import { parseFunctionParameters } from '@/parser/function-related-parser'

export function parseTypeConstraint(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_:')

  const type = parseTypeExpression(tm)

  return {
    type: 'node',
    name: 'type_constraint',
    children: [
      type,
    ],
  }
}

export function parseTypeExpression(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_const':
    case 'keyword_packed':
      return parseModifiedTypeExpression(tm)
    case 'symbol':
      return parseIdentifier(tm)
    case 'keyword_fun':
      return parseFunctionTypeExpression(tm)
    case 'keyword_struct':
    case 'keyword_union':
    case 'keyword_enum':
    case 'keyword_error':
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

export function parseFunctionTypeExpression(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_fun')

  const parameters = parseFunctionParameters(tm)

  tm.expectNextToBe('sign_->')

  const returnType = parseTypeExpression(tm)

  return {
    type: 'node',
    name: 'function_type_expression',
    children: [
      parameters,
      returnType,
    ],
  }
}

export function parseModifiedTypeExpression(tm: TokenManager): AstNode {
  const modifier = tm.next()!

  if (![
    'symbol',
    'keyword_fun',
    'keyword_struct',
    'keyword_union',
    'keyword_enum',
    'keyword_error',
  ].includes(tm.peek()?.name ?? '')) {
    return {
      type: 'node',
      name: 'modified_type_expression',
      children: [
        modifier,
      ],
    }
  }

  const type = parseTypeExpression(tm)

  return {
    type: 'node',
    name: 'modified_type_expression',
    children: [
      modifier,
      type,
    ],
  }
}
