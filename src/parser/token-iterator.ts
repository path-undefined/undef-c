import { Token } from '@/types/token'

export class TokenIterator {
  private readonly tokens: Token[]
  private currentIndex: number

  public constructor(tokens: Token[]) {
    this.tokens = tokens
    this.currentIndex = 0
  }

  public peek(): Token | null {
    return this.tokens[this.currentIndex] ?? null
  }

  public pop(): Token | null {
    const result = this.tokens[this.currentIndex] ?? null
    this.currentIndex++

    return result
  }

  public last(num: number = 1): Token | null {
    return this.tokens[this.currentIndex - num] ?? null
  }

  public getIndex(): number {
    return this.currentIndex
  }

  public setIndex(index: number) {
    this.currentIndex = index
  }
}
