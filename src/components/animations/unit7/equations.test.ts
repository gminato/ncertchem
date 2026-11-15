import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isBalanced } from '@/lib/chem/redox-balance'
import { CLASSICAL_STEPS, equationMhchem } from './classical/classical-steps'
import { TRANSFER_STEPS } from './transfer/transfer-steps'

const SECTION_FILES = [
  '7-1-classical-idea-of-redox-reactions.mdx',
  '7-2-redox-reactions-in-terms-of-electron-transfer.mdx',
]

/** Pulls the body of every \ce{...} in a string, matching nested braces such as Cu^{2+}. */
function extractCe(text: string): string[] {
  const out: string[] = []
  let idx = text.indexOf('\\ce{')
  while (idx !== -1) {
    let depth = 0
    let start = idx + 3
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++
      if (text[i] === '}') {
        depth--
        if (depth === 0) {
          out.push(text.slice(start + 1, i))
          idx = text.indexOf('\\ce{', i)
          break
        }
      }
      if (i === text.length - 1) idx = -1
    }
    if (depth !== 0) break
  }
  return out
}

/** Reads a mhchem reaction as the lib does: charges written ^{2+} become ^2+, equilibria become ->. */
function toCheckable(ce: string): string | null {
  if (!/->|<=>|⇌/.test(ce)) return null
  return ce
    .replace(/\^\{([^}]*)\}/g, '^$1')
    .replace(/<=>|⇌/g, '->')
    // The lib parses molecular formulas. Structural formulas of ethene and ethane have the same atoms.
    .replace(/CH2=CH2\(g\)/g, 'C2H4(g)')
    .replace(/CH3-CH3\(g\)/g, 'C2H6(g)')
}

function checkEquation(source: string, ce: string) {
  const checkable = toCheckable(ce)
  if (checkable === null) return
  let result
  try {
    result = isBalanced(checkable)
  } catch (err) {
    throw new Error(`${source}: \\ce{${ce}} could not be parsed: ${(err as Error).message}`)
  }
  expect(result.balanced, `${source}: \\ce{${ce}} is not balanced: ${JSON.stringify(result.atomBalance)} charge ${JSON.stringify(result.chargeBalance)}`).toBe(true)
}

describe('Unit 7 Sections 7.1–7.2 equations balance', () => {
  for (const file of SECTION_FILES) {
    it(`every \\ce{} reaction in ${file} balances in atoms and charge`, () => {
      const text = fs.readFileSync(path.join(process.cwd(), 'content/class-11/unit-7', file), 'utf8')
      const equations = extractCe(text)
      expect(equations.length).toBeGreaterThan(10)
      for (const ce of equations) checkEquation(file, ce)
    })
  }

  it('every equation in the classical Scrolly data balances', () => {
    for (const step of CLASSICAL_STEPS) {
      if (step.equation.length === 0) continue // the summary is a ledger, not a reaction
      checkEquation(`classical step ${step.index}`, equationMhchem(step.equation))
    }
  })

  it('every equation in the electron-transfer Scrolly data balances', () => {
    for (const step of TRANSFER_STEPS) {
      for (const raw of [step.oxHalfMhchem, step.redHalfMhchem, step.overallMhchem]) {
        if (!raw) continue
        checkEquation(`transfer step ${step.index}`, raw)
      }
    }
  })
})
