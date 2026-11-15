/**
 * Step targets for the Section 8.1 Scrolly: the vital-force idea and how it fell, told with four
 * molecules. Each molecule's formula, IUPAC name and carbon chain are computed by the Unit 8
 * libraries; only the inorganic reactant name (ammonium cyanate, as NCERT gives it) is typed in.
 */

import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { iupacName } from '@/lib/chem/iupac-organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { NCERT_TABLE_8_1_COMMON_NAMES } from '@/lib/chem/ncert-unit8-tables'

export const INTRO_STEP_COUNT = 4

export interface IntroMolecule {
  /** The graph drawn in the Step. */
  graph: MolGraph
  /** Molecular formula from the library, e.g. C₂H₄O₂ as CH₃COOH is written in Table 8.1. */
  formula: string
  /** Name from iupacName. */
  iupac: string
  /** Common name from NCERT Table 8.1 when the table lists the compound, otherwise null. */
  common: string | null
}

/** A molecule's data, from its SMILES string. Names come only from the library. */
export function introMolecule(smiles: string, tableKey?: string): IntroMolecule {
  const graph = parseSmiles(smiles)
  const row = tableKey ? NCERT_TABLE_8_1_COMMON_NAMES.rows.find((r) => r.compound === tableKey) : undefined
  return {
    graph,
    formula: molecularFormula(graph),
    iupac: iupacName(graph),
    common: row ? row.commonName : null,
  }
}

export interface IntroStep {
  year: string
  title: string
  caption: string
  /** The molecules drawn in this Step, in order. */
  molecules: IntroMolecule[]
}

/** The four Steps: urea (1828), acetic acid (1845), methane (1856) and the carbon chains of Section 8.1. */
export function introStep(index: number): IntroStep {
  const clamped = Math.min(INTRO_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  const steps: IntroStep[] = [
    {
      year: '1828',
      title: 'Urea from a salt',
      caption: 'Heating ammonium cyanate, a salt with no life in it, gives urea. The product is an organic compound made from an inorganic one.',
      molecules: [introMolecule('NC(=O)N')],
    },
    {
      year: '1845',
      title: 'Acetic acid, made in a laboratory',
      caption: 'Kolbe made acetic acid from inorganic starting materials. Acetic acid is the vinegar acid, and it no longer needs a living source.',
      molecules: [introMolecule('CC(=O)O', 'CH3COOH')],
    },
    {
      year: '1856',
      title: 'Methane in a laboratory',
      caption: 'Berthelot made methane. The simplest organic molecule has one carbon bonded to four hydrogens.',
      molecules: [introMolecule('C', 'CH4')],
    },
    {
      year: 'Catenation',
      title: 'Carbon builds its own skeletons',
      caption: 'Carbon atoms bond to each other, so they form straight chains, branched chains and rings from the same element.',
      molecules: [introMolecule('CCCCCC'), introMolecule('CC(C)CCC'), introMolecule('C1CCCCC1')],
    },
  ]
  return steps[clamped]
}
