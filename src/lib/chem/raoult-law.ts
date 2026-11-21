export interface RaoultBinaryInput {
  /** Vapour pressure of pure component 1 (any consistent pressure unit, >= 0) */
  p1Zero: number;
  /** Vapour pressure of pure component 2 (same pressure unit, >= 0) */
  p2Zero: number;
  /** Liquid-phase mole fraction of component 2, in [0, 1] */
  x2: number;
}

export interface RaoultBinaryResult {
  x1: number;
  x2: number;
  p1: number;
  p2: number;
  pTotal: number;
  y1: number;
  y2: number;
}

export interface RaoultNonVolatileInput {
  /** Vapour pressure of pure volatile solvent (any consistent pressure unit, >= 0) */
  p1Zero: number;
  /** Mole fraction of non-volatile solute in solution, in [0, 1] */
  xSolute: number;
}

export interface RaoultNonVolatileResult {
  xSolvent: number;
  pSolution: number;
  lowering: number;
  relativeLowering: number;
}

export type LiquidPairPresetId =
  | 'chloroform-dcm'
  | 'benzene-toluene'
  | 'heptane-octane';

export interface LiquidPairPreset {
  id: LiquidPairPresetId;
  label: string;
  name1: string;
  formula1: string;
  name2: string;
  formula2: string;
  temperatureK: number;
  p1Zero: number;
  p2Zero: number;
  unit: 'mmHg' | 'kPa';
  yMax: number;
  tickStep: number;
}

export const LIQUID_PAIR_PRESETS: readonly LiquidPairPreset[] = [
  {
    id: 'chloroform-dcm',
    label: 'CHCl₃ + CH₂Cl₂',
    name1: 'Chloroform',
    formula1: 'CHCl₃',
    name2: 'Dichloromethane',
    formula2: 'CH₂Cl₂',
    temperatureK: 298,
    p1Zero: 200,
    p2Zero: 415,
    unit: 'mmHg',
    yMax: 450,
    tickStep: 100,
  },
  {
    id: 'benzene-toluene',
    label: 'Benzene + Toluene',
    name1: 'Benzene',
    formula1: 'C₆H₆',
    name2: 'Toluene',
    formula2: 'C₇H₈',
    temperatureK: 300,
    p1Zero: 95,
    p2Zero: 32,
    unit: 'mmHg',
    yMax: 110,
    tickStep: 25,
  },
  {
    id: 'heptane-octane',
    label: 'Heptane + Octane',
    name1: 'Heptane',
    formula1: 'C₇H₁₆',
    name2: 'Octane',
    formula2: 'C₈H₁₈',
    temperatureK: 373,
    p1Zero: 105.2,
    p2Zero: 46.8,
    unit: 'kPa',
    yMax: 120,
    tickStep: 30,
  },
] as const;

export interface NonVolatileSolventPreset {
  name: string;
  formula: string;
  soluteName: string;
  temperatureK: number;
  p1Zero: number;
  unit: 'mmHg';
  yMax: number;
  tickStep: number;
}

export const NON_VOLATILE_WATER_PRESET: NonVolatileSolventPreset = {
  name: 'Water',
  formula: 'H₂O',
  soluteName: 'Sucrose (non-volatile)',
  temperatureK: 298,
  p1Zero: 23.8,
  unit: 'mmHg',
  yMax: 28,
  tickStep: 6,
};

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number (received ${value}).`);
  }
}

function assertMoleFraction(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be a finite mole fraction in [0, 1] (received ${value}).`);
  }
}

/**
 * Computes ideal binary liquid–liquid equilibrium vapour pressures and
 * Dalton's law vapour-phase mole fractions from Raoult's law:
 *   p1 = p1Zero * x1, p2 = p2Zero * x2,
 *   pTotal = p1Zero + (p2Zero - p1Zero) * x2,
 *   y1 = p1 / pTotal, y2 = p2 / pTotal.
 */
export function raoultBinary({
  p1Zero,
  p2Zero,
  x2,
}: RaoultBinaryInput): RaoultBinaryResult {
  assertNonNegativeFinite(p1Zero, 'p1Zero');
  assertNonNegativeFinite(p2Zero, 'p2Zero');
  assertMoleFraction(x2, 'x2');

  const x1 = Math.max(0, 1 - x2);
  const p1 = p1Zero * x1;
  const p2 = p2Zero * x2;
  const pTotal = p1Zero + (p2Zero - p1Zero) * x2;

  const y1 = pTotal > 0 ? p1 / pTotal : 0;
  const y2 = pTotal > 0 ? p2 / pTotal : 0;

  return { x1, x2, p1, p2, pTotal, y1, y2 };
}

/**
 * Computes solvent vapour pressure and lowering for a binary solution
 * containing a volatile solvent (1) and a non-volatile solute (2):
 *   pSolution = p1Zero * (1 - xSolute),
 *   lowering = p1Zero * xSolute,
 *   relativeLowering = xSolute.
 */
export function raoultNonVolatile({
  p1Zero,
  xSolute,
}: RaoultNonVolatileInput): RaoultNonVolatileResult {
  assertNonNegativeFinite(p1Zero, 'p1Zero');
  assertMoleFraction(xSolute, 'xSolute');

  const xSolvent = Math.max(0, 1 - xSolute);
  const pSolution = p1Zero * xSolvent;
  const lowering = p1Zero * xSolute;
  const relativeLowering = xSolute;

  return {
    xSolvent,
    pSolution,
    lowering,
    relativeLowering,
  };
}

/**
 * Returns which component has the higher pure vapour pressure (more volatile).
 */
export function moreVolatileComponent(
  p1Zero: number,
  p2Zero: number,
): 1 | 2 | 'equal' {
  if (p2Zero > p1Zero) return 2;
  if (p1Zero > p2Zero) return 1;
  return 'equal';
}

export function getLiquidPairPreset(id: LiquidPairPresetId): LiquidPairPreset {
  const found = LIQUID_PAIR_PRESETS.find((preset) => preset.id === id);
  return found ?? LIQUID_PAIR_PRESETS[0];
}
