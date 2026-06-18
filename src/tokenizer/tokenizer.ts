import { Token } from '@/types/token'
import { tokenDefinitions } from '@/tokenizer/token-definitions'

export function tokenize(source: string): Token[] {
  const tokens: Token[] = []

  let copiedSource = `${source}`
  let currentLine = 1
  let currentChar = 1

  while (copiedSource.length > 0) {
    let token: Token | null = null

    for (const tokenDefinition of tokenDefinitions) {
      const matcher = tokenDefinition.matcher
      let raw = ''

      if (isRegExp(matcher)) {
        const matchResult = matcher.exec(copiedSource)
        if (matchResult) {
          raw = matchResult[0]
        }
      }
      else {
        if (copiedSource.startsWith(matcher)) {
          raw = matcher
        }
      }

      if (raw !== '') {
        if (!token || token.raw.length < raw.length) {
          const linesEaten = raw.split(/(?:\r\n|\r|\n)/)
          const numOfLinesEaten = linesEaten.length - 1
          const endLine = currentLine + numOfLinesEaten
          const endChar = numOfLinesEaten === 0
            ? (currentChar + linesEaten[0].length)
            : (1 + linesEaten[numOfLinesEaten].length)

          token = {
            type: 'token',
            name: tokenDefinition.type,
            raw,
            start: {
              line: currentLine,
              char: currentChar,
            },
            end: {
              line: endLine,
              char: endChar,
            },
          }
        }
      }
    }

    if (token === null) {
      throw new Error(`Unknown token at ${currentLine}:${currentLine}`)
    }

    if (token.name !== 'line_comment' && token.name !== 'trash_character') {
      tokens.push(token)
    }

    currentLine = token.end.line
    currentChar = token.end.char

    copiedSource = copiedSource.substring(token.raw.length)
  }

  return tokens
}

function isRegExp(m: RegExp | string): m is RegExp {
  return m instanceof RegExp
}
