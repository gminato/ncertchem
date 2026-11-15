/**
 * Step targets and verified chemistry data for the Classical Redox Scrolly Animation
 * (Unit 7, Section 7.1).
 *
 * Covers the classical broadening of oxidation and reduction definitions:
 * Step 0: Addition of oxygen (oxidation) and removal of oxygen (reduction)
 * Step 1: Removal of hydrogen (oxidation) and addition of hydrogen (reduction)
 * Step 2: Addition of electronegative element (oxidation)
 * Step 3: Removal of electropositive element (oxidation)
 * Step 4: The unified classical redox ledger and simultaneous occurrence
 */

export interface ClassicalStepData {
  index: number
  stageNumber: string
  title: string
  ruleTitle: string
  oxRule: string
  redRule: string
  reactionMhchem: string
  equationDisplay: string
  oxidisedSpecies: string
  reducedSpecies: string
  oxProduct: string
  redProduct: string
  oxReason: string
  redReason: string
  matrixRows?: ReadonlyArray<{
    criterion: string
    oxidation: string
    reduction: string
  }>
}

export const CLASSICAL_STEPS: readonly ClassicalStepData[] = [
  {
    index: 0,
    stageNumber: 'Stage 1 of 4',
    title: 'Addition & Removal of Oxygen',
    ruleTitle: 'The Historical Origin',
    oxRule: 'Oxidation: Addition of oxygen',
    redRule: 'Reduction: Removal of oxygen',
    reactionMhchem: '\\ce{2CuO(s) + C(s) -> 2Cu(s) + CO2(g)}',
    equationDisplay: '2CuO(s) + C(s) → 2Cu(s) + CO₂(g)',
    oxidisedSpecies: 'C(s)',
    reducedSpecies: 'CuO(s)',
    oxProduct: 'CO₂(g)',
    redProduct: 'Cu(s)',
    oxReason: 'Gains oxygen to form carbon dioxide (+O)',
    redReason: 'Loses oxygen to leave elemental copper (−O)',
  },
  {
    index: 1,
    stageNumber: 'Stage 2 of 4',
    title: 'Removal & Addition of Hydrogen',
    ruleTitle: 'Broadening to Hydrogen',
    oxRule: 'Oxidation: Removal of hydrogen',
    redRule: 'Reduction: Addition of hydrogen',
    reactionMhchem: '\\ce{2H2S(g) + Cl2(g) -> 2HCl(g) + S(s)}',
    equationDisplay: '2H₂S(g) + Cl₂(g) → 2HCl(g) + S(s)',
    oxidisedSpecies: 'H₂S(g)',
    reducedSpecies: 'Cl₂(g)',
    oxProduct: 'S(s)',
    redProduct: 'HCl(g)',
    oxReason: 'Hydrogen is stripped away from sulphur (−H)',
    redReason: 'Chlorine acquires hydrogen to form HCl (+H)',
  },
  {
    index: 2,
    stageNumber: 'Stage 3 of 4',
    title: 'Addition of Electronegative Elements',
    ruleTitle: 'Beyond Oxygen',
    oxRule: 'Oxidation: Addition of electronegative element',
    redRule: 'Reduction: Removal of electronegative element',
    reactionMhchem: '\\ce{Ca(s) + Cl2(g) -> CaCl2(s)}',
    equationDisplay: 'Ca(s) + Cl₂(g) → CaCl₂(s)',
    oxidisedSpecies: 'Ca(s)',
    reducedSpecies: 'Cl₂(g)',
    oxProduct: 'CaCl₂(s)',
    redProduct: 'CaCl₂(s)',
    oxReason: 'Combines with electronegative chlorine (+Cl)',
    redReason: 'Chlorine accepts electropositive calcium (+Ca)',
  },
  {
    index: 3,
    stageNumber: 'Stage 4 of 4',
    title: 'Removal of Electropositive Elements',
    ruleTitle: 'Beyond Hydrogen',
    oxRule: 'Oxidation: Removal of electropositive element',
    redRule: 'Reduction: Addition of electropositive element',
    reactionMhchem: '\\ce{2KI(aq) + Cl2(g) -> 2KCl(aq) + I2(s)}',
    equationDisplay: '2KI(aq) + Cl₂(g) → 2KCl(aq) + I₂(s)',
    oxidisedSpecies: 'KI(aq)',
    reducedSpecies: 'Cl₂(g)',
    oxProduct: 'I₂(s)',
    redProduct: 'KCl(aq)',
    oxReason: 'Electropositive potassium is stripped from iodide (−K)',
    redReason: 'Chlorine acquires electropositive potassium (+K)',
  },
  {
    index: 4,
    stageNumber: 'Summary',
    title: 'The Unified Classical Ledger',
    ruleTitle: 'Redox is Simultaneous',
    oxRule: 'Oxidation = +O, −H, +electronegative, −electropositive',
    redRule: 'Reduction = −O, +H, −electronegative, +electropositive',
    reactionMhchem: '\\ce{Oxidation + Reduction <=> Redox}',
    equationDisplay: 'Oxidation & Reduction Always Occur Together',
    oxidisedSpecies: 'Reducing Agent (Oxidised)',
    reducedSpecies: 'Oxidising Agent (Reduced)',
    oxProduct: 'Electron / Partner Donor',
    redProduct: 'Electron / Partner Acceptor',
    oxReason: 'Cannot occur alone: lost atoms/electrons must have a recipient',
    redReason: 'Cannot occur alone: gained atoms/electrons must come from a donor',
    matrixRows: [
      { criterion: 'Oxygen (O)', oxidation: 'Addition (+O)', reduction: 'Removal (−O)' },
      { criterion: 'Hydrogen (H)', oxidation: 'Removal (−H)', reduction: 'Addition (+H)' },
      { criterion: 'Electronegative Element', oxidation: 'Addition (+EN)', reduction: 'Removal (−EN)' },
      { criterion: 'Electropositive Element', oxidation: 'Removal (−EP)', reduction: 'Addition (+EP)' },
    ],
  },
]

export const CLASSICAL_STEP_COUNT = CLASSICAL_STEPS.length

export function classicalStep(index: number): ClassicalStepData {
  const bounded = Math.min(CLASSICAL_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  return CLASSICAL_STEPS[bounded]
}
