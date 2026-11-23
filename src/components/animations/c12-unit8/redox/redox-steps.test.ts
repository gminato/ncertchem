import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  CUT_BOND,
  HALOFORM_METHYL,
  REDOX_BEATS,
  REDOX_FORMULA,
  REDOX_NAME,
  REDOX_SMILES,
  REDOX_STATE,
  type RedoxSmilesKey,
} from './redox-steps'

const KEYS = Object.keys(REDOX_SMILES) as RedoxSmilesKey[]

describe('carbonyl-redox Scrolly target states', () => {
  it('has the six Steps of the MDX, each with a distinct id', () => {
    expect(REDOX_BEATS).toHaveLength(6)
    expect(new Set(REDOX_BEATS).size).toBe(REDOX_BEATS.length)
    for (const beat of REDOX_BEATS) expect(REDOX_STATE[beat].length).toBeGreaterThan(0)
  })

  it.each(KEYS)('%s has the molecular formula drawn in the Scrolly', (key) => {
    expect(molecularFormula(parseSmiles(REDOX_SMILES[key]))).toBe(REDOX_FORMULA[key])
  })

  it.each(KEYS)('%s is named as the namer prints it, or has no namer name', (key) => {
    const name = REDOX_NAME[key]
    if (name === null) {
      // The namer rejects charged species; the class name is shown instead (R24).
      expect(() => iupacNameFromSmiles(REDOX_SMILES[key])).toThrow()
    } else {
      expect(iupacNameFromSmiles(REDOX_SMILES[key])).toBe(name)
    }
  })

  it('shades the reacting carbon of butanal as the carbonyl carbon (index 3)', () => {
    const g = parseSmiles(REDOX_SMILES.butanal)
    expect(g.atoms[3].element).toBe('C')
    expect(g.bonds.some((b) => (b.a === 3 && b.b === 4) || (b.a === 4 && b.b === 3))).toBe(true)
  })

  it('cuts a C–C bond beside the carbonyl carbon of pentan-3-one', () => {
    const g = parseSmiles(REDOX_SMILES.pentanone)
    const [a, b] = CUT_BOND
    expect(g.atoms[a].element).toBe('C')
    expect(g.atoms[b].element).toBe('C')
    expect(g.bonds.some((bd) => (bd.a === a && bd.b === b) || (bd.a === b && bd.b === a))).toBe(true)
  })

  it('oxidises the methyl on the carbonyl carbon of butan-2-one', () => {
    const g = parseSmiles(REDOX_SMILES.butanone)
    const [c, m] = HALOFORM_METHYL
    expect(g.atoms[m].element).toBe('C')
    expect(g.bonds.some((bd) => (bd.a === c && bd.b === m) || (bd.a === m && bd.b === c))).toBe(true)
  })
})
