export type OsmosisStepId =
  | 'spm-barrier'
  | 'forward-osmosis'
  | 'osmotic-equilibrium'
  | 'tonicity-cells'
  | 'reverse-osmosis'

export type OsmosisSceneMode = 'chamber' | 'tonicity'
export type FluxMode = 'blocked-preview' | 'forward' | 'equilibrium' | 'reverse'

export interface OsmosisStepState {
  readonly index: number
  readonly id: OsmosisStepId
  readonly sceneMode: OsmosisSceneMode
  readonly title: string
  readonly subtitle: string
  readonly leftLabel: string
  readonly rightLabel: string
  readonly membraneLabel: string
  readonly leftLiquidTop: number
  readonly rightLiquidTop: number
  readonly showPiston: boolean
  readonly pistonY: number
  readonly pistonPressureLabel: string
  readonly fluxMode: FluxMode
  readonly showFreshwaterOutlet: boolean
  readonly caption: string
  readonly ariaLabel: string
}

export const OSMOSIS_STEPS: readonly OsmosisStepState[] = [
  {
    index: 0,
    id: 'spm-barrier',
    sceneMode: 'chamber',
    title: 'Semipermeable Membrane (SPM)',
    subtitle: 'Submicroscopic pores admit solvent, block larger solute particles',
    leftLabel: 'Pure solvent',
    rightLabel: 'Solution',
    membraneLabel: 'SPM',
    leftLiquidTop: 196,
    rightLiquidTop: 196,
    showPiston: false,
    pistonY: 108,
    pistonPressureLabel: '',
    fluxMode: 'blocked-preview',
    showFreshwaterOutlet: false,
    caption: 'Small solvent molecules fit through SPM pores; bulky solute stays behind.',
    ariaLabel:
      'Twin chamber vessel divided by a semipermeable membrane. Left holds pure solvent and right holds solution at equal levels. Submicroscopic pores allow small solvent molecules to cross while blocking larger solute spheres.',
  },
  {
    index: 1,
    id: 'forward-osmosis',
    sceneMode: 'chamber',
    title: 'Spontaneous Osmosis',
    subtitle: 'Net solvent flow from pure solvent toward higher solute concentration',
    leftLabel: 'Pure solvent',
    rightLabel: 'Solution (rises)',
    membraneLabel: 'SPM',
    leftLiquidTop: 234,
    rightLiquidTop: 152,
    showPiston: false,
    pistonY: 108,
    pistonPressureLabel: '',
    fluxMode: 'forward',
    showFreshwaterOutlet: false,
    caption: 'Net osmosis lowers the solvent level and lifts the solution column.',
    ariaLabel:
      'Spontaneous osmosis in the twin chamber vessel. A forward arrow shows solvent crossing left to right into the solution, lowering the pure solvent level and raising the solution column.',
  },
  {
    index: 2,
    id: 'osmotic-equilibrium',
    sceneMode: 'chamber',
    title: 'Halting Osmosis: Π = C R T',
    subtitle: 'Excess pressure equal to Π balances solvent flux across the membrane',
    leftLabel: 'Pure solvent',
    rightLabel: 'Solution under Π',
    membraneLabel: 'SPM',
    leftLiquidTop: 196,
    rightLiquidTop: 196,
    showPiston: true,
    pistonY: 196,
    pistonPressureLabel: 'P = Π = C R T',
    fluxMode: 'equilibrium',
    showFreshwaterOutlet: false,
    caption: 'Applying excess pressure P = Π on the solution side stops net osmosis.',
    ariaLabel:
      'A weighted piston presses down on the right solution chamber with excess pressure equal to the osmotic pressure Pi = CRT. Both liquid columns remain level and opposing arrows show zero net solvent flow.',
  },
  {
    index: 3,
    id: 'tonicity-cells',
    sceneMode: 'tonicity',
    title: 'Living Cells & Tonicity',
    subtitle: 'Human blood cells match 0.9% (w/v) aqueous NaCl (normal saline)',
    leftLabel: 'Hypotonic',
    rightLabel: 'Hypertonic',
    membraneLabel: 'Cell membrane',
    leftLiquidTop: 196,
    rightLiquidTop: 196,
    showPiston: false,
    pistonY: 108,
    pistonPressureLabel: '',
    fluxMode: 'equilibrium',
    showFreshwaterOutlet: false,
    caption: 'Isotonic 0.9% NaCl keeps cells steady; hypertonic shrinks and hypotonic swells.',
    ariaLabel:
      'Three-panel comparison of red blood cells in saline solutions. Left: hypotonic below 0.9% NaCl causes water to enter and the cell swells. Center: isotonic 0.9% NaCl keeps a steady biconcave shape. Right: hypertonic above 0.9% NaCl draws water out and the cell shrinks.',
  },
  {
    index: 4,
    id: 'reverse-osmosis',
    sceneMode: 'chamber',
    title: 'Reverse Osmosis Desalination (P > Π)',
    subtitle: 'Pressing harder than Π drives pure water out of seawater',
    leftLabel: 'Freshwater',
    rightLabel: 'Seawater (salts)',
    membraneLabel: 'Cellulose acetate',
    leftLiquidTop: 162,
    rightLiquidTop: 228,
    showPiston: true,
    pistonY: 228,
    pistonPressureLabel: 'P > Π',
    fluxMode: 'reverse',
    showFreshwaterOutlet: true,
    caption: 'Cellulose acetate passes water under high pressure while rejecting sea ions.',
    ariaLabel:
      'Reverse osmosis desalination chamber. A piston presses the right seawater chamber with pressure greater than osmotic pressure Pi, forcing pure water molecules leftward across a cellulose acetate membrane into a freshwater outlet while sea ions stay behind.',
  },
] as const

export const OSMOSIS_STEP_COUNT = OSMOSIS_STEPS.length

export function clampOsmosisStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  const floored = Math.floor(step)
  return Math.max(0, Math.min(OSMOSIS_STEP_COUNT - 1, floored))
}

export function getOsmosisStepState(step: number): OsmosisStepState {
  return OSMOSIS_STEPS[clampOsmosisStep(step)]
}
