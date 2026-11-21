import { describe, expect, it } from 'vitest';
import {
  clampRaoultStep,
  getRaoultStep,
  RAOULT_STEP_COUNT,
  RAOULT_STEPS,
} from './raoult-steps';

describe('raoult-steps', () => {
  it('defines exactly 5 sequential steps with non-empty accessible labels', () => {
    expect(RAOULT_STEP_COUNT).toBe(5);
    expect(RAOULT_STEPS).toHaveLength(5);

    RAOULT_STEPS.forEach((step, idx) => {
      expect(step.index).toBe(idx);
      expect(step.title.length).toBeGreaterThan(5);
      expect(step.ariaLabel.length).toBeGreaterThan(20);
      expect(step.surfaceSites).toHaveLength(10);
    });
  });

  it('clamps out-of-range, decimal, and non-finite step inputs safely', () => {
    expect(clampRaoultStep(-3)).toBe(0);
    expect(clampRaoultStep(0)).toBe(0);
    expect(clampRaoultStep(2.4)).toBe(2);
    expect(clampRaoultStep(2.6)).toBe(3);
    expect(clampRaoultStep(99)).toBe(4);
    expect(clampRaoultStep(Number.NaN)).toBe(0);
    expect(getRaoultStep(10).index).toBe(4);
  });

  it('matches surface site counts to the mole fractions on vessel steps', () => {
    const pure = getRaoultStep(0);
    expect(pure.surfaceSites.filter((s) => s === 'solvent')).toHaveLength(10);
    expect(pure.pTotal).toBeCloseTo(pure.p1Zero, 6);

    const binary = getRaoultStep(1);
    expect(binary.surfaceSites.filter((s) => s === 'solvent')).toHaveLength(5);
    expect(binary.surfaceSites.filter((s) => s === 'volatile')).toHaveLength(5);
    expect(binary.p1 + binary.p2).toBeCloseTo(binary.pTotal, 6);

    const nonVol = getRaoultStep(4);
    expect(nonVol.surfaceSites.filter((s) => s === 'solvent')).toHaveLength(7);
    expect(nonVol.surfaceSites.filter((s) => s === 'nonvolatile')).toHaveLength(3);
    expect(nonVol.p2).toBe(0);
    expect(nonVol.pTotal).toBeCloseTo(nonVol.p1Zero * 0.7, 6);
  });

  it('shows vapour enrichment in the more volatile component on step 2', () => {
    const step2 = getRaoultStep(2);
    expect(step2.mode).toBe('diagram-dalton');
    expect(step2.p2Zero).toBeGreaterThan(step2.p1Zero);
    expect(step2.y2).toBeGreaterThan(step2.x2);
    expect(step2.y1 + step2.y2).toBeCloseTo(1, 10);
  });
});
