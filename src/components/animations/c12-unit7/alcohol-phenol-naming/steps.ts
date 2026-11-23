import {
  getAlcoholNomenclature,
  getPhenolNomenclature,
  type NomenclatureEntry,
} from '@/lib/chem/c12-u7-s2-nomenclature'

export const ALCOHOL_PHENOL_STEP_COUNT = 6

export interface AlcoholPhenolStepSpec {
  index: number
  title: string
  ariaLabel: string
  footer: string
  entries: NomenclatureEntry[]
}

export function getAlcoholPhenolSteps(): AlcoholPhenolStepSpec[] {
  return [
    {
      index: 0,
      title: 'Simple alkyl alcohols: common vs IUPAC',
      ariaLabel: 'Step 1: Simple alkyl alcohols methanol and propan-2-ol',
      footer: 'Drop trailing -e of alkane and add -ol with lowest locant.',
      entries: [getAlcoholNomenclature('methanol'), getAlcoholNomenclature('propan-2-ol')],
    },
    {
      index: 1,
      title: 'Branched chains: longest -OH chain wins',
      ariaLabel: 'Step 2: Isobutyl alcohol named 2-methylpropan-1-ol',
      footer: 'Longest -OH chain is 3 C (propane); number from -OH end.',
      entries: [getAlcoholNomenclature('2-methylpropan-1-ol')],
    },
    {
      index: 2,
      title: 'Polyhydric alcohols keep final -e',
      ariaLabel: 'Step 3: Ethane-1,2-diol and propane-1,2,3-triol keep the trailing e',
      footer: 'Keep parent alkane -e before suffixes starting with d or t.',
      entries: [getAlcoholNomenclature('ethane-1,2-diol'), getAlcoholNomenclature('propane-1,2,3-triol')],
    },
    {
      index: 3,
      title: 'Cyclic alcohols fix -OH at C-1',
      ariaLabel: 'Step 4: Cyclohexanol and 2-methylcyclopentanol',
      footer: 'Use prefix cyclo- and give substituents the lowest locants.',
      entries: [getAlcoholNomenclature('cyclohexanol'), getAlcoholNomenclature('2-methylcyclopentanol')],
    },
    {
      index: 4,
      title: 'Phenol and cresols (o, m, p to 2, 3, 4)',
      ariaLabel: 'Step 5: Phenol and ortho, meta, para cresols as 2, 3, 4-methylphenol',
      footer: 'C-1 at -OH converts o-, m-, p-cresol to 2-, 3-, 4-methylphenol.',
      entries: [
        getPhenolNomenclature('none', 'ortho'),
        getPhenolNomenclature('methyl', 'ortho'),
        getPhenolNomenclature('methyl', 'meta'),
        getPhenolNomenclature('methyl', 'para'),
      ],
    },
    {
      index: 5,
      title: 'Benzenediols keep -e of benzene',
      ariaLabel: 'Step 6: Catechol, resorcinol, and hydroquinone as benzenediols',
      footer: 'Retain -e of benzene before -diol: 1,2-, 1,3-, and 1,4-diol.',
      entries: [
        getPhenolNomenclature('hydroxyl', 'ortho'),
        getPhenolNomenclature('hydroxyl', 'meta'),
        getPhenolNomenclature('hydroxyl', 'para'),
      ],
    },
  ]
}
