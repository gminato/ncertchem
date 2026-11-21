import {
  findAzeotrope,
  nonIdealVapourPressure,
  type AzeotropeResult,
  type DeviationSign,
} from '@/lib/chem/ideal-nonideal';

export interface DeviationStep {
  index: number;
  id:
    | 'ideal'
    | 'positive'
    | 'negative'
    | 'min-azeotrope'
    | 'max-azeotrope';
  title: string;
  mixtureLabel: string;
  escapeSummary: string;
  p1Zero: number;
  p2Zero: number;
  interactionW: number;
  deviationSign: DeviationSign;
  forceRelation: string;
  badgeLine1: string;
  badgeLine2: string;
  highlightAzeotrope: boolean;
  azeotropeCallout: string | null;
  ariaDescription: string;
}

export const DEVIATION_STEPS: readonly DeviationStep[] = [
  {
    index: 0,
    id: 'ideal',
    title: 'Ideal solution: balanced forces',
    mixtureLabel: 'n-Hexane + n-Heptane',
    escapeSummary: 'A–B attractions match A–A and B–B; vapour pressure follows Raoult’s straight line.',
    p1Zero: 30,
    p2Zero: 70,
    interactionW: 0,
    deviationSign: 'ideal',
    forceRelation: 'A–B ≈ A–A, B–B',
    badgeLine1: 'ΔmixH = 0',
    badgeLine2: 'ΔmixV = 0',
    highlightAzeotrope: false,
    azeotropeCallout: null,
    ariaDescription:
      'Step 1: Ideal solution of n-hexane and n-heptane obeying Raoult’s law linearly with zero enthalpy and volume of mixing.',
  },
  {
    index: 1,
    id: 'positive',
    title: 'Positive deviation: broken H-bonds',
    mixtureLabel: 'Ethanol + Acetone',
    escapeSummary: 'Acetone wedges between ethanol H-bonds, so molecules escape more easily and curves bow up.',
    p1Zero: 38,
    p2Zero: 82,
    interactionW: 0.72,
    deviationSign: 'positive',
    forceRelation: 'A–B < A–A, B–B',
    badgeLine1: 'ΔmixH > 0',
    badgeLine2: 'ΔmixV > 0',
    highlightAzeotrope: false,
    azeotropeCallout: null,
    ariaDescription:
      'Step 2: Positive deviation in ethanol and acetone where weaker A–B forces raise vapour pressure curves above the dashed ideal Raoult lines.',
  },
  {
    index: 2,
    id: 'negative',
    title: 'Negative deviation: new H-bond',
    mixtureLabel: 'Chloroform + Acetone',
    escapeSummary: 'Cl₃C–H···O=C hydrogen bond holds molecules tighter, pulling vapour pressure below Raoult’s line.',
    p1Zero: 38,
    p2Zero: 82,
    interactionW: -0.72,
    deviationSign: 'negative',
    forceRelation: 'A–B > A–A, B–B',
    badgeLine1: 'ΔmixH < 0',
    badgeLine2: 'ΔmixV < 0',
    highlightAzeotrope: false,
    azeotropeCallout: null,
    ariaDescription:
      'Step 3: Negative deviation in chloroform and acetone where a new hydrogen bond suppresses escaping tendency and bows vapour pressure curves below the ideal lines.',
  },
  {
    index: 3,
    id: 'min-azeotrope',
    title: 'Minimum-boiling azeotrope',
    mixtureLabel: '95% Ethanol + 5% Water',
    escapeSummary: 'Large positive deviation peaks above pure ethanol; vapour matches liquid (y₂ = x₂), halting distillation.',
    p1Zero: 44,
    p2Zero: 94,
    interactionW: 1.35,
    deviationSign: 'positive',
    forceRelation: 'A–B ≪ A–A, B–B',
    badgeLine1: 'y₂ = x₂ (peak)',
    badgeLine2: 'Min boiling T',
    highlightAzeotrope: true,
    azeotropeCallout: 'Min-boiling peak',
    ariaDescription:
      'Step 4: Large positive deviation creates a vapour-pressure maximum in 95% ethanol and 5% water, forming a minimum-boiling azeotrope that fractional distillation cannot separate.',
  },
  {
    index: 4,
    id: 'max-azeotrope',
    title: 'Maximum-boiling azeotrope',
    mixtureLabel: '68% HNO₃ + 32% Water',
    escapeSummary: 'Large negative deviation dips below both pure liquids; boils at a constant 393.5 K with y₂ = x₂.',
    p1Zero: 62,
    p2Zero: 86,
    interactionW: -1.45,
    deviationSign: 'negative',
    forceRelation: 'A–B ≫ A–A, B–B',
    badgeLine1: 'y₂ = x₂ (valley)',
    badgeLine2: 'Boils at 393.5 K',
    highlightAzeotrope: true,
    azeotropeCallout: 'Max-boiling valley',
    ariaDescription:
      'Step 5: Large negative deviation creates a vapour-pressure minimum in 68% nitric acid and 32% water, forming a maximum-boiling azeotrope at 393.5 K.',
  },
];

export function clampDeviationStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  if (step >= DEVIATION_STEPS.length - 1) return DEVIATION_STEPS.length - 1;
  return Math.round(step);
}

export function getDeviationStep(step: number): DeviationStep {
  return DEVIATION_STEPS[clampDeviationStep(step)];
}

export function getStepAzeotrope(step: DeviationStep): AzeotropeResult | null {
  return findAzeotrope({
    p1Zero: step.p1Zero,
    p2Zero: step.p2Zero,
    interactionW: step.interactionW,
  });
}

export function getStepMidpointDeviation(step: DeviationStep): number {
  const mid = nonIdealVapourPressure({
    p1Zero: step.p1Zero,
    p2Zero: step.p2Zero,
    x2: 0.5,
    interactionW: step.interactionW,
  });
  return mid.pTotal - mid.pTotalIdeal;
}
