import { parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_7_6_1_ETHER_PREP } from '@/lib/chem/ncert-c12-unit7-data'

export interface DehydrationStepMeta {
  id: string
  title: string
  subtitle: string
}

export const DEHYDRATION_STEPS: readonly DehydrationStepMeta[] = [
  {
    id: 'protonation',
    title: 'Step 1: Protonation of ethanol',
    subtitle: 'H₂SO₄ converts poor –OH into good –OH₂⁺ leaving group',
  },
  {
    id: 'sn2-ether',
    title: '413 K: SN2 attack gives ethoxyethane',
    subtitle: 'A second ethanol attacks the α-carbon, displacing H₂O',
  },
  {
    id: 'elimination-alkene',
    title: '443 K: Elimination yields ethene',
    subtitle: 'Higher temperature removes β-H and H₂O to form a C=C bond',
  },
  {
    id: 'scope-limits',
    title: 'Why 2°/3° alcohols and mixtures fail',
    subtitle: 'Acid dehydration works cleanly only for symmetrical 1° ethers',
  },
] as const

export const DEHYDRATION_TEMPS_DATA = NCERT_7_6_1_ETHER_PREP.ethanolDehydrationBranching

export const DEHYDRATION_GRAPHS = {
  ethene: parseSmiles('C=C'),
  tertButanol: parseSmiles('CC(C)(C)O'),
  isobutene: parseSmiles('CC(=C)C'),
} as const
