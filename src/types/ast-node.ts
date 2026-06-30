import { Token } from '@/types/token'

export type AstNode
  = | AstBranchNode
    | AstLeafNode

export type AstBranchNode = {
  type: 'node'
  name: string
  children: AstNodeChildren
}

export type AstLeafNode = Token

export type AstNodeChildren = Record<string, AstNode | AstNode[]>
