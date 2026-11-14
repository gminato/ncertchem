import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { seriesFirstLines } from './line-spectra-steps'

/**
 * The series table in the 2.3 Section is written by hand in MDX, because the
 * site's Markdown has no table support. This test keeps its numbers equal to the
 * values that the Rydberg formula in bohr.ts gives.
 */
describe('series table in the 2.3 Section', () => {
  const mdx = fs.readFileSync(
    path.join(process.cwd(), 'content/class-11/unit-2/2-3-developments-leading-to-bohr-model.mdx'),
    'utf8'
  )

  it('lists the first line of each series with the value from the Rydberg formula', () => {
    for (const line of seriesFirstLines()) {
      const value = line.nm.toFixed(1).replace('.', '\\.')
      const row = new RegExp(`<tr>(?:(?!</tr>)[\\s\\S])*<td[^>]*>${line.series}</td>(?:(?!</tr>)[\\s\\S])*<td[^>]*>${value}</td>`)
      expect(mdx, `${line.series} first line ${line.nm.toFixed(1)} nm`).toMatch(row)
    }
  })
})
