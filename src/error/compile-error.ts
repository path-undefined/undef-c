import { CodePosition } from '@/types/code-position'

export class CompileError extends Error {
  public readonly codePosition?: CodePosition

  public constructor(message: string, codePosition?: CodePosition) {
    super(message)
    this.name = 'ParseError'
    this.codePosition = codePosition
  }
}
