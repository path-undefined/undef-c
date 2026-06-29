import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import { parseLiteral } from '@/parser/literal-related-parser'
import { parseExpression } from '@/parser/expression-related-parser'
import { parseIdentifier } from '@/parser/identifier-related-parser'
import { parseSimpleSymbol, parseSymbol } from '@/parser/symbol-related-parser'
import {
  parseTemplateArguments,
  parseTemplateParameters,
} from '@/parser/template-related-parser'
import {
  parseCodeBlock,
  parseTemplateBlock,
} from '@/parser/block-related-parser'
import { parseFunctionParameters } from '@/parser/function-related-parser'
import {
  parseFunctionTypeExpression,
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
    case 'keyword_lit':
      return parseLitStatement(tm)
    case 'keyword_def':
      return parseDefStatement(tm)
    case 'keyword_fun':
      return parseFunStatement(tm)
    case 'keyword_typ':
      return parseTypStatement(tm)
    case 'keyword_tmpl':
      return parseTmplStatement(tm)

    case 'sign_{{eval':
      return parseTemplateEvalStatement(tm)
    case 'sign_{{meta':
      return parseTemplateMetaStatement(tm)
    case 'sign_{{throw':
      return parseTemplateThrowStatement(tm)
    case 'sign_{{if':
      return parseTemplateIfStatement(tm)
    case 'sign_{{/if':
      return parseTemplateEndIfStatement(tm)
    case 'sign_{{for':
      return parseTemplateForStatement(tm)
    case 'sign_{{/for':
      return parseTemplateEndForStatement(tm)

    case 'sign_;':
      return parseEmptyStatement(tm)

    default:
      throw new CompileError('Unexpected token', firstToken.start)
  }
}

export function parseBlockStatement(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_use':
      return parseUseStatement(tm)
    case 'keyword_def':
      return parseDefStatement(tm)
    case 'keyword_typ':
      return parseTypStatement(tm)
    case 'keyword_if':
      return parseIfStatement(tm)
    case 'keyword_switch':
      return parseSwitchStatement(tm)
    case 'keyword_for':
      return parseForStatement(tm)
    case 'keyword_while':
      return parseWhileStatement(tm)
    case 'keyword_loop':
      return parseLoopStatement(tm)
    case 'keyword_try':
      return parseTryStatement(tm)
    case 'keyword_return':
    case 'keyword_throw':
    case 'keyword_defer':
    case 'keyword_break':
    case 'keyword_continue':
      return parseBlockEndingStatement(tm)

    case 'sign_{{eval':
      return parseTemplateEvalStatement(tm)
    case 'sign_{{meta':
      return parseTemplateMetaStatement(tm)
    case 'sign_{{throw':
      return parseTemplateThrowStatement(tm)
    case 'sign_{{if':
      return parseTemplateIfStatement(tm)
    case 'sign_{{/if':
      return parseTemplateEndIfStatement(tm)
    case 'sign_{{for':
      return parseTemplateForStatement(tm)
    case 'sign_{{/for':
      return parseTemplateEndForStatement(tm)

    default:
      return parseExprStatement(tm)
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
  else if (tm.peek()?.name === 'literal_string') {
    children.push(tm.next()!)

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

      const alias = parseSimpleSymbol(tm)
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

  if (tm.peek()?.name === 'keyword_extern') {
    children.push(tm.next()!)
  }

  const identifier = parseIdentifier(tm)
  children.push(identifier)

  if (tm.peek()?.name === 'keyword_as') {
    tm.next()

    const alias = parseSimpleSymbol(tm)
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

  const identifier = parseIdentifier(tm)

  children.push(identifier)

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

export function parseFunStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_fun')

  const identifier = parseIdentifier(tm)
  const type = parseFunctionTypeExpression(tm)
  const body = parseCodeBlock(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'fun_statement',
    children: [
      identifier,
      type,
      body,
    ],
  }
}

export function parseTypStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_typ')

  const identifier = parseIdentifier(tm)

  tm.expectNextToBe('sign_=')

  const type = parseTypeExpression(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'typ_statement',
    children: [
      identifier,
      type,
    ],
  }
}

export function parseLitStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_lit')

  const identifier = parseIdentifier(tm)

  children.push(identifier)

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

export function parseIfStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const keyword = tm.expectNextToBe('keyword_if')
  children.push(keyword)

  tm.expectNextToBe('sign_(')

  const condition = parseExpression(tm)
  children.push(condition)

  tm.expectNextToBe('sign_)')

  const body = parseCodeBlock(tm)
  children.push(body)

  while (tm.peek()?.name === 'keyword_elseif') {
    const keyword = tm.expectNextToBe('keyword_elseif')
    children.push(keyword)

    tm.expectNextToBe('sign_(')

    const condition = parseExpression(tm)
    children.push(condition)

    tm.expectNextToBe('sign_)')

    const body = parseCodeBlock(tm)
    children.push(body)
  }

  if (tm.peek()?.name === 'keyword_else') {
    const keyword = tm.expectNextToBe('keyword_else')
    children.push(keyword)

    const body = parseCodeBlock(tm)
    children.push(body)
  }

  return {
    type: 'node',
    name: 'if_statement',
    children,
  }
}

export function parseSwitchStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const keyword = tm.expectNextToBe('keyword_switch')
  children.push(keyword)

  tm.expectNextToBe('sign_(')

  const value = parseExpression(tm)
  children.push(value)

  tm.expectNextToBe('sign_)')

  while (tm.peek()?.name === 'keyword_case') {
    const keyword = tm.next()!
    children.push(keyword)

    tm.expectNextToBe('sign_(')

    const expectedValue = parseExpression(tm)
    children.push(expectedValue)

    tm.expectNextToBe('sign_)')

    const body = parseCodeBlock(tm)
    children.push(body)
  }

  if (tm.peek()?.name === 'keyword_else') {
    const keyword = tm.expectNextToBe('keyword_else')
    children.push(keyword)

    const body = parseCodeBlock(tm)
    children.push(body)
  }

  return {
    type: 'node',
    name: 'switch_statement',
    children,
  }
}

export function parseLoopStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_loop')

  const body = parseCodeBlock(tm)

  return {
    type: 'node',
    name: 'loop_statement',
    children: [
      body,
    ],
  }
}

export function parseWhileStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_while')
  tm.expectNextToBe('sign_(')

  const condition = parseExpression(tm)

  tm.expectNextToBe('sign_)')

  const body = parseCodeBlock(tm)

  return {
    type: 'node',
    name: 'while_statement',
    children: [
      condition,
      body,
    ],
  }
}

export function parseForStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('keyword_for')

  tm.expectNextToBe('sign_(')

  const nextToken = tm.expectPeekToBe()

  if (nextToken.name === 'sign_;') {
    children.push({
      type: 'node',
      name: 'for_init_statement',
      children: [],
    })
  }
  else if (nextToken.name === 'keyword_def') {
    const subChildren: (AstNode | Token)[] = []

    const keyword = tm.next()!
    subChildren.push(keyword)

    const symbol = parseSymbol(tm)
    subChildren.push(symbol)

    if (tm.peek()?.name === 'sign_:') {
      subChildren.push(parseTypeConstraint(tm))
    }

    tm.expectNextToBe('sign_=')

    const initialValue = parseExpression(tm)
    subChildren.push(initialValue)

    children.push({
      type: 'node',
      name: 'for_init_statement',
      children: subChildren,
    })
  }
  else {
    const expression = parseExpression(tm)
    children.push({
      type: 'node',
      name: 'for_init_statement',
      children: [
        expression,
      ],
    })
  }

  tm.expectNextToBe('sign_;')

  if (tm.peek()?.name !== 'sign_;') {
    const condition = parseExpression(tm)
    children.push({
      type: 'node',
      name: 'for_condition_expression',
      children: [
        condition,
      ],
    })
  }
  else {
    children.push({
      type: 'node',
      name: 'for_condition_expression',
      children: [],
    })
  }

  tm.expectNextToBe('sign_;')

  if (tm.peek()?.name !== 'sign_)') {
    const expression = parseExpression(tm)
    children.push({
      type: 'node',
      name: 'for_increment_expression',
      children: [
        expression,
      ],
    })
  }
  else {
    children.push({
      type: 'node',
      name: 'for_increment_expression',
      children: [],
    })
  }

  tm.expectNextToBe('sign_)')

  const body = parseCodeBlock(tm)
  children.push(body)

  return {
    type: 'node',
    name: 'for_statement',
    children,
  }
}

export function parseTryStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const keyword = tm.expectNextToBe('keyword_try')
  children.push(keyword)

  const tryBlock = parseCodeBlock(tm)
  children.push(tryBlock)

  while (tm.peek()?.name === 'keyword_catch') {
    const keyword = tm.expectNextToBe('keyword_catch')
    children.push(keyword)

    const errorParameters = parseFunctionParameters(tm)
    children.push(errorParameters)

    const catchBlock = parseCodeBlock(tm)
    children.push(catchBlock)
  }

  return {
    type: 'node',
    name: 'try_statement',
    children,
  }
}

export function parseBlockEndingStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  const keyword = tm.expectNextToBe()
  children.push(keyword)

  if (tm.peek()?.name !== 'sign_;') {
    const expression = parseExpression(tm)
    children.push(expression)
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'returning_statement',
    children,
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
  tm.expectNextToBe('keyword_tmpl')

  const name = parseSymbol(tm)

  const parameters = parseTemplateParameters(tm)

  const block = parseTemplateBlock(tm)

  return {
    type: 'node',
    name: 'tmpl_statement',
    children: [
      name,
      parameters,
      block,
    ],
  }
}

export function parseTemplateEvalStatement(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('sign_{{eval')

  while (tm.peek()?.name !== 'sign_}}') {
    children.push(parseBlockStatement(tm))
  }

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_eval_statement',
    children,
  }
}

export function parseTemplateMetaStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{meta')

  const type = parseTypeExpression(tm)

  tm.expectNextToBe('keyword_as')

  const symbol = parseSimpleSymbol(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_meta_statement',
    children: [
      type,
      symbol,
    ],
  }
}

export function parseTemplateThrowStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{throw')

  const reason = parseLiteral(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_meta_statement',
    children: [
      reason,
    ],
  }
}

export function parseTemplateIfStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{if')

  const condition = parseExpression(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_if_statement',
    children: [
      condition,
    ],
  }
}

export function parseTemplateEndIfStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{/if')
  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_end_if_statement',
    children: [],
  }
}

export function parseTemplateForStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{for')

  const symbol = parseSymbol(tm)

  tm.expectNextToBe('keyword_in')

  const collection = parseExpression(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_for_statement',
    children: [
      symbol,
      collection,
    ],
  }
}

export function parseTemplateEndForStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{/for')
  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_end_for_statement',
    children: [
    ],
  }
}

export function parseEmptyStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'empty_statement',
    children: [],
  }
}
