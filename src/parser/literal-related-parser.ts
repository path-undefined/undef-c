import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import { parseExpression } from '@/parser/expression-related-parser'
import { parseCodeBlock } from '@/parser/block-related-parser'
import { parseFunctionTypeExpression } from '@/parser/type-related-parser'
import { parseSymbol } from '@/parser/symbol-related-parser'

export function parseLiteral(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'literal_string':
    case 'literal_char':
    case 'literal_hex_integer':
    case 'literal_oct_integer':
    case 'literal_bin_integer':
    case 'literal_dec_integer':
    case 'literal_hex_float':
    case 'literal_dec_float':
    case 'literal_bool':
    case 'literal_null':
      tm.next()
      return {
        type: 'node',
        name: 'literal',
        children: [
          firstToken,
        ],
      }
    case 'sign_{{lit':
      return parseTemplateInterpolatedLiteral(tm)
    case 'sign_[':
      return parseArrayLiteral(tm)
    case 'sign_{':
      return parseStructLiteral(tm)
    case 'keyword_fun':
      return parseFunctionLiteral(tm)
    default:
      throw new CompileError(
        `Unexpected token ${firstToken.name}, expect literal_*`,
        firstToken.start,
      )
  }
}

export function parseArrayLiteral(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_[')

  const children: (AstNode | Token)[] = []

  while (tm.peek()?.name !== 'sign_]') {
    const element = parseExpression(tm)
    children.push(element)

    if (tm.peek()?.name !== 'sign_]') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_]')

  return {
    type: 'node',
    name: 'array_literal',
    children,
  }
}

export function parseStructLiteral(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{')

  const children: (AstNode | Token)[] = []

  while (tm.peek()?.name !== 'sign_}') {
    const symbol = parseSymbol(tm)

    tm.expectNextToBe('sign_=')

    const value = parseExpression(tm)

    children.push({
      type: 'node',
      name: 'struct_entry',
      children: [symbol, value],
    })

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'struct_literal',
    children,
  }
}

export function parseFunctionLiteral(tm: TokenManager): AstNode {
  const type = parseFunctionTypeExpression(tm)
  const body = parseCodeBlock(tm)

  return {
    type: 'node',
    name: 'function_literal',
    children: [
      type,
      body,
    ],
  }
}

export function parseTemplateInterpolatedLiteral(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{lit')

  const expression = parseExpression(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_interpolated_literal',
    children: [
      expression,
    ],
  }
}
