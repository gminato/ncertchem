import { parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_7_6_1_ETHER_PREP } from '@/lib/chem/ncert-c12-unit7-data'

export interface WilliamsonStepMeta {
  id: string
  title: string
  subtitle: string
}

export const WILLIAMSON_STEPS: readonly WilliamsonStepMeta[] = [
  {
    id: 'general-sn2',
    title: 'Williamson synthesis: General SN2 route',
    subtitle: 'Alkoxide oxygen attacks primary alkyl halide from the back',
  },
  {
    id: 'bulky-alkoxide-1-halide',
    title: 'Bulky alkoxide + 1° halide → Clean ether',
    subtitle: 'CH₃–Br is unhindered and has no β-hydrogens',
  },
  {
    id: 'tertiary-halide-elimination',
    title: 'Reversed partners: 3° halide → Elimination',
    subtitle: 'Strong base CH₃O⁻ abstracts β-H instead of backside attack',
  },
  {
    id: 'phenol-aryl-ether',
    title: 'Phenols form alkyl aryl ethers',
    subtitle: 'NaOH converts phenol into phenoxide for SN2 attack on R–X',
  },
] as const

export const WILLIAMSON_DATA = NCERT_7_6_1_ETHER_PREP.williamsonSynthesis

export const WILLIAMSON_GRAPHS = {
  tertButylMethylEther: parseSmiles('CC(C)(C)OC'),
  isobutene: parseSmiles('CC(=C)C'),
} as const
