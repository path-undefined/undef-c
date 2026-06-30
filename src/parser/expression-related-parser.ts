import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode, AstNodeChildren } from '@/types/ast-node'

import { parseLiteral } from '@/parser/literal-related-parser'
import { parseFunctionArguments } from '@/parser/function-related-parser'
import { parseTypeExpression } from '@/parser/type-related-parser'
import { parseIdentifier, parseIdentifierPath } from '@/parser/identifier-related-parser'
import { parseBlockStatement } from '@/parser/statement-related-parser'

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
    case 'sign_${':
      return parseEvalExpression(tm)
    case 'symbol':
    case 'sign_{{sym':
      return parseIdentifierPath(tm)
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
    case 'sign_{{val':
    case 'sign_[':
    case 'sign_{':
    case 'sign_(){':
    case 'keyword_fun':
      return parseLiteral(tm)
    case 'sign_$':
    case 'sign_@':
      return parseAddressExpression(tm)
    case 'sign_+':
    case 'sign_-':
    case 'sign_!':
    case 'sign_~':
    case 'keyword_alloc':
    case 'keyword_free':
    case 'keyword_init':
    case 'keyword_clear':
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
    throw new CompileError('Parentheses not paired', tm.last()!.end)
  }

  if (rightParenthesis.name !== 'sign_)') {
    throw new CompileError('Unexpected token', rightParenthesis.start)
  }

  return expression
}

export function parseEvalExpression(tm: TokenManager): AstNode {
  const statements: AstNode[] = []

  tm.expectNextToBe('sign_${')

  while (tm.peek()?.name !== 'sign_}') {
    statements.push(parseBlockStatement(tm))
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'eval_expression',
    children: {
      statements,
    },
  }
}

export function parseAddressExpression(tm: TokenManager): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, 80)

  return {
    type: 'node',
    name: 'address_expression',
    children: {
      operator,
      right,
    },
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

  const member = parseIdentifier(tm)

  return {
    type: 'node',
    name: 'member_access_expression',
    children: {
      left,
      member,
    },
  }
}

export function parseIndexAccessExpression(tm: TokenManager, left: AstNode): AstNode {
  const children: AstNodeChildren = {}
  children['left'] = left

  tm.next()

  if (tm.peek()?.name !== 'sign_..') {
    const expression = parseExpression(tm)
    children['index'] = expression
  }

  if (tm.peek()?.name === 'sign_..') {
    tm.next()

    if (children['index']) {
      children['indexStart'] = children['index']
      delete children['index']
    }

    if (tm.peek()?.name !== 'sign_]') {
      const expression = parseExpression(tm)
      children['indexEnd'] = expression
    }
  }

  tm.expectNextToBe('sign_]')

  return {
    type: 'node',
    name: 'index_access_expression',
    children,
  }
}

export function parseFunctionInvokeExpression(tm: TokenManager, left: AstNode): AstNode {
  const functionArguments = parseFunctionArguments(tm)

  return {
    type: 'node',
    name: 'function_invoke_expression',
    children: {
      left,
      arguments: functionArguments,
    },
  }
}

export function parseTypeCastExpression(tm: TokenManager, left: AstNode): AstNode {
  tm.next()

  const type = parseTypeExpression(tm)

  return {
    type: 'node',
    name: 'type_cast_expression',
    children: {
      left,
      type,
    },
  }
}

export function parseUnaryExpression(tm: TokenManager): AstNode {
  const operator = tm.peek()!

  if (operator.name === 'keyword_alloc') {
    return parseAllocExpression(tm)
  }
  else if (operator.name === 'keyword_free') {
    return parseFreeExpression(tm)
  }
  else if (operator.name === 'keyword_init') {
    return parseInitExpression(tm)
  }
  else if (operator.name === 'keyword_clear') {
    return parseClearExpression(tm)
  }
  else {
    tm.next()

    const right = parseExpressionPratt(tm, 70)

    return {
      type: 'node',
      name: 'unary_expression',
      children: {
        operator,
        right,
      },
    }
  }
}

function parseAllocExpression(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.next()

  if (tm.peek()?.name === 'sign_:') {
    tm.next()
    const allocator = parseIdentifierPath(tm)
    children['allocator'] = allocator
  }

  const type = parseTypeExpression(tm)
  children['type'] = type

  if (tm.peek()?.name === 'keyword_count') {
    tm.next()
    const count = parseExpression(tm)
    children['count'] = count
  }

  return {
    type: 'node',
    name: 'alloc_expression',
    children,
  }
}

function parseFreeExpression(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.next()

  if (tm.peek()?.name === 'sign_:') {
    tm.next()

    const allocator = parseIdentifierPath(tm)
    children['allocator'] = allocator
  }

  const pointer = parseExpression(tm)
  children['pointer'] = pointer

  return {
    type: 'node',
    name: 'free_expression',
    children,
  }
}

function parseInitExpression(tm: TokenManager): AstNode {
  tm.next()

  const type = parseTypeExpression(tm)

  const initFunctionArguments = parseFunctionArguments(tm)

  return {
    type: 'node',
    name: 'init_expression',
    children: {
      type,
      arguments: initFunctionArguments,
    },
  }
}

function parseClearExpression(tm: TokenManager): AstNode {
  tm.next()

  const reference = parseExpression(tm)

  return {
    type: 'node',
    name: 'clear_expression',
    children: {
      reference,
    },
  }
}

export function parseBinaryExpression(tm: TokenManager, left: AstNode, precedence: number): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, precedence)

  return {
    type: 'node',
    name: 'binary_expression',
    children: {
      left,
      operator,
      right,
    },
  }
}

export function parseAssignmentExpression(tm: TokenManager, left: AstNode): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, 10)

  return {
    type: 'node',
    name: 'assignment_expression',
    children: {
      left,
      operator,
      right,
    },
  }
}
