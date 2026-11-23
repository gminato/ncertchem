import {
  getEtherPairNomenclature,
  getSpecialEtherNomenclature,
  type NomenclatureEntry,
} from '@/lib/chem/c12-u7-s2-nomenclature'

export const ETHER_STEP_COUNT = 5

export interface EtherStepSpec {
  index: number
  title: string
  ariaLabel: string
  footer: string
  entries: NomenclatureEntry[]
}

export function getEtherSteps(): EtherStepSpec[] {
  return [
    {
      index: 0,
      title: 'Common ether names: alphabetical + di-',
      ariaLabel: 'Step 1: Common names dimethyl, diethyl, methyl n-propyl, and methyl isopropyl ether',
      footer: 'Use di- for identical groups; alphabetical order for mixed.',
      entries: [
        getEtherPairNomenclature('methyl', 'methyl'),
        getEtherPairNomenclature('ethyl', 'ethyl'),
        getEtherPairNomenclature('methyl', 'propyl'),
        getEtherPairNomenclature('isopropyl', 'methyl'),
      ],
    },
    {
      index: 1,
      title: 'IUPAC alkoxyalkane: larger skeleton wins',
      ariaLabel: 'Step 2: 1-methoxypropane and 2-methoxypropane',
      footer: 'Smaller R + O becomes alkoxy; larger chain is the parent.',
      entries: [
        getEtherPairNomenclature('methyl', 'propyl'),
        getEtherPairNomenclature('isopropyl', 'methyl'),
      ],
    },
    {
      index: 2,
      title: 'Alkyl aryl ethers: benzene as parent',
      ariaLabel: 'Step 3: Methoxybenzene (anisole) and ethoxybenzene (phenetole)',
      footer: 'Benzene (6 C) beats methyl (1 C) or ethyl (2 C) as parent.',
      entries: [
        getEtherPairNomenclature('phenyl', 'methyl'),
        getEtherPairNomenclature('phenyl', 'ethyl'),
      ],
    },
    {
      index: 3,
      title: 'Watch the parent flip as the chain grows',
      ariaLabel: 'Step 4: 3-methylbutoxybenzene vs 1-phenoxyheptane parent flip',
      footer: 'Compare carbons across O: the larger group sets the parent.',
      entries: [
        getEtherPairNomenclature('phenyl', 'isopentyl'),
        getEtherPairNomenclature('phenyl', 'heptyl'),
      ],
    },
    {
      index: 4,
      title: 'Diethers and substituted cycloalkane ethers',
      ariaLabel: 'Step 5: 1,2-dimethoxyethane and 2-ethoxy-1,1-dimethylcyclohexane',
      footer: 'Use di- for two alkoxy groups and lowest locants on rings.',
      entries: [
        getSpecialEtherNomenclature('1,2-dimethoxyethane'),
        getSpecialEtherNomenclature('2-ethoxy-1,1-dimethylcyclohexane'),
      ],
    },
  ]
}
