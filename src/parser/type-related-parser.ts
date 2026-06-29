import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'

import { parseIdentifier } from '@/parser/identifier-related-parser'
import { parseLiteral } from '@/parser/literal-related-parser'
import { parseSymbol } from '@/parser/symbol-related-parser'
import { parseFunctionParameters } from '@/parser/function-related-parser'
import { Token } from '@/types/token'

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

export function parseTypeExpression(tm: TokenManager): AstNode | Token {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_any':
      return parseAnyTypeExpression(tm)
    case 'keyword_const':
      return parseModifiedTypeExpression(tm)
    case 'symbol':
    case 'sign_{{sym':
      return parseIdentifier(tm)
    case 'sign_(':
      return parseFunctionTypeExpression(tm)
    case 'keyword_struct':
      return parseStructTypeExpression(tm)
    case 'keyword_union':
      return parseUnionTypeExpression(tm)
    case 'keyword_enum':
      return parseEnumTypeExpression(tm)
    case 'keyword_error':
      return parseErrorTypeExpression(tm)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

export function parseFunctionTypeExpression(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const parameters = parseFunctionParameters(tm)
  children.push(parameters)

  tm.expectNextToBe('sign_->')

  const returnType = parseTypeExpression(tm)
  children.push(returnType)

  while (tm.peek()?.name === 'keyword_throw') {
    tm.next()

    const errorType = parseTypeExpression(tm)
    children.push(errorType)
  }

  return {
    type: 'node',
    name: 'function_type_expression',
    children,
  }
}

export function parseStructTypeExpression(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_struct')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    children.push(parseStructEntry(tm))

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'struct_type_expression',
    children,
  }
}

export function parseStructEntry(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const scope = tm.expectPeekToBe()

  switch (scope.name) {
    case 'keyword_public':
    case 'keyword_private':
      children.push(tm.next()!)
      break
  }

  const writability = tm.expectPeekToBe()
  switch (writability.name) {
    case 'keyword_const':
      children.push(tm.next()!)
      break
  }

  const symbol = tm.expectPeekToBe()

  switch (symbol.name) {
    case 'keyword_init':
    case 'keyword_clear': {
      children.push(tm.next()!)
      break
    }
    case 'symbol':
    case 'sign_{{sym': {
      children.push(parseSymbol(tm))
      break
    }
    default:
      throw new CompileError(
        `Unexpected token ${scope.name}, expect keyword_init, keyword_clear, sign_{{sym or symbol`,
        scope.start,
      )
  }

  const type = parseTypeConstraint(tm)
  children.push(type)

  if (tm.peek()?.name === 'sign_=') {
    tm.next()
    const initialValue = parseLiteral(tm)
    children.push(initialValue)
  }

  return {
    type: 'node',
    name: 'struct_entry',
    children,
  }
}

export function parseUnionTypeExpression(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_union')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    children.push(parseUnionEntry(tm))

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'union_type_expression',
    children,
  }
}

export function parseUnionEntry(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const nextToken = tm.expectPeekToBe()

  switch (nextToken.name) {
    case 'symbol':
    case 'sign_{{sym':
      children.push(parseSymbol(tm))
      children.push(parseTypeConstraint(tm))
      break
    default:
      children.push(parseTypeExpression(tm))
  }

  return {
    type: 'node',
    name: 'union_entry',
    children,
  }
}

export function parseEnumTypeExpression(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_enum')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    children.push(parseEnumEntry(tm))

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  const type = parseTypeConstraint(tm)
  children.push(type)

  return {
    type: 'node',
    name: 'enum_type_expression',
    children,
  }
}

export function parseEnumEntry(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const symbol = parseSymbol(tm)
  children.push(symbol)

  if (tm.peek()?.name === 'sign_=') {
    tm.next()
    const value = parseLiteral(tm)
    children.push(value)
  }

  return {
    type: 'node',
    name: 'enum_entry',
    children,
  }
}

export function parseErrorTypeExpression(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_error')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    const symbol = parseSymbol(tm)
    children.push(symbol)

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'error_type_expression',
    children,
  }
}

export function parseAnyTypeExpression(tm: TokenManager): AstNode | Token {
  return tm.expectNextToBe('keyword_any')
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
