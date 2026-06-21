import { TokenManager } from '@/parser/token-manager'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import {
  parseBlockStatement,
  parseTemplateStatement,
} from '@/parser/statement-related-parser'

export function parseCodeBlock(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    children.push(parseBlockStatement(tm))
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'code_block',
    children,
  }
}

export function parseTemplateBlock(tm: TokenManager): AstNode {
  const children: (AstNode | Token)[] = []

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    children.push(parseTemplateStatement(tm))
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'template_block',
    children,
  }
}
