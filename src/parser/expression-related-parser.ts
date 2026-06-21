import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import { parseIdentifier } from '@/parser/identifier-related-parser'
import { parseLiteral } from '@/parser/literal-related-parser'
import { parseFunctionArguments } from '@/parser/function-related-parser'
import { parseTypeExpression } from '@/parser/type-related-parser'

export function parseExpression(tm: TokenManager): AstNode {
  return parseExpressionPratt(tm, 0)
}

export function parseExpressionPratt(tm: TokenManager, precedence: number): AstNode {
  let left = parseExpressionPrefix(tm)

  let potentialLeft = parseExpressionInfix(tm, left, precedence)

  while (potentialLeft) {
    left = potentialLeft
    potentialLeft = parseExpressionInfix(tm, left, precedence)
  }

  return left
}

export function parseExpressionPrefix(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'sign_(':
      return parseParenthesesExpression(tm)
    case 'sign_$':
    case 'sign_@':
      return parseAddressExpression(tm)
    case 'symbol':
      return parseIdentifier(tm)
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
    case 'sign_[':
    case 'sign_{':
    case 'sign_(){':
    case 'keyword_fun':
      return parseLiteral(tm)
    case 'sign_+':
    case 'sign_-':
    case 'sign_!':
    case 'sign_~':
      return parseUnaryExpression(tm)
    default:
      throw new CompileError(
        `Unexpected token ${firstToken.name}, expect an expression`,
        firstToken.start,
      )
  }
}

export function parseExpressionInfix(tm: TokenManager, left: AstNode, precedence: number): AstNode | null {
  const firstToken = tm.expectPeekToBe()

  if (firstToken.name === 'sign_<' || firstToken.name === 'sign_>') {
    tm.pushState()

    tm.next()
    const nextToken = tm.expectPeekToBe()

    tm.popState()

    if (nextToken.name === firstToken.name) {
      return precedence < 60 ? parseBinaryExpression(tm, left, 60) : null
    }
    else {
      return precedence < 40 ? parseBinaryExpression(tm, left, 40) : null
    }
  }

  switch (firstToken.name) {
    case 'sign_.':
    case 'sign_[':
    case 'sign_(':
    case 'sign_:':
      return precedence < 80 ? parseDataAccessExpression(tm, left) : null
    case 'sign_*':
    case 'sign_/':
    case 'sign_%':
    case 'sign_&':
      return precedence < 60 ? parseBinaryExpression(tm, left, 60) : null
    case 'sign_+':
    case 'sign_-':
    case 'sign_|':
    case 'sign_^':
      return precedence < 50 ? parseBinaryExpression(tm, left, 50) : null
    case 'sign_<=':
    case 'sign_>=':
    case 'sign_==':
    case 'sign_!=':
      return precedence < 40 ? parseBinaryExpression(tm, left, 40) : null
    case 'sign_&&':
      return precedence < 30 ? parseBinaryExpression(tm, left, 30) : null
    case 'sign_||':
      return precedence < 20 ? parseBinaryExpression(tm, left, 20) : null
    case 'sign_=':
    case 'sign_+=':
    case 'sign_-=':
    case 'sign_*=':
    case 'sign_/=':
    case 'sign_%=':
    case 'sign_<<=':
    case 'sign_>>=':
    case 'sign_&=':
    case 'sign_^=':
    case 'sign_|=':
      return precedence < 10 ? parseAssignmentExpression(tm, left) : null
    default:
      return null
  }
}

export function parseParenthesesExpression(tm: TokenManager): AstNode {
  tm.next()

  const expression = parseExpression(tm)

  const rightParenthesis = tm.next()

  if (!rightParenthesis) {
    throw new CompileError('Parentheses not paired', tm.last()?.end)
  }

  if (rightParenthesis.name !== 'sign_)') {
    throw new CompileError('Unexpected token', rightParenthesis.start)
  }

  return expression
}

export function parseAddressExpression(tm: TokenManager): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, 80)

  return {
    type: 'node',
    name: 'address_expression',
    children: [
      operator,
      right,
    ],
  }
}

export function parseDataAccessExpression(tm: TokenManager, left: AstNode): AstNode {
  const firstToken = tm.peek()!

  switch (firstToken.name) {
    case 'sign_.':
      return parseMemberAccessExpression(tm, left)
    case 'sign_[':
      return parseIndexAccessExpression(tm, left)
    case 'sign_(':
      return parseFunctionInvokeExpression(tm, left)
    case 'sign_:':
      return parseTypeCastExpression(tm, left)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

export function parseMemberAccessExpression(tm: TokenManager, left: AstNode): AstNode {
  tm.next()

  const symbol = tm.expectNextToBe('symbol')

  return {
    type: 'node',
    name: 'member_access_expression',
    children: [
      left,
      symbol,
    ],
  }
}

export function parseIndexAccessExpression(tm: TokenManager, left: AstNode): AstNode {
  tm.next()

  const children: (AstNode | Token)[] = []

  if (tm.peek()?.name !== 'sign_..') {
    const expression = parseExpression(tm)
    children.push(expression)
  }

  if (tm.peek()?.name === 'sign_..') {
    children.push(tm.next()!)

    if (tm.peek()?.name !== 'sign_]') {
      const expression = parseExpression(tm)
      children.push(expression)
    }
  }

  tm.expectNextToBe('sign_]')

  return {
    type: 'node',
    name: 'index_access_expression',
    children: [
      left,
      ...children,
    ],
  }
}

export function parseFunctionInvokeExpression(tm: TokenManager, left: AstNode): AstNode {
  const functionArguments = parseFunctionArguments(tm)

  return {
    type: 'node',
    name: 'function_invoke_expression',
    children: [
      left,
      functionArguments,
    ],
  }
}

export function parseTypeCastExpression(tm: TokenManager, left: AstNode): AstNode {
  tm.next()

  const type = parseTypeExpression(tm)

  return {
    type: 'node',
    name: 'type_cast_expression',
    children: [
      left,
      type,
    ],
  }
}

export function parseUnaryExpression(tm: TokenManager): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, 70)

  return {
    type: 'node',
    name: 'unary_expression',
    children: [
      operator,
      right,
    ],
  }
}

export function parseBinaryExpression(tm: TokenManager, left: AstNode, precedence: number): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, precedence)

  return {
    type: 'node',
    name: 'binary_expression',
    children: [
      left,
      operator,
      right,
    ],
  }
}

export function parseAssignmentExpression(tm: TokenManager, left: AstNode): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, 10)

  return {
    type: 'node',
    name: 'assignment_expression',
    children: [
      left,
      operator,
      right,
    ],
  }
}
