import * as fs from 'node:fs'
import { tokenize } from '@/tokenizer/tokenizer'
import { parse } from '@/parser/parser'
import { AstNode } from './types/ast-node.js'

const path = process.argv[2]
const content = fs.readFileSync(path, 'utf8')

const tokens = tokenize(content)
const ast = parse(tokens)

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

printAst(ast, 0)
