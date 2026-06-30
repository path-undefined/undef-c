import { TokenManager } from '@/parser/token-manager'
import { AstNode, AstNodeChildren } from '@/types/ast-node'

import { parseTypeExpression } from '@/parser/type-related-parser'
import { parseExpression } from '@/parser/expression-related-parser'
import { parseIdentifier } from '@/parser/identifier-related-parser'

export function parseFunctionParameters(tm: TokenManager): AstNode[] {
  tm.expectNextToBe('sign_(')

  const functionParameters: AstNode[] = []

  while (tm.peek()?.name !== 'sign_)') {
    const children: AstNodeChildren = {}

    const isVariadic = tm.peek()?.name === 'sign_...'

    if (isVariadic) {
      children['isVariadic'] = tm.next()!
    }

    children['name'] = parseIdentifier(tm)

    tm.expectNextToBe('sign_:')

    children['type'] = parseTypeExpression(tm)

    functionParameters.push({
      type: 'node',
      name: 'func_parameter',
      children,
    })

    if (tm.peek()?.name !== 'sign_)') {
      tm.expectNextToBe('sign_,')
    }

    if (isVariadic) {
      tm.expectPeekToBe('sign_)')
    }
  }

  tm.expectNextToBe('sign_)')

  return functionParameters
}

export function parseFunctionArguments(tm: TokenManager): AstNode[] {
  tm.expectNextToBe('sign_(')

  const functionArguments: AstNode[] = []

  while (tm.peek()?.name !== 'sign_)') {
    functionArguments.push(parseExpression(tm))

    if (tm.peek()?.name !== 'sign_)') {
      tm.expectNextToBe('sign_,')
    }
  }

  tm.expectNextToBe('sign_)')

  return functionArguments
}
