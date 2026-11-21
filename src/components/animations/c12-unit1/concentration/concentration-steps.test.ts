import { describe, expect, it } from 'vitest';
import {
  CONCENTRATION_STEPS,
  CONCENTRATION_STEP_COUNT,
  clampConcentrationStep,
  getConcentrationStep,
  heatedMolarity,
} from './concentration-steps';

describe('concentration-steps', () => {
  it('defines exactly 5 ordered steps with non-empty metadata', () => {
    expect(CONCENTRATION_STEP_COUNT).toBe(5);
    CONCENTRATION_STEPS.forEach((meta, i) => {
      expect(meta.index).toBe(i);
      expect(meta.title.length).toBeGreaterThan(5);
      expect(meta.takeaway.length).toBeGreaterThan(10);
      expect(meta.ariaLabel.length).toBeGreaterThan(20);
    });
  });

  it('clamps out-of-range and non-finite step inputs safely', () => {
    expect(clampConcentrationStep(-5)).toBe(0);
    expect(clampConcentrationStep(0)).toBe(0);
    expect(clampConcentrationStep(4)).toBe(4);
    expect(clampConcentrationStep(99)).toBe(4);
    expect(clampConcentrationStep(Number.NaN)).toBe(0);
    expect(getConcentrationStep(2).index).toBe(2);
    expect(getConcentrationStep(10).index).toBe(4);
  });

  it('models apparent molarity decreasing smoothly upon heating', () => {
    const m20 = heatedMolarity(20);
    const m50 = heatedMolarity(50);
    const m80 = heatedMolarity(80);
    expect(m20).toBeCloseTo(1.0, 6);
    expect(m50).toBeLessThan(m20);
    expect(m80).toBeLessThan(m50);
    expect(m80).toBeCloseTo(1 / (1 + 0.000257 * 60), 6);
  });
});
