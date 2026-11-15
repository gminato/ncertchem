/**
 * Step targets for the solubility-product Scrolly (Section 6.13). Every number is computed by the
 * solubility library from the Table 6.9 Ksp values, except the illustrative 2:3 salt in the last
 * Step, whose Ksp is named as illustrative in the text.
 */

import { tableKsp } from '@/lib/chem/precipitation'
import { ionicProduct, molarSolubility, willPrecipitate } from '@/lib/chem/solubility'
import { solubilityPair, commonIonSalts } from '@/lib/chem/precipitation'
import type { SolubilityBeakerProps } from '@/components/equilibrium/SolubilityBeaker'

/** A Ksp for a 2:3 salt that is NOT in Table 6.9, used only to show the A₂B₃ formula. */
export const ILLUSTRATIVE_A2B3_KSP = 4.0e-20

/** Concentration of the sulphate added in Step 4, mol L⁻¹. */
export const ADDED_SULPHATE = 0.01

/** Concentration of barium and sulphate in the mixture of Step 3, mol L⁻¹, each. */
export const MIXED_ION_CONC = 2.0e-4

export interface SolubilityStep {
  title: string
  /** Props for the SolubilityBeaker in this Step. */
  beaker: {
    cation: string
    anion: string
    counts: [number, number]
    qVsKsp: SolubilityBeakerProps['qVsKsp']
    solidAmount: number
  }
  /** Lines of KaTeX for the band under the beaker. */
  tex: string[]
}

/** A number in TeX: 1.05 × 10⁻⁵ becomes "1.05 \times 10^{-5}". */
export function sciTex(value: number, digits = 2): string {
  const exp = Math.floor(Math.log10(Math.abs(value)))
  let mant = Number((value / 10 ** exp).toFixed(digits))
  let e = exp
  if (Math.abs(mant) >= 10) {
    mant = Number((mant / 10).toFixed(digits))
    e += 1
  }
  return `${mant.toFixed(digits)} \\times 10^{${e}}`
}

/** The numbers the Steps use, all from the library. */
export function solubilityNumbers() {
  const kBaSO4 = tableKsp('BaSO4')!
  const kPbI2 = tableKsp('PbI2')!
  const sBaSO4 = molarSolubility(kBaSO4, 1, 1)
  const sPbI2 = molarSolubility(kPbI2, 1, 2)
  const sA2B3 = molarSolubility(ILLUSTRATIVE_A2B3_KSP, 2, 3)
  const qMixed = ionicProduct(MIXED_ION_CONC, MIXED_ION_CONC, 1, 1)
  const baso4 = commonIonSalts().find((s) => s.formula === 'BaSO4')!
  const sCommon = solubilityPair(baso4, ADDED_SULPHATE).withIon
  return {
    kBaSO4,
    kPbI2,
    sBaSO4,
    sPbI2,
    sA2B3,
    qMixed,
    qRatio: qMixed / kBaSO4,
    qVerdict: willPrecipitate(qMixed, kBaSO4),
    sCommon,
  }
}

/** The five Steps of the Scrolly: dissolving, saturation, precipitation, common ion, three salt types. */
export function solubilitySteps(): SolubilityStep[] {
  const n = solubilityNumbers()
  const ba = 'Ba²⁺'
  const so4 = 'SO₄²⁻'
  return [
    {
      title: 'Solid meets water',
      beaker: { cation: ba, anion: so4, counts: [2, 2], qVsKsp: 'below', solidAmount: 1 },
      tex: [
        '\\ce{BaSO4(s) <=> Ba^2+(aq) + SO4^2-(aq)}',
        `Q < K_{sp}\\ \\text{: more solid dissolves}`,
      ],
    },
    {
      title: 'Saturation',
      beaker: { cation: ba, anion: so4, counts: [4, 4], qVsKsp: 'equal', solidAmount: 0.5 },
      tex: [
        `K_{sp} = [\\ce{Ba^2+}][\\ce{SO4^2-}] = S^2`,
        `K_{sp} = ${sciTex(n.kBaSO4)}`,
        `S = \\sqrt{K_{sp}} = ${sciTex(n.sBaSO4)}\\ \\text{mol L}^{-1}`,
      ],
    },
    {
      title: 'Adding ions',
      beaker: { cation: ba, anion: so4, counts: [6, 6], qVsKsp: 'above', solidAmount: 0.75 },
      tex: [
        `Q_{sp} = [\\ce{Ba^2+}][\\ce{SO4^2-}] = (${sciTex(MIXED_ION_CONC, 1)})^2`,
        `Q_{sp} = ${sciTex(n.qMixed)} = ${Math.round(n.qRatio)}\\,K_{sp}`,
        `\\text{the excess salt precipitates}`,
      ],
    },
    {
      title: 'Common ion',
      beaker: { cation: ba, anion: so4, counts: [1, 4], qVsKsp: 'equal', solidAmount: 0.9 },
      tex: [
        `[\\ce{SO4^2-}] = 0.010\\ \\text{M, from Na}_2\\text{SO}_4`,
        `S = ${sciTex(n.sCommon)}\\ \\text{mol L}^{-1}`,
        `\\text{far below } ${sciTex(n.sBaSO4)}`,
      ],
    },
    {
      title: 'Three salt types',
      beaker: { cation: 'Pb²⁺', anion: 'I⁻', counts: [1, 2], qVsKsp: 'equal', solidAmount: 0.5 },
      tex: [
        `\\text{AB: } S = \\sqrt{K_{sp}}`,
        `\\text{AB}_2: S = \\left(\\tfrac{K_{sp}}{4}\\right)^{1/3} = ${sciTex(n.sPbI2)}`,
        `\\text{A}_2\\text{B}_3: S = \\left(\\tfrac{K_{sp}}{108}\\right)^{1/5} = ${sciTex(n.sA2B3)}`,
      ],
    },
  ]
}
