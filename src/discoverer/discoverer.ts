import * as fs from 'fs'
import * as path from 'path'

export function discover(basePath: string): string[] {
  const results: string[] = []

  const entries = fs.readdirSync(basePath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name)

    if (entry.isDirectory()) {
      results.push(...discover(fullPath))
    }
    else if (entry.isFile() && path.extname(entry.name) === '.uc') {
      results.push(fullPath)
    }
  }

  return results
}
