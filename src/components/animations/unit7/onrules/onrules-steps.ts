import {
  explainOxidationNumber,
  rationalToString,
  type Rational,
} from '@/lib/chem/oxidation-number'
import type { TagSpec } from '@/components/redox/OxidationTag'

/** Step representation for the redox-on-rules Scrolly animation. */
export interface OnRuleStepState {
  index: number
  formula: string
  name: string
  charge: number
  targetElement: string
  stepTitle: string
  ruleCitation: string
  explanation: string
  equation?: string
  activeElement?: string
  tags: TagSpec[]
  isSolved: boolean
  isTrap?: boolean
  trapWarning?: string
  sumCheckString: string
  stepCaption: string
}

/** Format rational with true minus sign U+2212 */
export function formatSignedRational(r: Rational): string {
  const s = rationalToString(r)
  return s.replace(/-/g, '−')
}

/** Build the deterministic states for the 6 steps of the redox-on-rules animation. */
export function getOnRuleSteps(): OnRuleStepState[] {
  // Compute data directly from chemistry lib
  const kExp = explainOxidationNumber('K2Cr2O7', 0, 'Cr')
  const baExp = explainOxidationNumber('BaO2', 0, 'O')

  const kKVal = kExp.steps.find((s) => s.element === 'K')!.assignedValue
  const kOVal = kExp.steps.find((s) => s.element === 'O')!.assignedValue
  const kCrVal = kExp.finalOxidationNumber

  const baBaVal = baExp.steps.find((s) => s.element === 'Ba')!.assignedValue
  const baOVal = baExp.finalOxidationNumber

  return [
    // Step 0: Initial skeleton for K2Cr2O7
    {
      index: 0,
      formula: 'K2Cr2O7',
      name: 'Potassium dichromate',
      charge: 0,
      targetElement: 'Cr',
      stepTitle: 'Step 1: State the target and net charge',
      ruleCitation: 'Neutral compound convention (Rule 6 prerequisite)',
      explanation:
        'Potassium dichromate (K2Cr2O7) is a neutral ionic-covalent compound with net charge 0. We need to find the oxidation number of chromium.',
      equation: 'Total charge = 0  ⟹  Solve for unknown ON(Cr)',
      activeElement: undefined,
      tags: [{ element: 'Cr', value: '?', tone: 'accent' }],
      isSolved: false,
      sumCheckString: '2 × ON(K) + 2 × ON(Cr) + 7 × ON(O) = 0',
      stepCaption: 'Potassium dichromate formula skeleton with undetermined chromium oxidation state.',
    },
    // Step 1: Assign K by Rule 2
    {
      index: 1,
      formula: 'K2Cr2O7',
      name: 'Potassium dichromate',
      charge: 0,
      targetElement: 'Cr',
      stepTitle: 'Step 2: Assign Group 1 alkali metal',
      ruleCitation: 'Rule 2: Group 1 alkali metals are always +1 in compounds',
      explanation: `Potassium is an alkali metal (Group 1). Each K atom has oxidation number ${formatSignedRational(kKVal)}. Two K atoms contribute a total of +2 to the charge ledger.`,
      equation: `2 × (${formatSignedRational(kKVal)}) = +2`,
      activeElement: 'K',
      tags: [
        { element: 'K', value: formatSignedRational(kKVal), tone: 'accent' },
        { element: 'Cr', value: '?', tone: 'neutral' },
      ],
      isSolved: false,
      sumCheckString: `(+2) + 2 × ON(Cr) + 7 × ON(O) = 0`,
      stepCaption: 'Potassium assigned +1 by Rule 2.',
    },
    // Step 2: Assign O by Rule 3
    {
      index: 2,
      formula: 'K2Cr2O7',
      name: 'Potassium dichromate',
      charge: 0,
      targetElement: 'Cr',
      stepTitle: 'Step 3: Assign standard oxide oxygen',
      ruleCitation: 'Rule 3: Oxygen has oxidation number −2 in normal oxo compounds',
      explanation: `In the absence of peroxo links or fluorine bonds, oxygen is assigned ${formatSignedRational(kOVal)}. Seven oxygen atoms contribute 7 × (−2) = −14.`,
      equation: `7 × (${formatSignedRational(kOVal)}) = −14`,
      activeElement: 'O',
      tags: [
        { element: 'K', value: formatSignedRational(kKVal), tone: 'neutral' },
        { element: 'O', value: formatSignedRational(kOVal), tone: 'accent' },
        { element: 'Cr', value: '?', tone: 'neutral' },
      ],
      isSolved: false,
      sumCheckString: `(+2) + 2 × ON(Cr) + (−14) = 0`,
      stepCaption: 'Oxygen assigned −2 by Rule 3.',
    },
    // Step 3: Solve Cr by Sum Rule
    {
      index: 3,
      formula: 'K2Cr2O7',
      name: 'Potassium dichromate',
      charge: 0,
      targetElement: 'Cr',
      stepTitle: 'Step 4: Solve chromium via the sum rule',
      ruleCitation: 'Rule 6: Algebraic sum of oxidation numbers equals net charge',
      explanation: `Sum rule: 2 × (+1) + 2 × x + 7 × (−2) = 0 ⟹ 2 × x − 12 = 0 ⟹ 2 × x = +12 ⟹ x = ${formatSignedRational(kCrVal)}. Chromium exhibits its highest oxidation state of +6.`,
      equation: `2 × (+1) + 2 × x + 7 × (−2) = 0  ⟹  x = ${formatSignedRational(kCrVal)}`,
      activeElement: 'Cr',
      tags: [
        { element: 'K', value: formatSignedRational(kKVal), tone: 'neutral' },
        { element: 'Cr', value: formatSignedRational(kCrVal), tone: 'accent' },
        { element: 'O', value: formatSignedRational(kOVal), tone: 'neutral' },
      ],
      isSolved: true,
      sumCheckString: `(+2) + (+12) + (−14) = 0  ✓`,
      stepCaption: 'Chromium solved as +6 via the algebraic sum rule.',
    },
    // Step 4: Peroxide trap with BaO2 - Assign Ba
    {
      index: 4,
      formula: 'BaO2',
      name: 'Barium peroxide',
      charge: 0,
      targetElement: 'O',
      stepTitle: 'Step 5: The peroxide trap — prioritise fixed metal states',
      ruleCitation: 'Rule 2: Group 2 alkaline earth metals are always +2 in compounds',
      explanation:
        'A frequent pitfall is assuming oxygen is −2, which would force barium to +4. But barium is an alkaline earth metal (Group 2), strictly fixed at +2.',
      equation: `Ba is strictly ${formatSignedRational(baBaVal)}`,
      activeElement: 'Ba',
      tags: [
        { element: 'Ba', value: formatSignedRational(baBaVal), tone: 'accent' },
        { element: 'O', value: '?', tone: 'neutral' },
      ],
      isSolved: false,
      isTrap: true,
      trapWarning: 'Common trap: Assuming O = −2 gives Ba = +4, which is chemically impossible!',
      sumCheckString: `(+2) + 2 × ON(O) = 0`,
      stepCaption: 'Barium peroxide trap: alkaline earth metal barium is fixed at +2.',
    },
    // Step 5: Solve Oxygen in BaO2 - Peroxide confirmed!
    {
      index: 5,
      formula: 'BaO2',
      name: 'Barium peroxide',
      charge: 0,
      targetElement: 'O',
      stepTitle: 'Step 6: Sum rule unmasks the peroxide linkage',
      ruleCitation: 'Rule 6 + Rule 3 Exception: Peroxide ion [O−O]²⁻ has O = −1',
      explanation: `Solving for oxygen: (+2) + 2 × x = 0 ⟹ 2 × x = −2 ⟹ x = ${formatSignedRational(baOVal)}. Each oxygen is −1, proving BaO2 contains the peroxide ion [O−O]²⁻.`,
      equation: `(+2) + 2 × x = 0  ⟹  2 × x = −2  ⟹  x = ${formatSignedRational(baOVal)}`,
      activeElement: 'O',
      tags: [
        { element: 'Ba', value: formatSignedRational(baBaVal), tone: 'neutral' },
        { element: 'O', value: formatSignedRational(baOVal), tone: 'accent' },
      ],
      isSolved: true,
      isTrap: true,
      trapWarning: 'Peroxide confirmed: Each oxygen has oxidation number −1.',
      sumCheckString: `(+2) + 2 × (−1) = 0  ✓`,
      stepCaption: 'Sum rule confirms oxygen is −1 in barium peroxide.',
    },
  ]
}

export const ON_RULE_STEPS = getOnRuleSteps()
