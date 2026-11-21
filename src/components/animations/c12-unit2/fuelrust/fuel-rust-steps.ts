import {
  NCERT_CORROSION,
  NCERT_FUEL_CELL,
  NCERT_STANDARD_POTENTIALS,
} from '@/lib/chem/ncert-c12-unit2-tables'

/** Which drawing a Step shows. The component switches on this, so each Step is one clear state. */
export type FuelRustScene = 'cell' | 'bars' | 'corrosion' | 'rust' | 'protection'

export interface FuelRustStepState {
  readonly index: number
  readonly scene: FuelRustScene
  /** True once electrons and ions move (fuel cell running, or corrosion cell working). */
  readonly active: boolean
  readonly ariaLabel: string
}

export const FUEL_RUST_STEPS: readonly FuelRustStepState[] = [
  {
    index: 0,
    scene: 'cell',
    active: false,
    ariaLabel:
      'Fuel cell in concentrated NaOH with porous carbon electrodes. Hydrogen enters the left electrode, the anode, and oxygen enters the right electrode, the cathode. No current flows yet.',
  },
  {
    index: 1,
    scene: 'cell',
    active: true,
    ariaLabel:
      'Running fuel cell. Electrons travel in the external wire from the anode on the left to the cathode on the right. Hydroxide ions drift through the NaOH from the cathode toward the anode, and water leaves at the anode.',
  },
  {
    index: 2,
    scene: 'bars',
    active: false,
    ariaLabel:
      'Two efficiency bars. A thermal power plant converts about 40 percent of its fuel energy; a hydrogen-oxygen fuel cell about 70 percent.',
  },
  {
    index: 3,
    scene: 'corrosion',
    active: true,
    ariaLabel:
      'Water droplet on an iron surface. The anodic spot releases Fe²⁺ and two electrons per atom. The electrons move through the iron to the cathodic spot, where O₂ and H⁺ are reduced to water.',
  },
  {
    index: 4,
    scene: 'rust',
    active: true,
    ariaLabel:
      'The same iron surface after time. Fe²⁺ ions leaving the droplet oxidise in air and a reddish-brown layer of hydrated ferric oxide grows over the anodic spot.',
  },
  {
    index: 5,
    scene: 'protection',
    active: false,
    ariaLabel:
      'Three protected iron surfaces side by side: under paint, under a zinc coat, and with a magnesium block bolted on. Zinc and magnesium become the anode and corrode while the iron is spared.',
  },
]

export function clampFuelRustStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(FUEL_RUST_STEPS.length - 1, Math.max(0, Math.floor(step)))
}

export function getFuelRustStep(step: number): FuelRustStepState {
  return FUEL_RUST_STEPS[clampFuelRustStep(step)]
}

/** E° of a Table 2.1 couple, read from NCERT_STANDARD_POTENTIALS. */
export function standardE0(id: string): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Table 2.1 has no row ${id}`)
  return row.e0
}

/** Corrosion half-cell potentials and the overall cell potential, all from the NCERT lib. */
export const E0_FE_ANODE = NCERT_CORROSION.anodeE0
export const E0_O2_CATHODE = NCERT_CORROSION.cathodeE0
export const E_CELL_RUST = Math.round((E0_O2_CATHODE - E0_FE_ANODE) * 100) / 100

/** Fuel cell and thermal plant efficiencies (percent), from the NCERT lib. */
export const EFF_FUEL_CELL = NCERT_FUEL_CELL.efficiencyPercent
export const EFF_THERMAL = NCERT_FUEL_CELL.thermalPlantEfficiencyPercent

/** Signed volts with a real minus sign, e.g. −0.44 V and +1.23 V. */
export function fmtSignedVolts(x: number): string {
  const body = Math.abs(x).toFixed(2)
  return x < 0 ? `−${body} V` : `+${body} V`
}
