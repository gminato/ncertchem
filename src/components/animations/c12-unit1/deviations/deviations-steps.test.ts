import { describe, expect, it } from 'vitest';
import {
  DEVIATION_STEPS,
  clampDeviationStep,
  getDeviationStep,
  getStepAzeotrope,
  getStepMidpointDeviation,
} from './deviations-steps';

describe('DEVIATION_STEPS', () => {
  it('defines exactly 5 sequential steps covering ideal, positive, negative, min- and max-boiling azeotropes', () => {
    expect(DEVIATION_STEPS).toHaveLength(5);
    expect(DEVIATION_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    expect(DEVIATION_STEPS.map((s) => s.id)).toEqual([
      'ideal',
      'positive',
      'negative',
      'min-azeotrope',
      'max-azeotrope',
    ]);
  });

  it('clamps out-of-range step indices safely', () => {
    expect(clampDeviationStep(-3)).toBe(0);
    expect(clampDeviationStep(NaN)).toBe(0);
    expect(clampDeviationStep(99)).toBe(4);
    expect(getDeviationStep(2).id).toBe('negative');
  });

  it('produces zero, positive, and negative midpoint vapour-pressure deviations across steps 0–2', () => {
    expect(getStepMidpointDeviation(DEVIATION_STEPS[0])).toBeCloseTo(0, 8);
    expect(getStepMidpointDeviation(DEVIATION_STEPS[1])).toBeGreaterThan(5);
    expect(getStepMidpointDeviation(DEVIATION_STEPS[2])).toBeLessThan(-5);
  });

  it('has no azeotrope in steps 0–2 and locates accurate azeotropes in steps 3 and 4', () => {
    expect(getStepAzeotrope(DEVIATION_STEPS[0])).toBeNull();
    expect(getStepAzeotrope(DEVIATION_STEPS[1])).toBeNull();
    expect(getStepAzeotrope(DEVIATION_STEPS[2])).toBeNull();

    const minAz = getStepAzeotrope(DEVIATION_STEPS[3]);
    expect(minAz).not.toBeNull();
    expect(minAz!.type).toBe('minimum-boiling');
    expect(minAz!.pTotal).toBeGreaterThan(DEVIATION_STEPS[3].p2Zero);

    const maxAz = getStepAzeotrope(DEVIATION_STEPS[4]);
    expect(maxAz).not.toBeNull();
    expect(maxAz!.type).toBe('maximum-boiling');
    expect(maxAz!.pTotal).toBeLessThan(DEVIATION_STEPS[4].p1Zero);
    // 68% HNO3 by mass corresponds to x2 ≈ 0.38
    expect(maxAz!.x2).toBeGreaterThan(0.32);
    expect(maxAz!.x2).toBeLessThan(0.45);
  });
});
