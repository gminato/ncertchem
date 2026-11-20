import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkNumbers, checkProblems, countBlocks } from '../section-blocks'

/**
 * Progress is recorded against Check numbers, and a Complete Section is one whose every Check is
 * answered. Both rest on what the Section files hold, so these tests read the files themselves.
 */

const CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../content')

function sectionFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sectionFiles(full)
    return entry.name.endsWith('.mdx') ? [full] : []
  })
}

/** The MDX body of a Section file, without its frontmatter. */
function body(file: string): string {
  return fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '')
}

const files = sectionFiles(CONTENT_DIR)
const name = (file: string) => path.relative(CONTENT_DIR, file)

describe('the Checks in the Section files', () => {
  it('finds the Section files', () => {
    expect(files.length).toBeGreaterThan(80)
  })

  it('gives every Check its own explicit number', () => {
    const problems = files.flatMap((file) => checkProblems(body(file)).map((p) => `${name(file)}: ${p}`))
    expect(problems, problems.join('\n')).toEqual([])
  })

  it('reads a number for every Check that the counter finds', () => {
    const mismatched = files
      .filter((file) => checkNumbers(body(file)).length !== countBlocks(body(file)).checks)
      .map(name)
    expect(mismatched, mismatched.join('\n')).toEqual([])
  })

  it('has at least one Check in every Section, so every Section can become a Complete Section', () => {
    const without = files.filter((file) => checkNumbers(body(file)).length === 0).map(name)
    expect(without, without.join('\n')).toEqual([])
  })
})
