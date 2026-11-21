import { describe, expect, it } from 'vitest';
import {
  getLiquidPairPreset,
  LIQUID_PAIR_PRESETS,
  moreVolatileComponent,
  NON_VOLATILE_WATER_PRESET,
  raoultBinary,
  raoultNonVolatile,
} from './raoult-law';

describe('raoultBinary', () => {
  it('computes pure endpoints accurately (x2 = 0 and x2 = 1)', () => {
    const pure1 = raoultBinary({ p1Zero: 200, p2Zero: 415, x2: 0 });
    expect(pure1.x1).toBeCloseTo(1, 10);
    expect(pure1.p1).toBeCloseTo(200, 10);
    expect(pure1.p2).toBeCloseTo(0, 10);
    expect(pure1.pTotal).toBeCloseTo(200, 10);
    expect(pure1.y1).toBeCloseTo(1, 10);
    expect(pure1.y2).toBeCloseTo(0, 10);

    const pure2 = raoultBinary({ p1Zero: 200, p2Zero: 415, x2: 1 });
    expect(pure2.x1).toBeCloseTo(0, 10);
    expect(pure2.p1).toBeCloseTo(0, 10);
    expect(pure2.p2).toBeCloseTo(415, 10);
    expect(pure2.pTotal).toBeCloseTo(415, 10);
    expect(pure2.y1).toBeCloseTo(0, 10);
    expect(pure2.y2).toBeCloseTo(1, 10);
  });

  it('satisfies linear total pressure and Dalton mole-fraction sum across mixtures', () => {
    const res = raoultBinary({ p1Zero: 120, p2Zero: 320, x2: 0.4 });
    expect(res.x1).toBeCloseTo(0.6, 10);
    expect(res.p1).toBeCloseTo(72, 10);
    expect(res.p2).toBeCloseTo(128, 10);
    expect(res.pTotal).toBeCloseTo(200, 10);
    expect(res.p1 + res.p2).toBeCloseTo(res.pTotal, 10);
    expect(res.y1).toBeCloseTo(0.36, 10);
    expect(res.y2).toBeCloseTo(0.64, 10);
    expect(res.y1 + res.y2).toBeCloseTo(1, 10);
  });

  it('always enriches the vapour in the more volatile component for all interior compositions', () => {
    const fractions = [0.05, 0.2, 0.5, 0.75, 0.95];

    for (const preset of LIQUID_PAIR_PRESETS) {
      const winner = moreVolatileComponent(preset.p1Zero, preset.p2Zero);
      expect(winner).not.toBe('equal');

      for (const x2 of fractions) {
        const res = raoultBinary({
          p1Zero: preset.p1Zero,
          p2Zero: preset.p2Zero,
          x2,
        });

        expect(res.y1 + res.y2).toBeCloseTo(1, 10);
        if (winner === 2) {
          expect(res.y2).toBeGreaterThan(res.x2);
          expect(res.y1).toBeLessThan(res.x1);
        } else {
          expect(res.y1).toBeGreaterThan(res.x1);
          expect(res.y2).toBeLessThan(res.x2);
        }
      }
    }
  });

  it('gives equal liquid and vapour fractions when both pure vapour pressures match', () => {
    const res = raoultBinary({ p1Zero: 180, p2Zero: 180, x2: 0.35 });
    expect(moreVolatileComponent(180, 180)).toBe('equal');
    expect(res.pTotal).toBeCloseTo(180, 10);
    expect(res.y2).toBeCloseTo(0.35, 10);
    expect(res.y1).toBeCloseTo(0.65, 10);
  });

  it('handles zero total vapour pressure without NaN', () => {
    const res = raoultBinary({ p1Zero: 0, p2Zero: 0, x2: 0.5 });
    expect(res.pTotal).toBe(0);
    expect(res.y1).toBe(0);
    expect(res.y2).toBe(0);
  });

  it('throws RangeError for invalid inputs', () => {
    expect(() => raoultBinary({ p1Zero: -5, p2Zero: 100, x2: 0.5 })).toThrow(RangeError);
    expect(() => raoultBinary({ p1Zero: 100, p2Zero: -1, x2: 0.5 })).toThrow(RangeError);
    expect(() => raoultBinary({ p1Zero: 100, p2Zero: 200, x2: -0.01 })).toThrow(RangeError);
    expect(() => raoultBinary({ p1Zero: 100, p2Zero: 200, x2: 1.05 })).toThrow(RangeError);
  });
});

describe('raoultNonVolatile', () => {
  it('computes lowered vapour pressure and relative lowering equal to solute mole fraction', () => {
    const res = raoultNonVolatile({ p1Zero: 23.8, xSolute: 0.2 });
    expect(res.xSolvent).toBeCloseTo(0.8, 10);
    expect(res.pSolution).toBeCloseTo(19.04, 10);
    expect(res.lowering).toBeCloseTo(4.76, 10);
    expect(res.relativeLowering).toBeCloseTo(0.2, 10);
    expect(res.lowering / 23.8).toBeCloseTo(res.relativeLowering, 10);
  });

  it('matches pure solvent at xSolute = 0 and zero pressure at xSolute = 1', () => {
    const pure = raoultNonVolatile({
      p1Zero: NON_VOLATILE_WATER_PRESET.p1Zero,
      xSolute: 0,
    });
    expect(pure.pSolution).toBeCloseTo(NON_VOLATILE_WATER_PRESET.p1Zero, 10);
    expect(pure.lowering).toBeCloseTo(0, 10);

    const dry = raoultNonVolatile({
      p1Zero: NON_VOLATILE_WATER_PRESET.p1Zero,
      xSolute: 1,
    });
    expect(dry.pSolution).toBeCloseTo(0, 10);
    expect(dry.lowering).toBeCloseTo(NON_VOLATILE_WATER_PRESET.p1Zero, 10);
  });

  it('rejects out-of-range solute mole fractions or negative pressures', () => {
    expect(() => raoultNonVolatile({ p1Zero: -10, xSolute: 0.1 })).toThrow(RangeError);
    expect(() => raoultNonVolatile({ p1Zero: 25, xSolute: -0.1 })).toThrow(RangeError);
    expect(() => raoultNonVolatile({ p1Zero: 25, xSolute: 1.2 })).toThrow(RangeError);
  });
});

describe('presets', () => {
  it('returns the expected three binary presets', () => {
    expect(LIQUID_PAIR_PRESETS).toHaveLength(3);
    expect(getLiquidPairPreset('chloroform-dcm').p2Zero).toBe(415);
    expect(getLiquidPairPreset('benzene-toluene').p1Zero).toBe(95);
    expect(getLiquidPairPreset('heptane-octane').unit).toBe('kPa');
  });
});
