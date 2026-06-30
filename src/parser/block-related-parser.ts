import { TokenManager } from '@/parser/token-manager'
import { AstNode } from '@/types/ast-node'

import {
  parseBlockStatement,
  parseGlobalStatement,
} from '@/parser/statement-related-parser'

export function parseCodeBlock(tm: TokenManager): AstNode {
  const statements: AstNode[] = []

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    statements.push(parseBlockStatement(tm))
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'code_block',
    children: {
      statements,
    },
  }
}

export function parseTemplateBlock(tm: TokenManager): AstNode {
  const statements: AstNode[] = []

  tm.expectNextToBe('sign_{')

  while (tm.peek()?.name !== 'sign_}') {
    statements.push(parseGlobalStatement(tm))
  }

  tm.expectNextToBe('sign_}')

  return {
    type: 'node',
    name: 'template_block',
    children: {
      statements,
    },
  }
}
