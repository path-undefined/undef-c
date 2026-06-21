import { TokenManager } from '@/parser/token-manager'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import { parseTypeConstraint } from '@/parser/type-related-parser'
import { parseExpression } from '@/parser/expression-related-parser'
import {
  parseUseStatement,
  parseDefStatement,
  parseTypStatement,
  parseExprStatement,
  parseReturnStatement,
} from '@/parser/statement-related-parser'

export function parseFunctionParameters(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_(')

  const children: (AstNode | Token)[] = []

  while (tm.peek()?.name !== 'sign_)') {
    const isVariadic = tm.peek()?.name === 'sign_...'

    if (isVariadic) {
      tm.next()
    }

    const name = tm.expectNextToBe('symbol')

    const typeConstraint = parseTypeConstraint(tm)

    children.push({
      type: 'node',
      name: isVariadic
        ? 'variadic_func_parameter'
        : 'func_parameter',
      children: [
        name,
        typeConstraint,
      ],
    })

    if (tm.peek()?.name !== 'sign_)') {
      tm.expectNextToBe('sign_,')
    }

    if (isVariadic) {
      tm.expectPeekToBe('sign_)')
    }
  }

  tm.expectNextToBe('sign_)')

  return {
    type: 'node',
    name: 'function_parameters',
    children,
  }
}

export function parseFunctionArguments(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_(')

  const children: (AstNode | Token)[] = []

  while (tm.peek()?.name !== 'sign_)') {
    children.push(parseExpression(tm))

    if (tm.peek()?.name !== 'sign_)') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_)')

  return {
    type: 'node',
    name: 'function_arguments',
    children,
  }
}

export function parseFunctionBody(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    children.push(parseFunctionStatement(tm))
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'function_body',
    children,
  }
}

export function parseFunctionStatement(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_use':
      return parseUseStatement(tm)
    case 'keyword_def':
      return parseDefStatement(tm)
    case 'keyword_typ':
      return parseTypStatement(tm)
    case 'keyword_return':
      return parseReturnStatement(tm)
    default:
      return parseExprStatement(tm)
  }
}
