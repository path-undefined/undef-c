import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode, AstNodeChildren } from '@/types/ast-node'

import { parseLiteral } from '@/parser/literal-related-parser'
import { parseIdentifier, parseIdentifierPath } from '@/parser/identifier-related-parser'
import { parseFunctionParameters } from '@/parser/function-related-parser'
import { Token } from '@/types/token'

export function parseTypeExpression(tm: TokenManager): AstNode | Token {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_const':
      return parseModifiedTypeExpression(tm)
    case 'symbol':
    case 'sign_{{sym':
      return parseIdentifierPath(tm)
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
  const children: AstNodeChildren = {}

  const parameters = parseFunctionParameters(tm)
  children['parameters'] = parameters

  tm.expectNextToBe('sign_->')

  const returnType = parseTypeExpression(tm)
  children['returnType'] = returnType

  const throwTypes: AstNode[] = []
  while (tm.peek()?.name === 'keyword_throw') {
    tm.next()

    const errorType = parseTypeExpression(tm)
    throwTypes.push(errorType)
  }

  children['throwTypes'] = throwTypes

  return {
    type: 'node',
    name: 'function_type_expression',
    children,
  }
}

export function parseStructTypeExpression(tm: TokenManager): AstNode {
  const entries: AstNode[] = []

  tm.expectNextToBe('keyword_struct')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    entries.push(parseStructEntry(tm))

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'struct_type_expression',
    children: {
      entries,
    },
  }
}

export function parseStructEntry(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  const scope = tm.expectPeekToBe()

  if ([
    'keyword_public',
    'keyword_private',
  ].includes(tm.peek()?.name ?? '')) {
    children['accessibility'] = tm.next()!
  }

  if (tm.peek()?.name === 'keyword_const') {
    children['mutability'] = tm.next()!
  }

  const symbol = tm.expectPeekToBe()

  switch (symbol.name) {
    case 'keyword_init':
    case 'keyword_clear': {
      children['name'] = tm.next()!
      break
    }
    case 'symbol':
    case 'sign_{{sym': {
      children['name'] = parseIdentifier(tm)
      break
    }
    default:
      throw new CompileError(
        `Unexpected token ${scope.name}, expect keyword_init, keyword_clear, sign_{{sym or symbol`,
        scope.start,
      )
  }

  if (tm.peek()?.name === 'sign_:') {
    tm.next()

    const type = parseTypeExpression(tm)
    children['type'] = type
  }

  if (tm.peek()?.name === 'sign_=') {
    tm.next()

    const initialValue = parseLiteral(tm)
    children['value'] = initialValue
  }

  return {
    type: 'node',
    name: 'struct_entry',
    children,
  }
}

export function parseUnionTypeExpression(tm: TokenManager): AstNode {
  const entries: AstNode[] = []

  tm.expectNextToBe('keyword_union')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    entries.push(parseUnionEntry(tm))

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'union_type_expression',
    children: {
      entries,
    },
  }
}

export function parseUnionEntry(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  const nextToken = tm.expectPeekToBe()

  switch (nextToken.name) {
    case 'symbol':
    case 'sign_{{sym':
      children['name'] = parseIdentifier(tm)
      tm.expectNextToBe('sign_:')
      children['type'] = parseTypeExpression(tm)
      break
    default:
      children['type'] = parseTypeExpression(tm)
  }

  return {
    type: 'node',
    name: 'union_entry',
    children,
  }
}

export function parseEnumTypeExpression(tm: TokenManager): AstNode {
  const entries: AstNode[] = []

  tm.expectNextToBe('keyword_enum')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    entries.push(parseEnumEntry(tm))

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  tm.expectNextToBe('sign_:')

  const type = parseTypeExpression(tm)

  return {
    type: 'node',
    name: 'enum_type_expression',
    children: {
      entries,
      type,
    },
  }
}

export function parseEnumEntry(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  const symbol = parseIdentifier(tm)
  children['name'] = symbol

  if (tm.peek()?.name === 'sign_=') {
    tm.next()
    const value = parseLiteral(tm)
    children['value'] = value
  }

  return {
    type: 'node',
    name: 'enum_entry',
    children,
  }
}

export function parseErrorTypeExpression(tm: TokenManager): AstNode {
  const entries: AstNode[] = []

  tm.expectNextToBe('keyword_error')

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    const symbol = parseIdentifier(tm)
    entries.push(symbol)

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'error_type_expression',
    children: {
      entries,
    },
  }
}

export function parseModifiedTypeExpression(tm: TokenManager): AstNode {
  const modifier = tm.next()!

  if ([
    'symbol',
    'keyword_fun',
    'keyword_struct',
    'keyword_union',
    'keyword_enum',
    'keyword_error',
  ].includes(tm.peek()?.name ?? '')) {
    const type = parseTypeExpression(tm)

    return {
      type: 'node',
      name: 'modified_type_expression',
      children: {
        modifier,
        type,
      },
    }
  }
  else {
    return {
      type: 'node',
      name: 'modified_type_expression',
      children: {
        modifier,
      },
    }
  }
}
