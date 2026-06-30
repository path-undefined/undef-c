import * as fs from 'node:fs'
import { CompileError } from '@/error/compile-error'
import { discover } from '@/discoverer/discoverer'
import { AstNode } from '@/types/ast-node'
import { tokenize } from '@/tokenizer/tokenizer'
import { parse } from '@/parser/parser'
import { printError } from '@/compiler/error-printer'
import { printAst } from '@/utilities/debug-utilities'

export function compile(basePath: string) {
  const sourceFilePaths = discover(basePath)

  const astLookup: Record<string, AstNode> = {}

  for (const sourceFilePath of sourceFilePaths) {
    console.log(`Parsing file ${sourceFilePath}`)

    try {
      const sourceFileContent = fs.readFileSync(sourceFilePath, 'utf-8')

      const tokens = tokenize(sourceFileContent)
      const ast = parse(tokens)

      astLookup[sourceFilePath] = ast

      printAst(ast)
    }
    catch (e) {
      if (!(e instanceof CompileError)) {
        throw e
      }

      printError(sourceFilePath, e)
    }
  }
}
