import { raoultBinary, raoultNonVolatile } from '@/lib/chem/raoult-law';

export const RAOULT_STEP_COUNT = 5;

export type SurfaceSiteKind = 'solvent' | 'volatile' | 'nonvolatile';

export type RaoultVisualMode =
  | 'vessel-pure'
  | 'vessel-binary'
  | 'diagram-dalton'
  | 'henry-special-case'
  | 'vessel-nonvolatile';

export interface RaoultStepSpec {
  index: number;
  badge: string;
  title: string;
  mode: RaoultVisualMode;
  ariaLabel: string;
  /** Mole fraction of component 1 (solvent) */
  x1: number;
  /** Mole fraction of component 2 (second volatile liquid or non-volatile solute) */
  x2: number;
  /** Pure vapour pressure of component 1 (mmHg) */
  p1Zero: number;
  /** Pure vapour pressure of component 2 (mmHg; 0 when non-volatile) */
  p2Zero: number;
  /** Partial vapour pressure of component 1 (mmHg) */
  p1: number;
  /** Partial vapour pressure of component 2 (mmHg) */
  p2: number;
  /** Total equilibrium vapour pressure (mmHg) */
  pTotal: number;
  /** Vapour mole fraction of component 1 */
  y1: number;
  /** Vapour mole fraction of component 2 */
  y2: number;
  /** 10 representative surface sites across the liquid–vapour boundary */
  surfaceSites: readonly SurfaceSiteKind[];
}

const P1_ZERO = 200; // Chloroform at 298 K (mmHg)
const P2_ZERO = 415; // Dichloromethane at 298 K (mmHg)

const binaryEq = raoultBinary({ p1Zero: P1_ZERO, p2Zero: P2_ZERO, x2: 0.5 });
const nonVolEq = raoultNonVolatile({ p1Zero: P1_ZERO, xSolute: 0.3 });

export const RAOULT_STEPS: readonly RaoultStepSpec[] = [
  {
    index: 0,
    badge: 'Step 1 of 5',
    title: 'Pure volatile solvent: full surface escape',
    mode: 'vessel-pure',
    ariaLabel:
      'Closed vessel holding pure volatile component 1 with all ten surface sites available for evaporation, giving pure vapour pressure 200 mmHg.',
    x1: 1,
    x2: 0,
    p1Zero: P1_ZERO,
    p2Zero: P2_ZERO,
    p1: P1_ZERO,
    p2: 0,
    pTotal: P1_ZERO,
    y1: 1,
    y2: 0,
    surfaceSites: [
      'solvent',
      'solvent',
      'solvent',
      'solvent',
      'solvent',
      'solvent',
      'solvent',
      'solvent',
      'solvent',
      'solvent',
    ],
  },
  {
    index: 1,
    badge: 'Step 2 of 5',
    title: 'Two volatile liquids share the surface',
    mode: 'vessel-binary',
    ariaLabel:
      'Equimolar binary mixture of chloroform and dichloromethane where half the surface sites belong to each liquid; partial pressures are 100 and 207.5 mmHg for a total of 307.5 mmHg.',
    x1: binaryEq.x1,
    x2: binaryEq.x2,
    p1Zero: P1_ZERO,
    p2Zero: P2_ZERO,
    p1: binaryEq.p1,
    p2: binaryEq.p2,
    pTotal: binaryEq.pTotal,
    y1: binaryEq.y1,
    y2: binaryEq.y2,
    surfaceSites: [
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
    ],
  },
  {
    index: 2,
    badge: 'Step 3 of 5',
    title: 'Linear Raoult plot and vapour enrichment',
    mode: 'diagram-dalton',
    ariaLabel:
      'Linear plot of partial and total vapour pressures versus mole fraction alongside Dalton composition bars showing 50 percent liquid component 2 producing 67.5 percent vapour component 2.',
    x1: binaryEq.x1,
    x2: binaryEq.x2,
    p1Zero: P1_ZERO,
    p2Zero: P2_ZERO,
    p1: binaryEq.p1,
    p2: binaryEq.p2,
    pTotal: binaryEq.pTotal,
    y1: binaryEq.y1,
    y2: binaryEq.y2,
    surfaceSites: [
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
    ],
  },
  {
    index: 3,
    badge: 'Step 4 of 5',
    title: "Raoult's law as a special case of Henry's law",
    mode: 'henry-special-case',
    ariaLabel:
      'Comparison graph showing Henry law p equals K_H times x and Raoult law p_i equals p_i zero times x_i as straight lines through the origin that coincide when K_H equals p_i zero.',
    x1: binaryEq.x1,
    x2: binaryEq.x2,
    p1Zero: P1_ZERO,
    p2Zero: P2_ZERO,
    p1: binaryEq.p1,
    p2: binaryEq.p2,
    pTotal: binaryEq.pTotal,
    y1: binaryEq.y1,
    y2: binaryEq.y2,
    surfaceSites: [
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
      'solvent',
      'volatile',
    ],
  },
  {
    index: 4,
    badge: 'Step 5 of 5',
    title: 'Non-volatile solute blocks surface escape',
    mode: 'vessel-nonvolatile',
    ariaLabel:
      'Closed vessel where three of ten surface sites are occupied by non-volatile solute particles that cannot evaporate, reducing solvent vapour pressure from 200 to 140 mmHg.',
    x1: nonVolEq.xSolvent,
    x2: nonVolEq.relativeLowering,
    p1Zero: P1_ZERO,
    p2Zero: 0,
    p1: nonVolEq.pSolution,
    p2: 0,
    pTotal: nonVolEq.pSolution,
    y1: 1,
    y2: 0,
    surfaceSites: [
      'solvent',
      'nonvolatile',
      'solvent',
      'solvent',
      'nonvolatile',
      'solvent',
      'solvent',
      'nonvolatile',
      'solvent',
      'solvent',
    ],
  },
] as const;

export function clampRaoultStep(step: number): number {
  if (!Number.isFinite(step)) return 0;
  const rounded = Math.round(step);
  return Math.max(0, Math.min(RAOULT_STEP_COUNT - 1, rounded));
}

export function getRaoultStep(step: number): RaoultStepSpec {
  return RAOULT_STEPS[clampRaoultStep(step)];
}
