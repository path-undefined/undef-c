import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'
import { TokenIterator } from '@/parser/token-iterator'

export function parse(tokens: Token[]): AstNode {
  const tokenIterator = new TokenIterator(tokens)

  return parseDefStatement(tokenIterator)
}

function parseDefStatement(tokens: TokenIterator): AstNode {
  const children: (AstNode | Token)[] = []

  const keyword = tokens.pop()

  if (!keyword) {
    throw new CompileError('Unexpected end of code', tokens.last()?.end)
  }

  if (keyword.name !== 'keyword_def') {
    throw new CompileError('Unexpected token', keyword.start)
  }

  const identifier = tokens.pop()

  if (!identifier) {
    throw new CompileError('Unexpected end of code', tokens.last(2)?.end)
  }

  if (identifier.name !== 'identifier') {
    throw new CompileError('Unexpected token', identifier.start)
  }

  children.push(identifier)

  let nextToken = tokens.peek()

  if (!nextToken) {
    throw new CompileError('Unexpected end of code', tokens.last()?.end)
  }

  if (nextToken.name === 'symbol_:') {
    children.push(parseTypeConstraint(tokens))

    nextToken = tokens.peek()

    if (!nextToken) {
      throw new CompileError('Unexpected end of code', tokens.last()?.end)
    }
  }

  if (nextToken.name === 'symbol_=') {
    tokens.pop()

    const initialValue = parseExpression(tokens)
    children.push(initialValue)
  }

  const semicolon = tokens.pop()

  if (!semicolon) {
    throw new CompileError('Unexpected end of code', tokens.last()?.end)
  }

  if (semicolon.name !== 'symbol_;') {
    throw new CompileError('Unexpected token', semicolon.start)
  }

  return {
    type: 'node',
    name: 'def_statement',
    children,
  }
}

function parseTypeConstraint(tokens: TokenIterator): AstNode {
  const colon = tokens.pop()

  if (!colon) {
    throw new CompileError('Unexpected end of code', tokens.last()?.end)
  }

  if (colon.name !== 'symbol_:') {
    throw new CompileError('Unexpected token', colon.start)
  }

  const type = parseIdentifier(tokens)

  return {
    type: 'node',
    name: 'type_constraint',
    children: [
      type,
    ],
  }
}

// function parseAssignmentStatement(tokens: TokenAccessor): AstNode {}

function parseIdentifier(tokens: TokenIterator): AstNode {
  const identifier = tokens.pop()

  if (!identifier) {
    throw new CompileError('Identifier expected', tokens.last()?.end)
  }

  const children: (AstNode | Token)[] = [identifier]

  while (tokens.peek()?.name === 'symbol_::') {
    tokens.pop()

    const subIdentifier = tokens.pop()

    if (!subIdentifier) {
      throw new CompileError('Identifier expected', tokens.last()?.end)
    }

    if (subIdentifier.name !== 'identifier') {
      throw new CompileError('Unexpected token', subIdentifier.start)
    }

    children.push(subIdentifier)
  }

  if (tokens.peek()?.name === 'symbol_<') {
    const templateParam = parseTemplateArguments(tokens)

    if (templateParam) {
      children.push(templateParam)
    }
  }

  return {
    type: 'node',
    name: children.length === 1
      ? 'local_identifier'
      : 'global_identifier',
    children,
  }
}

function parseLiteral(tokens: TokenIterator): AstNode {
  const literal = tokens.pop()

  if (!literal) {
    throw new CompileError('Literal expected', tokens.last()?.end)
  }

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
    throw new CompileError('Unexpected token', literal.start)
  }

  return {
    type: 'node',
    name: 'literal',
    children: [
      literal,
    ],
  }
}

function parseTemplateArguments(tokens: TokenIterator): AstNode | null {
  const currentIndex = tokens.getIndex()

  const leftChevron = tokens.pop()

  if (!leftChevron) {
    throw new CompileError('Template arguments expected', tokens.last()?.end)
  }

  if (leftChevron.name !== 'symbol_<') {
    throw new CompileError('Unexpected token', leftChevron.start)
  }

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
    'identifier',
  ].includes(tokens.peek()?.name ?? '')) {
    const firstToken = tokens.peek()!

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
        children.push(parseLiteral(tokens))
        break
      case 'identifier':
        children.push(parseIdentifier(tokens))
        break
    }

    const nextToken = tokens.peek()

    if (!nextToken) {
      throw new CompileError('Unfinished template argument list', tokens.last()?.end)
    }

    if (nextToken.name !== 'symbol_>' && nextToken.name !== 'symbol_,') {
      tokens.setIndex(currentIndex)
      return null
    }

    if (nextToken.name === 'symbol_,') {
      tokens.pop()
    }
  }

  const rightChevron = tokens.pop()

  if (!rightChevron) {
    throw new CompileError('Chevron not paired', tokens.last()?.end)
  }

  if (rightChevron.name !== 'symbol_>') {
    tokens.setIndex(currentIndex)
    return null
  }

  return {
    type: 'node',
    name: 'template_arguments',
    children,
  }
}

function parseFunctionArguments(tokens: TokenIterator): AstNode {
  const leftParenthesis = tokens.pop()

  if (!leftParenthesis) {
    throw new CompileError('Function arguments expected', tokens.last()?.end)
  }

  if (leftParenthesis.name !== 'symbol_(') {
    throw new CompileError('Unexpected token', leftParenthesis.start)
  }

  const children: (AstNode | Token)[] = []

  while (tokens.peek()?.name !== 'symbol_)') {
    children.push(parseExpression(tokens))

    const nextToken = tokens.peek()

    if (!nextToken) {
      throw new CompileError('Unexpected end of code', tokens.last()?.end)
    }

    if (nextToken.name !== 'symbol_)' && nextToken.name !== 'symbol_,') {
      throw new CompileError('Unexpected token', nextToken.start)
    }

    if (nextToken.name === 'symbol_,') {
      tokens.pop()
    }
  }

  tokens.pop()

  return {
    type: 'node',
    name: 'function_arguments',
    children,
  }
}

function parseExpression(tokens: TokenIterator): AstNode {
  const expression = parseExpressionPratt(tokens, 0)

  return {
    type: 'node',
    name: 'expression',
    children: [
      expression,
    ],
  }
}

function parseExpressionPratt(tokens: TokenIterator, precedence: number): AstNode {
  let left = parseExpressionPrefix(tokens)

  while (precedence < getExpressionInfixPrecedence(tokens)) {
    left = parseExpressionInfix(tokens, left)
  }

  return left
}

function parseExpressionPrefix(tokens: TokenIterator): AstNode {
  const firstToken = tokens.peek()

  if (!firstToken) {
    throw new CompileError('Expression expected', tokens.last()?.end)
  }

  switch (firstToken.name) {
    case 'symbol_(':
      return parseParenthesesExpression(tokens)
    case 'symbol_$':
    case 'symbol_@':
      return parseAddressExpression(tokens)
    case 'identifier':
      return parseIdentifier(tokens)
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
      return parseLiteral(tokens)
    case 'symbol_+':
    case 'symbol_-':
    case 'symbol_!':
    case 'symbol_~':
      return parseUnaryExpression(tokens)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

function getExpressionInfixPrecedence(tokens: TokenIterator): number {
  const firstToken = tokens.peek()

  switch (firstToken?.name) {
    case 'symbol_.':
    case 'symbol_[':
    case 'symbol_(':
    case 'symbol_:':
      return 70
    case 'symbol_*':
    case 'symbol_/':
    case 'symbol_%':
    case 'symbol_<<':
    case 'symbol_>>':
    case 'symbol_&':
      return 50
    case 'symbol_+':
    case 'symbol_-':
    case 'symbol_|':
    case 'symbol_^':
      return 40
    case 'symbol_<':
    case 'symbol_>':
    case 'symbol_<=':
    case 'symbol_>=':
    case 'symbol_==':
    case 'symbol_!=':
      return 30
    case 'symbol_&&':
      return 20
    case 'symbol_||':
      return 10
    default:
      return 0
  }
}

function parseExpressionInfix(tokens: TokenIterator, left: AstNode): AstNode {
  const firstToken = tokens.peek()

  if (!firstToken) {
    throw new CompileError('Token expected', tokens.last()?.end)
  }

  switch (firstToken.name) {
    case 'symbol_.':
    case 'symbol_[':
    case 'symbol_(':
    case 'symbol_:':
      return parseDataAccessExpression(tokens, left)
    case 'symbol_*':
    case 'symbol_/':
    case 'symbol_%':
    case 'symbol_<<':
    case 'symbol_>>':
    case 'symbol_&':
      return parseBinaryExpression(tokens, left, 60)
    case 'symbol_+':
    case 'symbol_-':
    case 'symbol_|':
    case 'symbol_^':
      return parseBinaryExpression(tokens, left, 50)
    case 'symbol_<':
    case 'symbol_>':
    case 'symbol_<=':
    case 'symbol_>=':
    case 'symbol_==':
    case 'symbol_!=':
      return parseBinaryExpression(tokens, left, 40)
    case 'symbol_&&':
      return parseBinaryExpression(tokens, left, 30)
    case 'symbol_||':
      return parseBinaryExpression(tokens, left, 20)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

function parseParenthesesExpression(tokens: TokenIterator): AstNode {
  tokens.pop()!

  const expression = parseExpression(tokens)

  const rightParenthesis = tokens.pop()

  if (!rightParenthesis) {
    throw new CompileError('Parentheses not paired', tokens.last()?.end)
  }

  if (rightParenthesis.name !== 'symbol_)') {
    throw new CompileError('Unexpected token', rightParenthesis.start)
  }

  return expression
}

function parseAddressExpression(tokens: TokenIterator): AstNode {
  const operator = tokens.pop()!
  const right = parseExpressionPratt(tokens, 80)

  return {
    type: 'node',
    name: 'address_expression',
    children: [
      operator,
      right,
    ],
  }
}

function parseDataAccessExpression(tokens: TokenIterator, left: AstNode): AstNode {
  const firstToken = tokens.peek()!

  switch (firstToken.name) {
    case 'symbol_.':
      return parseMemberAccessExpression(tokens, left)
    case 'symbol_[':
      return parseIndexAccessExpression(tokens, left)
    case 'symbol_(':
      return parseFunctionInvokeExpression(tokens, left)
    case 'symbol_:':
      return parseTypeCastExpression(tokens, left)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

function parseMemberAccessExpression(tokens: TokenIterator, left: AstNode): AstNode {
  const dot = tokens.pop()!

  const identifier = tokens.pop()

  if (!identifier) {
    throw new CompileError(`Identifier expected`, dot.end)
  }

  if (identifier.name !== 'identifier') {
    throw new CompileError('Unexpected token', identifier.start)
  }

  return {
    type: 'node',
    name: 'member_access_expression',
    children: [
      left,
      identifier,
    ],
  }
}

function parseIndexAccessExpression(tokens: TokenIterator, left: AstNode): AstNode {
  tokens.pop()!

  const expression = parseExpression(tokens)

  const rightBracket = tokens.pop()

  if (!rightBracket) {
    throw new CompileError('Bracket not paired', tokens.last()?.end)
  }

  if (rightBracket.name !== 'symbol_]') {
    throw new CompileError('Unexpected token', rightBracket.start)
  }

  return {
    type: 'node',
    name: 'index_access_expression',
    children: [
      left,
      expression,
    ],
  }
}

function parseFunctionInvokeExpression(tokens: TokenIterator, left: AstNode): AstNode {
  const functionArguments = parseFunctionArguments(tokens)

  return {
    type: 'node',
    name: 'function_invoke_expression',
    children: [
      left,
      functionArguments,
    ],
  }
}

function parseTypeCastExpression(tokens: TokenIterator, left: AstNode): AstNode {
  tokens.pop()

  const type = parseIdentifier(tokens)

  return {
    type: 'node',
    name: 'type_cast_expression',
    children: [
      left,
      type,
    ],
  }
}

function parseUnaryExpression(tokens: TokenIterator): AstNode {
  const operator = tokens.pop()!
  const right = parseExpressionPratt(tokens, 60)

  return {
    type: 'node',
    name: 'unary_expression',
    children: [
      operator,
      right,
    ],
  }
}

function parseBinaryExpression(tokens: TokenIterator, left: AstNode, precedence: number): AstNode {
  const operator = tokens.pop()!
  const right = parseExpressionPratt(tokens, precedence)

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
