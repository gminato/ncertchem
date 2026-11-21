/**
 * Ideal and non-ideal binary liquid-liquid vapour pressure model
 * using symmetric one-parameter Margules (regular-solution) activity coefficients.
 *
 * Reference: NCERT Chemistry Class 12, Part I — Unit 1, Section 1.5.
 */

export type DeviationSign = 'ideal' | 'positive' | 'negative';
export type MixingSign = 'zero' | 'positive' | 'negative';
export type AzeotropeType = 'minimum-boiling' | 'maximum-boiling';

export interface NonIdealInput {
  /** Pure vapour pressure of component 1 (kPa or consistent pressure unit). */
  p1Zero: number;
  /** Pure vapour pressure of component 2 (same pressure unit as p1Zero). */
  p2Zero: number;
  /** Liquid mole fraction of component 2 (0 to 1). */
  x2: number;
  /**
   * Symmetric Margules interaction parameter w:
   * - w = 0: ideal solution (A-B ≈ A-A, B-B)
   * - w > 0: positive deviation (A-B weaker than A-A, B-B)
   * - w < 0: negative deviation (A-B stronger than A-A, B-B)
   */
  interactionW: number;
}

export interface NonIdealResult {
  x1: number;
  x2: number;
  gamma1: number;
  gamma2: number;
  p1Ideal: number;
  p2Ideal: number;
  pTotalIdeal: number;
  p1: number;
  p2: number;
  pTotal: number;
  y1: number;
  y2: number;
  deviationSign: DeviationSign;
  deltaHMixSign: MixingSign;
  deltaVMixSign: MixingSign;
}

export interface AzeotropeInput {
  p1Zero: number;
  p2Zero: number;
  interactionW: number;
}

export interface AzeotropeResult {
  type: AzeotropeType;
  x1: number;
  x2: number;
  pTotal: number;
  pTotalIdeal: number;
}

export type MixturePresetId =
  | 'hexane-heptane'
  | 'ethanol-acetone'
  | 'ethanol-water'
  | 'chloroform-acetone'
  | 'nitric-acid-water';

export interface MixturePreset {
  id: MixturePresetId;
  label: string;
  shortLabel: string;
  component1: string;
  component2: string;
  temperatureK: number;
  p1Zero: number;
  p2Zero: number;
  interactionW: number;
  deviationSign: DeviationSign;
  forceReason: string;
  azeotropeNote: string;
}

const IDEAL_EPSILON = 1e-9;
const ENDPOINT_EPSILON = 1e-6;

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function classifyDeviation(interactionW: number): DeviationSign {
  if (Math.abs(interactionW) < IDEAL_EPSILON) return 'ideal';
  return interactionW > 0 ? 'positive' : 'negative';
}

export function mixingSignFromW(interactionW: number): MixingSign {
  if (Math.abs(interactionW) < IDEAL_EPSILON) return 'zero';
  return interactionW > 0 ? 'positive' : 'negative';
}

/**
 * Computes ideal and real partial/total vapour pressures for a binary mixture
 * using symmetric regular-solution activity coefficients:
 *   gamma1 = exp(w * x2^2),  gamma2 = exp(w * x1^2).
 */
export function nonIdealVapourPressure({
  p1Zero,
  p2Zero,
  x2: rawX2,
  interactionW,
}: NonIdealInput): NonIdealResult {
  const safeP1Zero = Math.max(0, p1Zero);
  const safeP2Zero = Math.max(0, p2Zero);
  const x2 = clampUnit(rawX2);
  const x1 = 1 - x2;

  const gamma1 = Math.exp(interactionW * x2 * x2);
  const gamma2 = Math.exp(interactionW * x1 * x1);

  const p1Ideal = x1 * safeP1Zero;
  const p2Ideal = x2 * safeP2Zero;
  const pTotalIdeal = p1Ideal + p2Ideal;

  const p1 = x1 * gamma1 * safeP1Zero;
  const p2 = x2 * gamma2 * safeP2Zero;
  const pTotal = p1 + p2;

  const y2 = pTotal > 0 ? p2 / pTotal : x2;
  const y1 = 1 - y2;

  const deviationSign = classifyDeviation(interactionW);
  const mixingSign = mixingSignFromW(interactionW);

  return {
    x1,
    x2,
    gamma1,
    gamma2,
    p1Ideal,
    p2Ideal,
    pTotalIdeal,
    p1,
    p2,
    pTotal,
    y1,
    y2,
    deviationSign,
    deltaHMixSign: mixingSign,
    deltaVMixSign: mixingSign,
  };
}

/**
 * Locates the interior azeotrope composition (0 < x2 < 1) where vapour and
 * liquid compositions match (y2 = x2, equivalently dp_total/dx2 = 0 for a
 * single-phase regular solution):
 *
 *   p2^0 * exp(w * (1 - x2)^2) = p1^0 * exp(w * x2^2)
 *   => x2* = 0.5 + ln(p2^0 / p1^0) / (2 * w)
 *
 * Exists iff |w| > |ln(p2^0 / p1^0)|.
 * - w > 0: vapour pressure maximum -> minimum-boiling azeotrope.
 * - w < 0: vapour pressure minimum -> maximum-boiling azeotrope.
 */
export function findAzeotrope({
  p1Zero,
  p2Zero,
  interactionW,
}: AzeotropeInput): AzeotropeResult | null {
  if (p1Zero <= 0 || p2Zero <= 0) return null;
  if (Math.abs(interactionW) < IDEAL_EPSILON) return null;

  const x2 = 0.5 + Math.log(p2Zero / p1Zero) / (2 * interactionW);
  if (!Number.isFinite(x2) || x2 <= ENDPOINT_EPSILON || x2 >= 1 - ENDPOINT_EPSILON) {
    return null;
  }

  const point = nonIdealVapourPressure({
    p1Zero,
    p2Zero,
    x2,
    interactionW,
  });

  const type: AzeotropeType =
    interactionW > 0 ? 'minimum-boiling' : 'maximum-boiling';

  return {
    type,
    x1: point.x1,
    x2: point.x2,
    pTotal: point.pTotal,
    pTotalIdeal: point.pTotalIdeal,
  };
}

/**
 * Generates sampled vapour-pressure curve points from x2 = 0 to x2 = 1.
 */
export function sampleVapourCurve(
  p1Zero: number,
  p2Zero: number,
  interactionW: number,
  segments = 50,
): NonIdealResult[] {
  const count = Math.max(2, Math.floor(segments));
  const points: NonIdealResult[] = [];
  for (let i = 0; i <= count; i++) {
    const x2 = i / count;
    points.push(nonIdealVapourPressure({ p1Zero, p2Zero, x2, interactionW }));
  }
  return points;
}

/**
 * NCERT Section 1.5 reference binary mixtures (pressures in kPa).
 */
export const MIXTURE_PRESETS: Record<MixturePresetId, MixturePreset> = {
  'hexane-heptane': {
    id: 'hexane-heptane',
    label: 'n-Hexane + n-Heptane',
    shortLabel: 'Ideal: Hexane + Heptane',
    component1: 'n-Heptane',
    component2: 'n-Hexane',
    temperatureK: 330,
    p1Zero: 25,
    p2Zero: 69,
    interactionW: 0,
    deviationSign: 'ideal',
    forceReason:
      'Both molecules are non-polar alkanes with nearly identical London dispersion forces, so A–B attractions match A–A and B–B.',
    azeotropeNote:
      'Ideal mixtures never form an azeotrope and can be separated cleanly by fractional distillation.',
  },
  'ethanol-acetone': {
    id: 'ethanol-acetone',
    label: 'Ethanol + Acetone',
    shortLabel: 'Positive: Ethanol + Acetone',
    component1: 'Ethanol',
    component2: 'Acetone',
    temperatureK: 325,
    p1Zero: 36,
    p2Zero: 88,
    interactionW: 0.75,
    deviationSign: 'positive',
    forceReason:
      'Acetone molecules slip between hydrogen-bonded ethanol chains and break some O–H···O bonds, leaving A–B attractions weaker than pure ethanol H-bonds.',
    azeotropeNote:
      'Moderate positive deviation raises vapour pressure above Raoult’s line; stronger positive deviation (like ethanol + water) creates a minimum-boiling azeotrope.',
  },
  'ethanol-water': {
    id: 'ethanol-water',
    label: 'Ethanol + Water',
    shortLabel: 'Min-boiling: Ethanol + Water',
    component1: 'Water',
    component2: 'Ethanol',
    temperatureK: 351,
    p1Zero: 44,
    p2Zero: 100,
    interactionW: 1.05,
    deviationSign: 'positive',
    forceReason:
      'Large positive deviation from disrupted hydrogen-bonding networks causes vapour pressure to peak above both pure liquids.',
    azeotropeNote:
      'Forms a minimum-boiling azeotrope at roughly 95% ethanol by volume, where liquid and vapour compositions match.',
  },
  'chloroform-acetone': {
    id: 'chloroform-acetone',
    label: 'Chloroform + Acetone',
    shortLabel: 'Negative: CHCl₃ + Acetone',
    component1: 'Chloroform',
    component2: 'Acetone',
    temperatureK: 328,
    p1Zero: 82,
    p2Zero: 96,
    interactionW: -1.0,
    deviationSign: 'negative',
    forceReason:
      'Chloroform’s polarised C–H proton forms a new hydrogen bond (Cl₃C–H···O=C(CH₃)₂) with acetone’s carbonyl oxygen, making A–B attractions stronger than A–A and B–B.',
    azeotropeNote:
      'Strong negative deviation dips vapour pressure below both pure components, producing a maximum-boiling azeotrope.',
  },
  'nitric-acid-water': {
    id: 'nitric-acid-water',
    label: 'Nitric acid + Water',
    shortLabel: 'Max-boiling: HNO₃ + Water',
    component1: 'Water',
    component2: 'Nitric acid',
    temperatureK: 373,
    p1Zero: 101,
    p2Zero: 148,
    interactionW: -1.6,
    deviationSign: 'negative',
    forceReason:
      'Strong ion–dipole and hydrogen-bonding interactions between nitric acid and water drastically suppress escaping tendency.',
    azeotropeNote:
      'Forms a maximum-boiling azeotrope at roughly 68% HNO₃ and 32% water by mass, boiling at 393.5 K.',
  },
};
