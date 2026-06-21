import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import { parseExpression } from '@/parser/expression-related-parser'
import { parseIdentifier } from '@/parser/identifier-related-parser'
import { parseTemplateArguments } from '@/parser/template-related-parser'
import {
  parseTypeConstraint,
  parseTypeExpression,
} from '@/parser/type-related-parser'

export function parseGlobalStatement(tm: TokenManager): AstNode {
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
    case 'keyword_tmpl':
      return parseTmplStatement(tm)
    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

export function parsePackageStatement(tm: TokenManager): AstNode {
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

export function parseUseStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_use')

  if (tm.peek()?.name === 'keyword_tmpl') {
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

export function parseExportStatement(tm: TokenManager): AstNode {
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

export function parseDefStatement(tm: TokenManager): AstNode {
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

export function parseTypStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_typ')

  const symbol = tm.expectNextToBe('symbol')

  tm.expectNextToBe('sign_=')

  const type = parseTypeExpression(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'def_statement',
    children: [
      symbol,
      type,
    ],
  }
}

export function parseLitStatement(tm: TokenManager): AstNode {
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

export function parseReturnStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_return')

  const expression = parseExpression(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'return_statement',
    children: [
      expression,
    ],
  }
}

export function parseExprStatement(tm: TokenManager): AstNode {
  const expression = parseExpression(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'expr_statement',
    children: [
      expression,
    ],
  }
}

export function parseTmplStatement(tm: TokenManager): AstNode {
  throw new Error('This function is not yet implemented')
}
