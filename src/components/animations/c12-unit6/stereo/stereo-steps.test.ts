import { describe, expect, it } from 'vitest'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { stereocentres, substitute } from '@/lib/chem/haloalkanes'
import {
  BROMOOCTANE,
  CHLOROPENTANE,
  METHYLBUTANOL,
  METHYLBUTYL_CHLORIDE,
  OCTANOL,
  PHENYLETHANOL,
  PHENYLETHYL_BROMIDE,
  STEP_COUNT,
  clampStep,
  stereoFormula,
  stereoName,
} from './stereo-steps'

describe('stereo Scrolly molecules', () => {
  it('has the formulas the Prose and Checks use', () => {
    expect(stereoFormula(CHLOROPENTANE)).toBe('C5H11Cl')
    expect(stereoFormula(METHYLBUTANOL)).toBe('C5H12O')
    expect(stereoFormula(METHYLBUTYL_CHLORIDE)).toBe('C5H11Cl')
    expect(stereoFormula(BROMOOCTANE)).toBe('C8H17Br')
    expect(stereoFormula(OCTANOL)).toBe('C8H18O')
    expect(stereoFormula(PHENYLETHYL_BROMIDE)).toBe('C8H9Br')
    expect(stereoFormula(PHENYLETHANOL)).toBe('C8H10O')
  })

  it('names each molecule with the namer', () => {
    expect(stereoName(CHLOROPENTANE)).toBe('2-chloropentane')
    expect(stereoName(METHYLBUTANOL)).toBe('2-methylbutan-1-ol')
    expect(stereoName(METHYLBUTYL_CHLORIDE)).toBe('1-chloro-2-methylbutane')
    expect(stereoName(BROMOOCTANE)).toBe('2-bromooctane')
    expect(stereoName(OCTANOL)).toBe('octan-2-ol')
    expect(stereoName(PHENYLETHYL_BROMIDE)).toBe('1-bromo-1-phenylethane')
    expect(stereoName(PHENYLETHANOL)).toBe('1-phenylethanol')
  })

  it('finds the stereocentre of each chiral halide', () => {
    expect(stereocentres(parseSmiles(CHLOROPENTANE))).toEqual([3])
    expect(stereocentres(parseSmiles(METHYLBUTANOL))).toEqual([2])
    expect(stereocentres(parseSmiles(BROMOOCTANE))).toEqual([6])
    expect(stereocentres(parseSmiles(PHENYLETHYL_BROMIDE))).toEqual([1])
  })

  it('gives the SN2 and SN1 products of each reactant', () => {
    expect(substitute(BROMOOCTANE, 'first', 'O').smiles).toBe(OCTANOL)
    expect(stereoName(substitute(PHENYLETHYL_BROMIDE, 'first', 'O').smiles)).toBe(stereoName(PHENYLETHANOL))
    expect(substitute(CHLOROPENTANE, 'first', 'O').formula).toBe('C5H12O')
  })
})

describe('clampStep', () => {
  it('keeps the index inside the Steps', () => {
    expect(clampStep(-3)).toBe(0)
    expect(clampStep(2.7)).toBe(2)
    expect(clampStep(STEP_COUNT + 4)).toBe(STEP_COUNT - 1)
    expect(clampStep(Number.NaN)).toBe(0)
  })
})
