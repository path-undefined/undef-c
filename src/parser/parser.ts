import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'
import { TokenManager } from '@/parser/token-manager'

export function parse(tokens: Token[]): AstNode {
  const tm = new TokenManager(tokens)

  const children: (AstNode | Token)[] = []

  while (tm.peek()) {
    children.push(parseGlobalStatement(tm))
  }

  return {
    type: 'node',
    name: 'root',
    children,
  }
}

function parseGlobalStatement(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_package':
      return parsePackageStatement(tm)
    case 'keyword_use':
      return parseUseStatement(tm)
    case 'keyword_export':
      return parseExportStatement(tm)
    case 'keyword_def':
      return parseDefStatement(tm)
    case 'keyword_typ':
      return parseTypStatement(tm)
    case 'keyword_template':
      return parseTemplateStatement(tm)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

function parsePackageStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_package')

  const identifier = parseIdentifier(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'package_statement',
    children: [
      identifier,
    ],
  }
}

function parseUseStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_use')

  if (tm.peek()?.name === 'keyword_template') {
    children.push(tm.next()!)

    const identifier = parseIdentifier(tm)
    children.push(identifier)

    if (tm.peek()?.name === 'sign_<') {
      const templateArguments = parseTemplateArguments(tm)!
      children.push(templateArguments)
    }

    tm.expectNextToBe('sign_;')
  }
  else if (tm.peek()?.name === 'keyword_extern') {
    children.push(tm.next()!)

    const firstToken = tm.expectPeekToBe()

    switch (firstToken.name) {
      case 'keyword_def':
        children.push(parseDefStatement(tm))
        break
      case 'keyword_typ':
        children.push(parseTypStatement(tm))
        break
      case 'keyword_lit':
        children.push(parseLitStatement(tm))
        break
      default:
        throw new CompileError(`Unexpected token ${firstToken.name}, expected symbol declaration`, firstToken.start)
    }
  }
  else {
    const identifier = parseIdentifier(tm)
    children.push(identifier)

    if (tm.peek()?.name === 'keyword_as') {
      tm.next()

      const alias = tm.expectNextToBe('symbol')
      children.push(alias)
    }

    tm.expectNextToBe('sign_;')
  }

  return {
    type: 'node',
    name: 'use_statement',
    children,
  }
}

function parseExportStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_export')

  const identifier = parseIdentifier(tm)
  children.push(identifier)

  if (tm.peek()?.name === 'keyword_as') {
    tm.next()

    const alias = tm.expectNextToBe('symbol')
    children.push(alias)
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'export_statement',
    children,
  }
}

function parseDefStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_def')

  const symbol = tm.expectNextToBe('symbol')

  children.push(symbol)

  let nextToken = tm.expectPeekToBe()

  if (nextToken.name === 'sign_:') {
    children.push(parseTypeConstraint(tm))

    nextToken = tm.expectPeekToBe()
  }

  if (nextToken.name === 'sign_=') {
    tm.next()

    const initialValue = parseExpression(tm)
    children.push(initialValue)
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'def_statement',
    children,
  }
}

function parseTypStatement(tm: TokenManager): AstNode {
  throw new Error('This function is not yet implemented')
}

function parseLitStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_lit')

  const symbol = tm.expectNextToBe('symbol')

  children.push(symbol)

  let nextToken = tm.expectPeekToBe()

  if (nextToken.name === 'sign_:') {
    children.push(parseTypeConstraint(tm))

    nextToken = tm.expectPeekToBe()
  }

  if (nextToken.name === 'sign_=') {
    tm.next()

    const initialValue = parseExpression(tm)
    children.push(initialValue)
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'lit_statement',
    children,
  }
}

function parseTemplateStatement(tm: TokenManager): AstNode {
  throw new Error('This function is not yet implemented')
}

function parseTypeConstraint(tm: TokenManager): AstNode {
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

function parseIdentifier(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const symbol = tm.expectNextToBe('symbol')

  children.push(symbol)

  while (tm.peek()?.name === 'sign_::') {
    tm.next()

    const subSymbol = tm.expectNextToBe('symbol')
    children.push(subSymbol)
  }

  if (tm.peek()?.name === 'sign_<') {
    const templateParam = parseTemplateArguments(tm)

    if (templateParam) {
      children.push(templateParam)
    }
  }

  return {
    type: 'node',
    name: 'identifier',
    children,
  }
}

function parseLiteral(tm: TokenManager): AstNode {
  const literal = tm.expectNextToBe()

  if (![
    'literal_string',
    'literal_char',
    'literal_hex_integer',
    'literal_oct_integer',
    'literal_bin_integer',
    'literal_dec_integer',
    'literal_hex_float',
    'literal_dec_float',
    'literal_bool',
    'literal_null',
  ].includes(literal.name)) {
    throw new CompileError(`Unexpected token ${literal.name}, expect literal_*`, literal.start)
  }

  return {
    type: 'node',
    name: 'literal',
    children: [
      literal,
    ],
  }
}

function parseTemplateArguments(tm: TokenManager): AstNode | null {
  tm.pushState()

  tm.expectNextToBe('sign_<')

  const children: (AstNode | Token)[] = []

  while ([
    'literal_string',
    'literal_char',
    'literal_hex_integer',
    'literal_oct_integer',
    'literal_bin_integer',
    'literal_dec_integer',
    'literal_hex_float',
    'literal_dec_float',
    'literal_bool',
    'literal_null',
    'symbol',
    'keyword_const',
  ].includes(tm.peek()?.name ?? '')) {
    const firstToken = tm.peek()!

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
        children.push(parseLiteral(tm))
        break
      case 'symbol':
      case 'keyword_const':
        children.push(parseTypeExpression(tm))
        break
    }

    const nextToken = tm.peek()

    if (!nextToken) {
      tm.popState()
      return null
    }

    if (nextToken.name !== 'sign_>' && nextToken.name !== 'sign_,') {
      tm.popState()
      return null
    }

    if (nextToken.name === 'sign_,') {
      tm.next()
    }
  }

  const rightChevron = tm.next()

  if (!rightChevron) {
    tm.popState()
    return null
  }

  if (rightChevron.name !== 'sign_>') {
    tm.popState()
    return null
  }

  return {
    type: 'node',
    name: 'template_arguments',
    children,
  }
}

function parseFunctionArguments(tm: TokenManager): AstNode {
  const leftParenthesis = tm.next()

  if (!leftParenthesis) {
    throw new CompileError('Function arguments expected', tm.last()?.end)
  }

  if (leftParenthesis.name !== 'sign_(') {
    throw new CompileError('Unexpected token', leftParenthesis.start)
  }

  const children: (AstNode | Token)[] = []

  while (tm.peek()?.name !== 'sign_)') {
    children.push(parseExpression(tm))

    const nextToken = tm.peek()

    if (!nextToken) {
      throw new CompileError('Unexpected end of code', tm.last()?.end)
    }

    if (nextToken.name !== 'sign_)' && nextToken.name !== 'sign_,') {
      throw new CompileError('Unexpected token', nextToken.start)
    }

    if (nextToken.name === 'sign_,') {
      tm.next()
    }
  }

  tm.next()

  return {
    type: 'node',
    name: 'function_arguments',
    children,
  }
}

function parseExpression(tm: TokenManager): AstNode {
  return parseExpressionPratt(tm, 0)
}

function parseExpressionPratt(tm: TokenManager, precedence: number): AstNode {
  let left = parseExpressionPrefix(tm)

  while (precedence < getExpressionInfixPrecedence(tm)) {
    left = parseExpressionInfix(tm, left)
  }

  return left
}

function parseExpressionPrefix(tm: TokenManager): AstNode {
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
      return parseLiteral(tm)
    case 'sign_+':
    case 'sign_-':
    case 'sign_!':
    case 'sign_~':
      return parseUnaryExpression(tm)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

function getExpressionInfixPrecedence(tm: TokenManager): number {
  const firstToken = tm.peek()

  switch (firstToken?.name) {
    case 'sign_.':
    case 'sign_[':
    case 'sign_(':
    case 'sign_:':
      return 70
    case 'sign_*':
    case 'sign_/':
    case 'sign_%':
    case 'sign_<<':
    case 'sign_>>':
    case 'sign_&':
      return 50
    case 'sign_+':
    case 'sign_-':
    case 'sign_|':
    case 'sign_^':
      return 40
    case 'sign_<':
    case 'sign_>':
    case 'sign_<=':
    case 'sign_>=':
    case 'sign_==':
    case 'sign_!=':
      return 30
    case 'sign_&&':
      return 20
    case 'sign_||':
      return 10
    default:
      return 0
  }
}

function parseExpressionInfix(tm: TokenManager, left: AstNode): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'sign_.':
    case 'sign_[':
    case 'sign_(':
    case 'sign_:':
      return parseDataAccessExpression(tm, left)
    case 'sign_*':
    case 'sign_/':
    case 'sign_%':
    case 'sign_<<':
    case 'sign_>>':
    case 'sign_&':
      return parseBinaryExpression(tm, left, 60)
    case 'sign_+':
    case 'sign_-':
    case 'sign_|':
    case 'sign_^':
      return parseBinaryExpression(tm, left, 50)
    case 'sign_<':
    case 'sign_>':
    case 'sign_<=':
    case 'sign_>=':
    case 'sign_==':
    case 'sign_!=':
      return parseBinaryExpression(tm, left, 40)
    case 'sign_&&':
      return parseBinaryExpression(tm, left, 30)
    case 'sign_||':
      return parseBinaryExpression(tm, left, 20)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

function parseParenthesesExpression(tm: TokenManager): AstNode {
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

function parseAddressExpression(tm: TokenManager): AstNode {
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

function parseDataAccessExpression(tm: TokenManager, left: AstNode): AstNode {
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

function parseMemberAccessExpression(tm: TokenManager, left: AstNode): AstNode {
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

function parseIndexAccessExpression(tm: TokenManager, left: AstNode): AstNode {
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

function parseFunctionInvokeExpression(tm: TokenManager, left: AstNode): AstNode {
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

function parseTypeCastExpression(tm: TokenManager, left: AstNode): AstNode {
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

function parseUnaryExpression(tm: TokenManager): AstNode {
  const operator = tm.next()!
  const right = parseExpressionPratt(tm, 60)

  return {
    type: 'node',
    name: 'unary_expression',
    children: [
      operator,
      right,
    ],
  }
}

function parseBinaryExpression(tm: TokenManager, left: AstNode, precedence: number): AstNode {
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

function parseTypeExpression(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'symbol':
      return parseIdentifier(tm)
    case 'keyword_const':
      return parseModifiedTypeExpression(tm)
    case 'keyword_func':
    case 'keyword_struct':
    case 'keyword_union':
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

function parseModifiedTypeExpression(tm: TokenManager): AstNode {
  const modifier = tm.next()!
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
