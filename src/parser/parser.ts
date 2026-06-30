import { TokenManager } from '@/parser/token-manager'
import { AstNode } from '@/types/ast-node'
import { Token } from '@/types/token'

import { parseGlobalStatement } from '@/parser/statement-related-parser'

export function parse(tokens: Token[]): AstNode {
  const tm = new TokenManager(tokens)

  const globalStatements: AstNode[] = []

  while (tm.peek()) {
    globalStatements.push(parseGlobalStatement(tm))
  }

  return {
    type: 'node',
    name: 'root',
    children: {
      globalStatements,
    },
  }
}
