/**
 * Electrochemical cell model for the Standard Electrode Potential Explorer simulation.
 *
 * Implements cathode/anode classification, cell EMF calculation, balanced overall reactions,
 * oxidant/reductant identification, and IUPAC cell notation based on NCERT Table 7.1.
 */

import { lookupPotential, cellEmf } from '@/lib/chem/electrode-potentials'
import type { RedoxCouple } from '@/components/redox/PotentialLadder'

export interface CoupleDef {
  id: string
  name: string
  coupleStr: string
  e0: number
  electrons: number
  metalName: string
  ionName: string
  solutionLabel: string
  oxSpecies: string
  redSpecies: string
  halfReductionStr: string
  halfOxidationStr: string
  colorToken: string
  solutionToken: string
}

export const EXPLORER_COUPLES: readonly CoupleDef[] = [
  {
    id: 'f2',
    name: 'Fluorine (F₂ / F⁻)',
    coupleStr: 'F2/F-',
    e0: lookupPotential('F2/F-'),
    electrons: 2,
    metalName: 'Pt(s), F₂(g)',
    ionName: 'F⁻',
    solutionLabel: '1 M NaF',
    oxSpecies: 'F₂(g)',
    redSpecies: 'F⁻(aq)',
    halfReductionStr: 'F₂(g) + 2e⁻ → 2F⁻(aq)',
    halfOxidationStr: '2F⁻(aq) → F₂(g) + 2e⁻',
    colorToken: 'var(--fg-muted)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'cl2',
    name: 'Chlorine (Cl₂ / Cl⁻)',
    coupleStr: 'Cl2/Cl-',
    e0: lookupPotential('Cl2/Cl-'),
    electrons: 2,
    metalName: 'Pt(s), Cl₂(g)',
    ionName: 'Cl⁻',
    solutionLabel: '1 M NaCl',
    oxSpecies: 'Cl₂(g)',
    redSpecies: 'Cl⁻(aq)',
    halfReductionStr: 'Cl₂(g) + 2e⁻ → 2Cl⁻(aq)',
    halfOxidationStr: '2Cl⁻(aq) → Cl₂(g) + 2e⁻',
    colorToken: 'var(--fg-muted)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'ag',
    name: 'Silver (Ag⁺ / Ag)',
    coupleStr: 'Ag+/Ag',
    e0: lookupPotential('Ag+/Ag'),
    electrons: 1,
    metalName: 'Ag(s)',
    ionName: 'Ag⁺',
    solutionLabel: '1 M AgNO₃',
    oxSpecies: 'Ag⁺(aq)',
    redSpecies: 'Ag(s)',
    halfReductionStr: 'Ag⁺(aq) + e⁻ → Ag(s)',
    halfOxidationStr: 'Ag(s) → Ag⁺(aq) + e⁻',
    colorToken: 'var(--metal-ag)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'cu',
    name: 'Copper (Cu²⁺ / Cu)',
    coupleStr: 'Cu2+/Cu',
    e0: lookupPotential('Cu2+/Cu'),
    electrons: 2,
    metalName: 'Cu(s)',
    ionName: 'Cu²⁺',
    solutionLabel: '1 M CuSO₄',
    oxSpecies: 'Cu²⁺(aq)',
    redSpecies: 'Cu(s)',
    halfReductionStr: 'Cu²⁺(aq) + 2e⁻ → Cu(s)',
    halfOxidationStr: 'Cu(s) → Cu²⁺(aq) + 2e⁻',
    colorToken: 'var(--metal-cu)',
    solutionToken: 'var(--sol-cu)',
  },
  {
    id: 'she',
    name: 'Hydrogen SHE (2H⁺ / H₂)',
    coupleStr: '2H+/H2',
    e0: lookupPotential('2H+/H2'),
    electrons: 2,
    metalName: 'Pt(s), H₂(g)',
    ionName: 'H⁺',
    solutionLabel: '1 M HCl',
    oxSpecies: '2H⁺(aq)',
    redSpecies: 'H₂(g)',
    halfReductionStr: '2H⁺(aq) + 2e⁻ → H₂(g)',
    halfOxidationStr: 'H₂(g) → 2H⁺(aq) + 2e⁻',
    colorToken: 'var(--fg-muted)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'pb',
    name: 'Lead (Pb²⁺ / Pb)',
    coupleStr: 'Pb2+/Pb',
    e0: lookupPotential('Pb2+/Pb'),
    electrons: 2,
    metalName: 'Pb(s)',
    ionName: 'Pb²⁺',
    solutionLabel: '1 M Pb(NO₃)₂',
    oxSpecies: 'Pb²⁺(aq)',
    redSpecies: 'Pb(s)',
    halfReductionStr: 'Pb²⁺(aq) + 2e⁻ → Pb(s)',
    halfOxidationStr: 'Pb(s) → Pb²⁺(aq) + 2e⁻',
    colorToken: 'var(--metal-zn)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'sn',
    name: 'Tin (Sn²⁺ / Sn)',
    coupleStr: 'Sn2+/Sn',
    e0: lookupPotential('Sn2+/Sn'),
    electrons: 2,
    metalName: 'Sn(s)',
    ionName: 'Sn²⁺',
    solutionLabel: '1 M SnCl₂',
    oxSpecies: 'Sn²⁺(aq)',
    redSpecies: 'Sn(s)',
    halfReductionStr: 'Sn²⁺(aq) + 2e⁻ → Sn(s)',
    halfOxidationStr: 'Sn(s) → Sn²⁺(aq) + 2e⁻',
    colorToken: 'var(--metal-zn)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'ni',
    name: 'Nickel (Ni²⁺ / Ni)',
    coupleStr: 'Ni2+/Ni',
    e0: lookupPotential('Ni2+/Ni'),
    electrons: 2,
    metalName: 'Ni(s)',
    ionName: 'Ni²⁺',
    solutionLabel: '1 M NiSO₄',
    oxSpecies: 'Ni²⁺(aq)',
    redSpecies: 'Ni(s)',
    halfReductionStr: 'Ni²⁺(aq) + 2e⁻ → Ni(s)',
    halfOxidationStr: 'Ni(s) → Ni²⁺(aq) + 2e⁻',
    colorToken: 'var(--metal-zn)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'fe',
    name: 'Iron (Fe²⁺ / Fe)',
    coupleStr: 'Fe2+/Fe',
    e0: lookupPotential('Fe2+/Fe'),
    electrons: 2,
    metalName: 'Fe(s)',
    ionName: 'Fe²⁺',
    solutionLabel: '1 M FeSO₄',
    oxSpecies: 'Fe²⁺(aq)',
    redSpecies: 'Fe(s)',
    halfReductionStr: 'Fe²⁺(aq) + 2e⁻ → Fe(s)',
    halfOxidationStr: 'Fe(s) → Fe²⁺(aq) + 2e⁻',
    colorToken: 'var(--metal-zn)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'cr',
    name: 'Chromium (Cr³⁺ / Cr)',
    coupleStr: 'Cr3+/Cr',
    e0: lookupPotential('Cr3+/Cr'),
    electrons: 3,
    metalName: 'Cr(s)',
    ionName: 'Cr³⁺',
    solutionLabel: '1 M CrCl₃',
    oxSpecies: 'Cr³⁺(aq)',
    redSpecies: 'Cr(s)',
    halfReductionStr: 'Cr³⁺(aq) + 3e⁻ → Cr(s)',
    halfOxidationStr: 'Cr(s) → Cr³⁺(aq) + 3e⁻',
    colorToken: 'var(--metal-zn)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'zn',
    name: 'Zinc (Zn²⁺ / Zn)',
    coupleStr: 'Zn2+/Zn',
    e0: lookupPotential('Zn2+/Zn'),
    electrons: 2,
    metalName: 'Zn(s)',
    ionName: 'Zn²⁺',
    solutionLabel: '1 M ZnSO₄',
    oxSpecies: 'Zn²⁺(aq)',
    redSpecies: 'Zn(s)',
    halfReductionStr: 'Zn²⁺(aq) + 2e⁻ → Zn(s)',
    halfOxidationStr: 'Zn(s) → Zn²⁺(aq) + 2e⁻',
    colorToken: 'var(--metal-zn)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'al',
    name: 'Aluminium (Al³⁺ / Al)',
    coupleStr: 'Al3+/Al',
    e0: lookupPotential('Al3+/Al'),
    electrons: 3,
    metalName: 'Al(s)',
    ionName: 'Al³⁺',
    solutionLabel: '1 M AlCl₃',
    oxSpecies: 'Al³⁺(aq)',
    redSpecies: 'Al(s)',
    halfReductionStr: 'Al³⁺(aq) + 3e⁻ → Al(s)',
    halfOxidationStr: 'Al(s) → Al³⁺(aq) + 3e⁻',
    colorToken: 'var(--metal-ag)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'mg',
    name: 'Magnesium (Mg²⁺ / Mg)',
    coupleStr: 'Mg2+/Mg',
    e0: lookupPotential('Mg2+/Mg'),
    electrons: 2,
    metalName: 'Mg(s)',
    ionName: 'Mg²⁺',
    solutionLabel: '1 M MgSO₄',
    oxSpecies: 'Mg²⁺(aq)',
    redSpecies: 'Mg(s)',
    halfReductionStr: 'Mg²⁺(aq) + 2e⁻ → Mg(s)',
    halfOxidationStr: 'Mg(s) → Mg²⁺(aq) + 2e⁻',
    colorToken: 'var(--metal-ag)',
    solutionToken: 'var(--fg-subtle)',
  },
  {
    id: 'li',
    name: 'Lithium (Li⁺ / Li)',
    coupleStr: 'Li+/Li',
    e0: lookupPotential('Li+/Li'),
    electrons: 1,
    metalName: 'Li(s)',
    ionName: 'Li⁺',
    solutionLabel: '1 M LiCl',
    oxSpecies: 'Li⁺(aq)',
    redSpecies: 'Li(s)',
    halfReductionStr: 'Li⁺(aq) + e⁻ → Li(s)',
    halfOxidationStr: 'Li(s) → Li⁺(aq) + e⁻',
    colorToken: 'var(--metal-ag)',
    solutionToken: 'var(--fg-subtle)',
  },
]

export const LADDER_COUPLES: readonly RedoxCouple[] = EXPLORER_COUPLES.map((c) => ({
  id: c.id,
  label: `${c.coupleStr} (${c.e0 >= 0 ? '+' : ''}${c.e0.toFixed(2)} V)`,
  e0: c.e0,
}))

/**
 * Returns a well-spaced subset of Table 7.1 redox couples (6–8 rungs)
 * that always includes the active cathode and anode, preventing label collisions
 * on the PotentialLadder while anchoring the scale at top (F₂) and bottom (Li⁺).
 */
export function getLadderCouples(cathodeId: string, anodeId: string): RedoxCouple[] {
  const activeIds = new Set([cathodeId, anodeId])
  const baseIds = ['f2', 'ag', 'cu', 'she', 'zn', 'al', 'li']

  const combined = new Set<string>()
  for (const id of baseIds) combined.add(id)
  combined.add(cathodeId)
  combined.add(anodeId)

  return Array.from(combined)
    .map((id) => EXPLORER_COUPLES.find((c) => c.id === id))
    .filter((c): c is CoupleDef => c !== undefined)
    .sort((a, b) => b.e0 - a.e0)
    .map((c) => ({
      id: c.id,
      label: `${c.coupleStr} (${c.e0 >= 0 ? '+' : ''}${c.e0.toFixed(2)} V)`,
      e0: c.e0,
    }))
}

export interface CellAnalysis {
  cathode: CoupleDef
  anode: CoupleDef
  e0Cathode: number
  e0Anode: number
  e0Cell: number
  isIdentical: boolean
  electronsTransferred: number
  overallReaction: string
  oxidant: string
  reductant: string
  cellNotation: string
  summaryText: string
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

/**
 * Analyses a galvanic cell formed by pairing two redox couples.
 */
export function analyseGalvanicCell(coupleId1: string, coupleId2: string): CellAnalysis {
  const c1 = EXPLORER_COUPLES.find((c) => c.id === coupleId1) ?? EXPLORER_COUPLES[10] // default zn
  const c2 = EXPLORER_COUPLES.find((c) => c.id === coupleId2) ?? EXPLORER_COUPLES[3]  // default cu

  const isIdentical = c1.id === c2.id

  // Higher E° is cathode (reduction), lower E° is anode (oxidation)
  const [cathode, anode] = c1.e0 >= c2.e0 ? [c1, c2] : [c2, c1]

  const e0Cathode = cathode.e0
  const e0Anode = anode.e0
  const e0Cell = isIdentical ? 0 : cellEmf(cathode.coupleStr, anode.coupleStr)

  // Balance electrons between reduction (cathode) and oxidation (anode)
  const n = lcm(cathode.electrons, anode.electrons)
  const multCathode = n / cathode.electrons
  const multAnode = n / anode.electrons

  // Format coefficients helper
  const coeff = (m: number, base: string) => {
    if (m === 1) return base
    // If base already starts with a number (like '2F-'), multiply
    const match = base.match(/^(\d+)(.*)/)
    if (match) {
      const num = parseInt(match[1], 10) * m
      return `${num}${match[2]}`
    }
    return `${m}${base}`
  }

  const oxAnode = coeff(multAnode, anode.oxSpecies)
  const redAnode = coeff(multAnode, anode.redSpecies)
  const oxCathode = coeff(multCathode, cathode.oxSpecies)
  const redCathode = coeff(multCathode, cathode.redSpecies)

  const overallReaction = isIdentical
    ? 'Identical half-cells: no spontaneous reaction (E°cell = 0.00 V)'
    : `${redAnode} + ${oxCathode} → ${oxAnode} + ${redCathode}`

  const oxidant = cathode.oxSpecies
  const reductant = anode.redSpecies
  const cellNotation = `${anode.metalName} | ${anode.ionName} || ${cathode.ionName} | ${cathode.metalName}`

  const signAnode = e0Anode >= 0 ? `+${e0Anode.toFixed(2)}` : `−${Math.abs(e0Anode).toFixed(2)}`
  const signCathode = e0Cathode >= 0 ? `+${e0Cathode.toFixed(2)}` : `−${Math.abs(e0Cathode).toFixed(2)}`

  const summaryText = isIdentical
    ? `Identical couples selected: both electrodes have E° = ${signCathode} V. Cell potential is 0.00 V.`
    : `Cathode is ${cathode.name} (E° = ${signCathode} V), Anode is ${anode.name} (E° = ${signAnode} V). Standard cell EMF is E°cell = +${e0Cell.toFixed(2)} V. Electrons flow through the wire from ${anode.metalName} to ${cathode.metalName}. Oxidant is ${oxidant}; reductant is ${reductant}.`

  return {
    cathode,
    anode,
    e0Cathode,
    e0Anode,
    e0Cell,
    isIdentical,
    electronsTransferred: n,
    overallReaction,
    oxidant,
    reductant,
    cellNotation,
    summaryText,
  }
}
