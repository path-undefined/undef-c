import { compile } from '@/compiler/compiler'

(() => {
  const basePath = process.argv[2]

  compile(basePath)
})()
