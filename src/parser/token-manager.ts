import { CompileError } from '@/error/compile-error'
import { Token } from '@/types/token'

export class TokenManager {
  private readonly tokens: Token[]
  private readonly state: number[]
  private currentIndex: number

  public constructor(tokens: Token[]) {
    this.tokens = tokens
    this.state = []
    this.currentIndex = 0
  }

  public peek(): Token | null {
    return this.tokens[this.currentIndex] ?? null
  }

  public next(): Token | null {
    const result = this.tokens[this.currentIndex] ?? null
    this.currentIndex++

    return result
  }

  public last(): Token | null {
    let index = this.currentIndex

    while (!this.tokens[index] && index > 0) {
      index--
    }

    return this.tokens[index] ?? null
  }

  public expectPeekToBe(tokenName?: string): Token {
    const token = this.peek()

    if (!token) {
      throw new CompileError('Unexpected end of file', this.last()?.end ?? { line: 0, char: 0 })
    }

    if (tokenName && token.name !== tokenName) {
      throw new CompileError(`Unexpected token ${token.name}, expect ${tokenName}`, token.start)
    }

    return token
  }

  public expectNextToBe(tokenName?: string): Token {
    const token = this.next()

    if (!token) {
      throw new CompileError('Unexpected end of file', this.last()?.end ?? { line: 0, char: 0 })
    }

    if (tokenName && token.name !== tokenName) {
      throw new CompileError(`Unexpected token ${token.name}, expect ${tokenName}`, token.start)
    }

    return token
  }

  public pushState() {
    this.state.push(this.currentIndex)
  }

  public popState() {
    this.currentIndex = this.state.pop()!
  }
}
