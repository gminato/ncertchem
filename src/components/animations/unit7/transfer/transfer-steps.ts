/**
 * Step targets and verified chemistry data for the Electron Transfer Scrolly Animation
 * (Unit 7, Section 7.2).
 *
 * Built on the electron-transfer model for Na + Cl:
 * Step 0: Neutral Na and Cl atoms face off
 * Step 1: Electron leaps across the flight arc
 * Step 2: Stable Na+ and Cl- ions form with complete octets
 * Step 3: Splitting into oxidation and reduction half-reactions
 * Step 4: Identification of oxidant (electron acceptor) and reductant (electron donor)
 */

export interface TransferStepData {
  index: number
  title: string
  stageNumber: string
  progress: number
  donorSymbol: string
  acceptorSymbol: string
  donorCharge: string
  acceptorCharge: string
  electrons: number
  conceptTitle: string
  conceptDetail: string
  /** Mhchem reaction without the \\ce{} wrapper; the view typesets it with KaTeX. */
  oxHalfMhchem?: string
  redHalfMhchem?: string
  overallMhchem?: string
  oxRole?: string
  redRole?: string
}

export const TRANSFER_STEPS: readonly TransferStepData[] = [
  {
    index: 0,
    stageNumber: 'Step 1 of 5',
    title: 'Neutral Atoms Face Off',
    progress: 0,
    donorSymbol: 'Na',
    acceptorSymbol: 'Cl',
    donorCharge: '0',
    acceptorCharge: '0',
    electrons: 1,
    conceptTitle: 'Valence Configurations',
    conceptDetail: 'Na (2,8,1) has a low ionisation enthalpy; Cl (2,8,7) has a high electron gain enthalpy.',
  },
  {
    index: 1,
    stageNumber: 'Step 2 of 5',
    title: 'The Electron Leap',
    progress: 0.5,
    donorSymbol: 'Na',
    acceptorSymbol: 'Cl',
    donorCharge: 'δ+',
    acceptorCharge: 'δ−',
    electrons: 1,
    conceptTitle: 'Direction of Transfer',
    conceptDetail: 'One electron departs the 3s orbital of sodium and travels along the trajectory towards chlorine.',
  },
  {
    index: 2,
    stageNumber: 'Step 3 of 5',
    title: 'Stable Ions Form (Na⁺ & Cl⁻)',
    progress: 1.0,
    donorSymbol: 'Na',
    acceptorSymbol: 'Cl',
    donorCharge: '+',
    acceptorCharge: '−',
    electrons: 1,
    conceptTitle: 'Closed-Shell Octets',
    conceptDetail: 'Na⁺ attains the neon configuration [Ne]; Cl⁻ attains the argon configuration [Ar]. Electrostatic attraction binds them.',
  },
  {
    index: 3,
    stageNumber: 'Step 4 of 5',
    title: 'Two Half-Reactions',
    progress: 1.0,
    donorSymbol: 'Na',
    acceptorSymbol: 'Cl',
    donorCharge: '+',
    acceptorCharge: '−',
    electrons: 1,
    conceptTitle: 'Splitting the Net Change',
    conceptDetail: 'Every redox equation splits into an electron-loss half and an electron-gain half. Total electrons balance.',
    oxHalfMhchem: '2Na(s) -> 2Na+ + 2e-',
    redHalfMhchem: 'Cl2(g) + 2e- -> 2Cl-',
    overallMhchem: '2Na(s) + Cl2(g) -> 2NaCl(s)',
  },
  {
    index: 4,
    stageNumber: 'Step 5 of 5',
    title: 'Oxidant and Reductant Roles',
    progress: 1.0,
    donorSymbol: 'Na',
    acceptorSymbol: 'Cl',
    donorCharge: '+',
    acceptorCharge: '−',
    electrons: 1,
    conceptTitle: 'Agents and Their Action',
    conceptDetail: 'The substance that loses electrons is oxidised and acts as the reductant. The acceptor is reduced and acts as the oxidant.',
    oxRole: 'Sodium (Na) loses e⁻ → Oxidised → Reducing Agent (Reductant)',
    redRole: 'Chlorine (Cl₂) gains e⁻ → Reduced → Oxidising Agent (Oxidant)',
  },
]

export const TRANSFER_STEP_COUNT = TRANSFER_STEPS.length

export function transferStep(index: number): TransferStepData {
  const bounded = Math.min(TRANSFER_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  return TRANSFER_STEPS[bounded]
}
