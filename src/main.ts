import * as fs from 'node:fs'
import { tokenize } from '@/tokenizer/tokenizer'
import { parse } from '@/parser/parser'
import { AstNode } from './types/ast-node.js'
import { CompileError } from './error/compile-error.js'

const path = process.argv[2]
const content = fs.readFileSync(path, 'utf8')

const tokens = tokenize(content)

try {
  const ast = parse(tokens)
  printAst(ast, 0)
}
catch (e) {
  if (e instanceof CompileError) {
    console.error(e.message, e.codePosition ? `${e.codePosition.line}:${e.codePosition.char}` : undefined)
    console.error(e.stack)
  }
  else {
    throw e
  }
}

function printAst(ast: AstNode, indent: number) {
  console.log(''.padStart(indent, ' ') + `${ast.name}:`)

  for (const child of ast.children) {
    if (child.type === 'token') {
      console.log(''.padStart(indent + 2, ' ') + `${child.name} ${child.raw}`)
    }
    else {
      printAst(child, indent + 2)
    }
  }
}
