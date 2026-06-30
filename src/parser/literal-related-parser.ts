import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'

import { parseExpression } from '@/parser/expression-related-parser'
import { parseCodeBlock } from '@/parser/block-related-parser'
import { parseFunctionTypeExpression } from '@/parser/type-related-parser'
import { parseIdentifier } from '@/parser/identifier-related-parser'

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
      return tm.next()!
    case 'sign_{{val':
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

  const elements: AstNode[] = []

  while (tm.peek()?.name !== 'sign_]') {
    const element = parseExpression(tm)
    elements.push(element)

    if (tm.peek()?.name !== 'sign_]') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_]')

  return {
    type: 'node',
    name: 'array_literal',
    children: {
      elements,
    },
  }
}

export function parseStructLiteral(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{')

  const entries: AstNode[] = []

  while (tm.peek()?.name !== 'sign_}') {
    const name = parseIdentifier(tm)

    tm.expectNextToBe('sign_=')

    const value = parseExpression(tm)

    entries.push({
      type: 'node',
      name: 'struct_literal_entry',
      children: {
        name,
        value,
      },
    })

    if (tm.peek()?.name !== 'sign_}') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'struct_literal',
    children: {
      entries,
    },
  }
}

export function parseFunctionLiteral(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_fun')

  const type = parseFunctionTypeExpression(tm)
  const block = parseCodeBlock(tm)

  return {
    type: 'node',
    name: 'function_literal',
    children: {
      type,
      block,
    },
  }
}

export function parseTemplateInterpolatedLiteral(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{val')

  const value = parseExpression(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_interpolated_literal',
    children: {
      value,
    },
  }
}
