import { describe, expect, it } from 'vitest';
import {
  MIXTURE_PRESETS,
  findAzeotrope,
  nonIdealVapourPressure,
  sampleVapourCurve,
} from './ideal-nonideal';

describe('nonIdealVapourPressure', () => {
  it('reproduces Raoult’s law exactly when w = 0 (ideal solution)', () => {
    const res = nonIdealVapourPressure({
      p1Zero: 25,
      p2Zero: 69,
      x2: 0.4,
      interactionW: 0,
    });

    expect(res.x1).toBeCloseTo(0.6, 10);
    expect(res.x2).toBeCloseTo(0.4, 10);
    expect(res.gamma1).toBeCloseTo(1, 10);
    expect(res.gamma2).toBeCloseTo(1, 10);
    expect(res.p1Ideal).toBeCloseTo(15, 10);
    expect(res.p2Ideal).toBeCloseTo(27.6, 10);
    expect(res.pTotalIdeal).toBeCloseTo(42.6, 10);
    expect(res.p1).toBeCloseTo(res.p1Ideal, 10);
    expect(res.p2).toBeCloseTo(res.p2Ideal, 10);
    expect(res.pTotal).toBeCloseTo(res.pTotalIdeal, 10);
    expect(res.deviationSign).toBe('ideal');
    expect(res.deltaHMixSign).toBe('zero');
    expect(res.deltaVMixSign).toBe('zero');
  });

  it('gives positive deviation with higher vapour pressure and ΔHmix, ΔVmix > 0 when w > 0', () => {
    const res = nonIdealVapourPressure({
      p1Zero: 36,
      p2Zero: 88,
      x2: 0.5,
      interactionW: 0.8,
    });

    expect(res.gamma1).toBeGreaterThan(1);
    expect(res.gamma2).toBeGreaterThan(1);
    expect(res.p1).toBeGreaterThan(res.p1Ideal);
    expect(res.p2).toBeGreaterThan(res.p2Ideal);
    expect(res.pTotal).toBeGreaterThan(res.pTotalIdeal);
    expect(res.deviationSign).toBe('positive');
    expect(res.deltaHMixSign).toBe('positive');
    expect(res.deltaVMixSign).toBe('positive');
  });

  it('gives negative deviation with lower vapour pressure and ΔHmix, ΔVmix < 0 when w < 0', () => {
    const res = nonIdealVapourPressure({
      p1Zero: 82,
      p2Zero: 96,
      x2: 0.5,
      interactionW: -1.0,
    });

    expect(res.gamma1).toBeLessThan(1);
    expect(res.gamma2).toBeLessThan(1);
    expect(res.p1).toBeLessThan(res.p1Ideal);
    expect(res.p2).toBeLessThan(res.p2Ideal);
    expect(res.pTotal).toBeLessThan(res.pTotalIdeal);
    expect(res.deviationSign).toBe('negative');
    expect(res.deltaHMixSign).toBe('negative');
    expect(res.deltaVMixSign).toBe('negative');
  });

  it('matches pure-component vapour pressures at endpoints x2 = 0 and x2 = 1', () => {
    const pure1 = nonIdealVapourPressure({
      p1Zero: 40,
      p2Zero: 90,
      x2: 0,
      interactionW: 1.4,
    });
    expect(pure1.pTotal).toBeCloseTo(40, 10);
    expect(pure1.p2).toBeCloseTo(0, 10);

    const pure2 = nonIdealVapourPressure({
      p1Zero: 40,
      p2Zero: 90,
      x2: 1,
      interactionW: -1.4,
    });
    expect(pure2.pTotal).toBeCloseTo(90, 10);
    expect(pure2.p1).toBeCloseTo(0, 10);
  });

  it('clamps out-of-range x2 cleanly to [0, 1]', () => {
    const low = nonIdealVapourPressure({
      p1Zero: 30,
      p2Zero: 70,
      x2: -0.2,
      interactionW: 0.5,
    });
    expect(low.x2).toBe(0);
    expect(low.x1).toBe(1);

    const high = nonIdealVapourPressure({
      p1Zero: 30,
      p2Zero: 70,
      x2: 1.5,
      interactionW: 0.5,
    });
    expect(high.x2).toBe(1);
    expect(high.x1).toBe(0);
  });
});

describe('findAzeotrope', () => {
  it('returns null for an ideal solution or small deviation below threshold', () => {
    expect(
      findAzeotrope({ p1Zero: 25, p2Zero: 69, interactionW: 0 }),
    ).toBeNull();
    // ln(88/36) ≈ 0.894; w = 0.75 is positive deviation but too small for an azeotrope
    expect(
      findAzeotrope({ p1Zero: 36, p2Zero: 88, interactionW: 0.75 }),
    ).toBeNull();
  });

  it('locates a minimum-boiling azeotrope (p_total maximum) for large positive deviation', () => {
    const preset = MIXTURE_PRESETS['ethanol-water'];
    const az = findAzeotrope({
      p1Zero: preset.p1Zero,
      p2Zero: preset.p2Zero,
      interactionW: preset.interactionW,
    });

    expect(az).not.toBeNull();
    expect(az!.type).toBe('minimum-boiling');
    expect(az!.x2).toBeGreaterThan(0.8);
    expect(az!.x2).toBeLessThan(0.95);
    expect(az!.pTotal).toBeGreaterThan(Math.max(preset.p1Zero, preset.p2Zero));

    // Vapour composition equals liquid composition at the azeotrope
    const atAz = nonIdealVapourPressure({
      p1Zero: preset.p1Zero,
      p2Zero: preset.p2Zero,
      x2: az!.x2,
      interactionW: preset.interactionW,
    });
    expect(atAz.y2).toBeCloseTo(atAz.x2, 8);
  });

  it('locates a maximum-boiling azeotrope (p_total minimum) for large negative deviation', () => {
    const preset = MIXTURE_PRESETS['nitric-acid-water'];
    const az = findAzeotrope({
      p1Zero: preset.p1Zero,
      p2Zero: preset.p2Zero,
      interactionW: preset.interactionW,
    });

    expect(az).not.toBeNull();
    expect(az!.type).toBe('maximum-boiling');
    // 68% HNO3 by mass corresponds to x2 ≈ 0.38
    expect(az!.x2).toBeGreaterThan(0.32);
    expect(az!.x2).toBeLessThan(0.45);
    expect(az!.pTotal).toBeLessThan(Math.min(preset.p1Zero, preset.p2Zero));

    const atAz = nonIdealVapourPressure({
      p1Zero: preset.p1Zero,
      p2Zero: preset.p2Zero,
      x2: az!.x2,
      interactionW: preset.interactionW,
    });
    expect(atAz.y2).toBeCloseTo(atAz.x2, 8);
  });

  it('places chloroform + acetone preset in maximum-boiling azeotrope regime', () => {
    const preset = MIXTURE_PRESETS['chloroform-acetone'];
    const az = findAzeotrope({
      p1Zero: preset.p1Zero,
      p2Zero: preset.p2Zero,
      interactionW: preset.interactionW,
    });

    expect(az).not.toBeNull();
    expect(az!.type).toBe('maximum-boiling');
    expect(az!.pTotal).toBeLessThan(preset.p1Zero);
  });
});

describe('sampleVapourCurve & NCERT presets', () => {
  it('samples endpoints accurately and exposes all five NCERT presets', () => {
    const pts = sampleVapourCurve(30, 70, 0.9, 20);
    expect(pts).toHaveLength(21);
    expect(pts[0].x2).toBe(0);
    expect(pts[pts.length - 1].x2).toBe(1);

    expect(MIXTURE_PRESETS['hexane-heptane'].deviationSign).toBe('ideal');
    expect(MIXTURE_PRESETS['ethanol-acetone'].deviationSign).toBe('positive');
    expect(MIXTURE_PRESETS['ethanol-water'].deviationSign).toBe('positive');
    expect(MIXTURE_PRESETS['chloroform-acetone'].deviationSign).toBe('negative');
    expect(MIXTURE_PRESETS['nitric-acid-water'].deviationSign).toBe('negative');
  });
});
