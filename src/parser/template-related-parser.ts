import { TokenManager } from '@/parser/token-manager'
import { AstNode } from '@/types/ast-node'

import { parseLiteral } from '@/parser/literal-related-parser'
import { parseIdentifier } from '@/parser/identifier-related-parser'
import { parseDataAccessExpression } from '@/parser/expression-related-parser'
import {
  parseTypeExpression,
} from '@/parser/type-related-parser'

export function parseTemplateParameters(tm: TokenManager): AstNode[] {
  tm.expectNextToBe('sign_<')

  const templateParameters: AstNode[] = []

  while (tm.peek()?.name !== 'sign_>') {
    const name = parseIdentifier(tm)

    tm.expectNextToBe('sign_:')

    const type = parseTypeExpression(tm)

    templateParameters.push({
      type: 'node',
      name: 'template_parameter',
      children: {
        name,
        type,
      },
    })

    if (tm.peek()?.name !== 'sign_>') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_>')

  return templateParameters
}

export function parseTemplateArguments(tm: TokenManager): AstNode[] | null {
  tm.pushState()

  tm.expectNextToBe('sign_<')

  const templateArguments: AstNode[] = []

  while (tm.peek()?.name !== 'sign_>') {
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
      case 'sign_{{val':
        templateArguments.push(parseLiteral(tm))
        break
      case 'sign_[':
      case 'sign_{':
      case 'sign_(){':
      case 'keyword_fun': {
        let left = parseLiteral(tm)
        if (tm.peek()?.name === 'sign_:') {
          left = parseDataAccessExpression(tm, left)
        }
        templateArguments.push(left)
        break
      }
      case 'symbol':
      case 'sign_{{sym':
      case 'keyword_const':
        templateArguments.push(parseTypeExpression(tm))
        break
    }

    const nextToken = tm.peek()

    if (!nextToken) {
      tm.popState()
      return null
    }

    if (tm.peek()?.name !== 'sign_>') {
      if (tm.peek()?.name !== 'sign_,') {
        tm.popState()
        return null
      }

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

  return templateArguments
}
