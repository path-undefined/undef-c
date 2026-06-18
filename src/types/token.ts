import { CodePosition } from '@/types/code-position'

export type Token = {
  type: 'token'
  name: string
  raw: string
  start: CodePosition
  end: CodePosition
}
