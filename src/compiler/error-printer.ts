import * as fs from 'node:fs'
import { CompileError } from '@/error/compile-error'

export function printError(sourceFilePath: string, e: CompileError) {
  const sourceFileContent = fs.readFileSync(sourceFilePath, 'utf-8')

  const { line, char } = e.codePosition

  const sourceFileLines = sourceFileContent.split(/(?:\r\n|\r|\n)/)
  const sourceLineContent = sourceFileLines[line - 1]

  console.error(`${sourceFilePath}:${line}:${char}: ${e.message}`)
  console.error()
  console.error(`${line.toString().padStart(6, ' ')} | ${sourceLineContent}`)
  console.error(`${'^'.padStart(6 + 3 + char, ' ')}`)
}
