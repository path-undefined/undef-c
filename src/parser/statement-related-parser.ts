import { TokenManager } from '@/parser/token-manager'
import { CompileError } from '@/error/compile-error'
import { AstNode, AstNodeChildren } from '@/types/ast-node'

import { parseLiteral } from '@/parser/literal-related-parser'
import { parseExpression } from '@/parser/expression-related-parser'
import { parseIdentifier, parseIdentifierPath } from '@/parser/identifier-related-parser'
import {
  parseTemplateParameters,
} from '@/parser/template-related-parser'
import {
  parseCodeBlock,
  parseTemplateBlock,
} from '@/parser/block-related-parser'
import { parseFunctionParameters } from '@/parser/function-related-parser'
import {
  parseTypeExpression,
} from '@/parser/type-related-parser'

export function parseGlobalStatement(tm: TokenManager): AstNode {
  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_use':
      return parseUseStatement(tm)
    case 'keyword_export':
      return parseExportStatement(tm)
    case 'keyword_lit':
      return parseLitStatement(tm)
    case 'keyword_def':
      return parseDefStatement(tm)
    case 'keyword_type':
      return parseTypStatement(tm)
    case 'keyword_template':
      return parseTemplateStatement(tm)

    case 'sign_{{exec':
      return parseTemplateEvalStatement(tm)
    case 'sign_{{meta':
      return parseTemplateMetaStatement(tm)
    case 'sign_{{throw':
      return parseTemplateThrowStatement(tm)
    case 'sign_{{if':
      return parseTemplateIfStatement(tm)
    case 'sign_{{/if':
      return parseTemplateEndIfStatement(tm)
    case 'sign_{{foreach':
      return parseTemplateForeachStatement(tm)
    case 'sign_{{/foreach':
      return parseTemplateEndForeachStatement(tm)

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
    case 'keyword_lit':
      return parseLitStatement(tm)
    case 'keyword_type':
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

    case 'sign_{{exec':
      return parseTemplateEvalStatement(tm)
    case 'sign_{{meta':
      return parseTemplateMetaStatement(tm)
    case 'sign_{{throw':
      return parseTemplateThrowStatement(tm)
    case 'sign_{{if':
      return parseTemplateIfStatement(tm)
    case 'sign_{{/if':
      return parseTemplateEndIfStatement(tm)
    case 'sign_{{foreach':
      return parseTemplateForeachStatement(tm)
    case 'sign_{{/foreach':
      return parseTemplateEndForeachStatement(tm)

    default:
      return parseExprStatement(tm)
  }
}

export function parseUseStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_use')

  const nextToken = tm.expectPeekToBe()

  switch (nextToken.name) {
    case 'keyword_package':
      return parseUsePackageStatement(tm)
    case 'keyword_symbol':
      return parseUseSymbolStatement(tm)
    case 'keyword_template':
      return parseUseTemplateStatement(tm)
    case 'keyword_header':
      return parseUseHeaderStatement(tm)
    case 'keyword_extern':
      return parseUseExternStatement(tm)
    default:
      throw new CompileError(
        `Unexpected token ${nextToken.name}, expect keyword_package, keyword_symbol, keyword_template, keyword_header or keyword_extern`,
        nextToken.start,
      )
  }
}

function parseUsePackageStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_package')

  const path = parseIdentifierPath(tm)
  children['path'] = path

  if (tm.peek()?.name === 'keyword_as') {
    tm.next()

    const alias = parseIdentifier(tm)
    children['alias'] = alias
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'use_package_statement',
    children,
  }
}

function parseUseSymbolStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_symbol')

  const path = parseIdentifierPath(tm)
  children['path'] = path

  if (tm.peek()?.name === 'keyword_as') {
    tm.next()

    const alias = parseIdentifier(tm)
    children['alias'] = alias
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'use_symbol_statement',
    children,
  }
}

function parseUseTemplateStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_template')

  const path = parseIdentifierPath(tm)
  children['path'] = path

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'use_template_statement',
    children,
  }
}

function parseUseHeaderStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_header')

  const path = tm.expectNextToBe('literal_string')

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'use_header_statement',
    children: {
      path,
    },
  }
}

function parseUseExternStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_extern')

  const firstToken = tm.expectPeekToBe()

  switch (firstToken.name) {
    case 'keyword_def':
      children['declaration'] = parseDefStatement(tm)
      break
    case 'keyword_type':
      children['declaration'] = parseTypStatement(tm)
      break
    case 'keyword_lit':
      children['declaration'] = parseLitStatement(tm)
      break
    default:
      throw new CompileError(`Unexpected token ${firstToken.name}, expected symbol declaration`, firstToken.start)
  }

  return {
    type: 'node',
    name: 'use_extern_statement',
    children,
  }
}

export function parseExportStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_export')

  if (tm.peek()?.name === 'keyword_extern') {
    children['isExtern'] = tm.next()!
  }

  const path = parseIdentifierPath(tm)
  children['path'] = path

  if (tm.peek()?.name === 'keyword_as') {
    tm.next()

    const alias = parseIdentifier(tm)
    children['alias'] = alias
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'export_statement',
    children,
  }
}

export function parseDefStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_def')

  const symbol = parseIdentifier(tm)
  children['name'] = symbol

  if (tm.peek()?.name === 'sign_:') {
    tm.next()

    children['type'] = parseTypeExpression(tm)
  }

  if (tm.peek()?.name === 'sign_=') {
    tm.next()

    const initialValue = parseExpression(tm)
    children['value'] = initialValue
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'def_statement',
    children,
  }
}

export function parseTypStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_type')

  const name = parseIdentifier(tm)

  tm.expectNextToBe('sign_=')

  const type = parseTypeExpression(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'type_statement',
    children: {
      name,
      type,
    },
  }
}

export function parseLitStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_lit')

  const symbol = parseIdentifier(tm)
  children['name'] = symbol

  if (tm.peek()?.name === 'sign_:') {
    tm.next()

    children['type'] = parseTypeExpression(tm)
  }

  if (tm.peek()?.name === 'sign_=') {
    tm.next()

    const initialValue = parseExpression(tm)
    children['value'] = initialValue
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'lit_statement',
    children,
  }
}

export function parseIfStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  const conditionEntries: AstNode[] = []

  tm.expectNextToBe('keyword_if')

  tm.expectNextToBe('sign_(')
  const condition = parseExpression(tm)
  tm.expectNextToBe('sign_)')

  const block = parseCodeBlock(tm)

  conditionEntries.push({
    type: 'node',
    name: 'if_condition_entry',
    children: {
      condition,
      block,
    },
  })

  while (tm.peek()?.name === 'keyword_elseif') {
    tm.next()

    tm.expectNextToBe('sign_(')
    const condition = parseExpression(tm)
    tm.expectNextToBe('sign_)')

    const block = parseCodeBlock(tm)

    conditionEntries.push({
      type: 'node',
      name: 'if_condition_entry',
      children: {
        condition,
        block,
      },
    })
  }

  children['conditionEntries'] = conditionEntries

  if (tm.peek()?.name === 'keyword_else') {
    tm.next()

    const block = parseCodeBlock(tm)

    children['fallbackBlock'] = block
  }

  return {
    type: 'node',
    name: 'if_statement',
    children,
  }
}

export function parseSwitchStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_switch')

  tm.expectNextToBe('sign_(')

  const value = parseExpression(tm)
  children['value'] = value

  tm.expectNextToBe('sign_)')

  const conditionEntries: AstNode[] = []

  while (tm.peek()?.name === 'keyword_case') {
    tm.next()

    tm.expectNextToBe('sign_(')
    const condition = parseExpression(tm)
    tm.expectNextToBe('sign_)')

    const block = parseCodeBlock(tm)

    conditionEntries.push({
      type: 'node',
      name: 'switch_condition_entry',
      children: {
        condition,
        block,
      },
    })
  }

  children['conditionEntries'] = conditionEntries

  if (tm.peek()?.name === 'keyword_else') {
    tm.next()

    const block = parseCodeBlock(tm)
    children['fallbackBlock'] = block
  }

  return {
    type: 'node',
    name: 'switch_statement',
    children,
  }
}

export function parseLoopStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_loop')

  const block = parseCodeBlock(tm)

  return {
    type: 'node',
    name: 'loop_statement',
    children: {
      block,
    },
  }
}

export function parseWhileStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_while')
  tm.expectNextToBe('sign_(')

  const condition = parseExpression(tm)

  tm.expectNextToBe('sign_)')

  const block = parseCodeBlock(tm)

  return {
    type: 'node',
    name: 'while_statement',
    children: {
      condition,
      block,
    },
  }
}

export function parseForStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  tm.expectNextToBe('keyword_for')

  tm.expectNextToBe('sign_(')

  if (tm.peek()?.name === 'sign_;') {
    tm.next()
  }
  else if (tm.peek()?.name === 'keyword_def') {
    children['initSegment'] = parseDefStatement(tm)
  }
  else {
    children['initSegment'] = parseExpression(tm)
    tm.expectNextToBe('sign_;')
  }

  if (tm.peek()?.name === 'sign_;') {
    tm.next()
  }
  else {
    children['conditionSegment'] = parseExpression(tm)
    tm.expectNextToBe('sign_;')
  }

  if (tm.peek()?.name === 'sign_)') {
    // Do nothing
  }
  else {
    children['incrementSegment'] = parseExpression(tm)
  }

  tm.expectNextToBe('sign_)')

  const block = parseCodeBlock(tm)
  children['block'] = block

  return {
    type: 'node',
    name: 'for_statement',
    children,
  }
}

export function parseTryStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_try')

  const children: AstNodeChildren = {}
  const catchEntries: AstNode[] = []

  const block = parseCodeBlock(tm)
  children['block'] = block

  while (tm.peek()?.name === 'keyword_catch') {
    tm.next()

    const error = parseFunctionParameters(tm)
    const block = parseCodeBlock(tm)

    catchEntries.push({
      type: 'node',
      name: 'try_catch_entry',
      children: {
        error,
        block,
      },
    })
  }

  children['catchEntries'] = catchEntries

  return {
    type: 'node',
    name: 'try_statement',
    children,
  }
}

export function parseBlockEndingStatement(tm: TokenManager): AstNode {
  const children: AstNodeChildren = {}

  const keyword = tm.expectNextToBe()
  children['keyword'] = keyword

  if (tm.peek()?.name !== 'sign_;') {
    const expression = parseExpression(tm)
    children['value'] = expression
  }

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'block_ending_statement',
    children,
  }
}

export function parseExprStatement(tm: TokenManager): AstNode {
  const expression = parseExpression(tm)

  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'expr_statement',
    children: {
      expression,
    },
  }
}

export function parseTemplateStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('keyword_template')

  const name = parseIdentifier(tm)

  const parameters = parseTemplateParameters(tm)

  const block = parseTemplateBlock(tm)

  return {
    type: 'node',
    name: 'template_statement',
    children: {
      name,
      parameters,
      block,
    },
  }
}

export function parseTemplateEvalStatement(tm: TokenManager): AstNode {
  const statements: AstNode[] = []

  tm.expectNextToBe('sign_{{exec')

  while (tm.peek()?.name !== 'sign_}}') {
    statements.push(parseBlockStatement(tm))
  }

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_eval_statement',
    children: {
      statements,
    },
  }
}

export function parseTemplateMetaStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{meta')

  const type = parseTypeExpression(tm)

  tm.expectNextToBe('keyword_as')

  const variable = parseIdentifier(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_meta_statement',
    children: {
      type,
      variable,
    },
  }
}

export function parseTemplateThrowStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{throw')

  const reason = parseLiteral(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_meta_statement',
    children: {
      reason,
    },
  }
}

export function parseTemplateIfStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{if')

  const condition = parseExpression(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_if_statement',
    children: {
      condition,
    },
  }
}

export function parseTemplateEndIfStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{/if')
  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_end_if_statement',
    children: {},
  }
}

export function parseTemplateForeachStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{foreach')

  const collection = parseExpression(tm)

  tm.expectNextToBe('keyword_as')

  const variable = parseIdentifier(tm)

  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_for_statement',
    children: {
      collection,
      variable,
    },
  }
}

export function parseTemplateEndForeachStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_{{/foreach')
  tm.expectNextToBe('sign_}}')

  return {
    type: 'node',
    name: 'template_end_for_statement',
    children: {},
  }
}

export function parseEmptyStatement(tm: TokenManager): AstNode {
  tm.expectNextToBe('sign_;')

  return {
    type: 'node',
    name: 'empty_statement',
    children: {},
  }
}
