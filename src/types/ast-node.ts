import { Token } from '@/types/token'

export type AstNode = {
  type: 'node'
  name: string
  children: (AstNode | Token)[]
}
