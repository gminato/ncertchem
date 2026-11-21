import { describe, expect, it } from 'vitest';
import {
  CONVERTER_PRESET_IDS,
  SOLUTE_PRESETS,
  WATER_THERMAL_EXPANSION_PER_K,
  convertAllMeasures,
  estimateAqueousDensity25,
  massByVolumePercent,
  massPercent,
  molalityFromMass,
  molarityFromMass,
  moleFractions,
  partsPerMillion,
  volumePercent,
} from './concentration-units';

describe('concentration-units', () => {
  it('computes mass %, volume %, mass-by-volume %, and ppm accurately', () => {
    expect(massPercent(15, 150)).toBeCloseTo(10, 6);
    expect(massPercent(0, 100)).toBe(0);
    expect(volumePercent(35, 100)).toBeCloseTo(35, 6);
    expect(massByVolumePercent(0.9, 100)).toBeCloseTo(0.9, 6);
    expect(partsPerMillion(6e-3, 1030)).toBeCloseTo(5.82524, 4);
  });

  it('computes mole fractions that sum to unity for binary and multi-component mixtures', () => {
    const binary = moleFractions([0.5, 4.5]);
    expect(binary[0]).toBeCloseTo(0.1, 6);
    expect(binary[1]).toBeCloseTo(0.9, 6);
    expect(binary[0] + binary[1]).toBeCloseTo(1, 10);

    const ternary = moleFractions([1.2, 2.8, 4.0]);
    expect(ternary.reduce((acc, x) => acc + x, 0)).toBeCloseTo(1, 10);
    expect(ternary[2]).toBeCloseTo(0.5, 6);
  });

  it('computes molarity and molality from solute mass and molar mass', () => {
    // 10 g NaOH (M = 40 g mol^-1) = 0.25 mol in 0.5 L -> 0.50 M
    expect(molarityFromMass(10, 40, 0.5)).toBeCloseTo(0.5, 6);
    // 30 g urea (M = 60 g mol^-1) = 0.50 mol in 0.25 kg water -> 2.0 m
    expect(molalityFromMass(30, 60, 0.25)).toBeCloseTo(2.0, 6);
  });

  it('converts all measures consistently at 25 °C', () => {
    // 20 g ethylene glycol (62.07) + 80 g water (18.015), density 1.024 g mL^-1
    const res = convertAllMeasures({
      soluteMassG: 20,
      solventMassG: 80,
      soluteMolarMass: 62.07,
      densityGPerMl: 1.024,
      tempC: 25,
    });

    expect(res.massPercent).toBeCloseTo(20, 6);
    expect(res.ppm).toBeCloseTo(200_000, 3);
    expect(res.moleFractionSolute + res.moleFractionSolvent).toBeCloseTo(1, 10);
    expect(res.moleFractionSolute).toBeCloseTo(0.06765, 4);
    expect(res.molality).toBeCloseTo(20 / 62.07 / 0.08, 6);
    expect(res.molarity).toBeCloseTo(res.molarityAt25, 10);
    expect(res.volumeAtTempMl).toBeCloseTo(100 / 1.024, 6);
    expect(res.massByVolumePercent).toBeCloseTo(20 * 1.024, 6);
  });

  it('keeps mass %, ppm, mole fraction, and molality strictly invariant while molarity drops upon heating', () => {
    const cold = convertAllMeasures({
      soluteMassG: 30,
      solventMassG: 250,
      soluteMolarMass: 60.06,
      densityGPerMl: 1.03,
      tempC: 10,
    });
    const hot = convertAllMeasures({
      soluteMassG: 30,
      solventMassG: 250,
      soluteMolarMass: 60.06,
      densityGPerMl: 1.03,
      tempC: 80,
    });

    // Temperature-independent scales stay identical
    expect(hot.massPercent).toBeCloseTo(cold.massPercent, 12);
    expect(hot.ppm).toBeCloseTo(cold.ppm, 12);
    expect(hot.moleFractionSolute).toBeCloseTo(cold.moleFractionSolute, 12);
    expect(hot.moleFractionSolvent).toBeCloseTo(cold.moleFractionSolvent, 12);
    expect(hot.molality).toBeCloseTo(cold.molality, 12);

    // Volume expands upon heating -> molarity and w/V % strictly decrease
    expect(hot.volumeAtTempMl).toBeGreaterThan(cold.volumeAtTempMl);
    expect(hot.densityAtTempGPerMl).toBeLessThan(cold.densityAtTempGPerMl);
    expect(hot.molarity).toBeLessThan(cold.molarity);
    expect(hot.massByVolumePercent).toBeLessThan(cold.massByVolumePercent);

    // Check exact thermal expansion ratio
    const expectedRatio =
      (1 + WATER_THERMAL_EXPANSION_PER_K * (10 - 25)) /
      (1 + WATER_THERMAL_EXPANSION_PER_K * (80 - 25));
    expect(hot.molarity / cold.molarity).toBeCloseTo(expectedRatio, 10);
  });

  it('provides valid solute presets and realistic estimated aqueous densities', () => {
    for (const id of CONVERTER_PRESET_IDS) {
      const preset = SOLUTE_PRESETS[id];
      expect(preset.molarMassGPerMol).toBeGreaterThan(0);
      const rho = estimateAqueousDensity25(
        preset.defaultSoluteMassG,
        preset.defaultSolventMassG,
        preset.apparentDensityGPerMl,
      );
      expect(rho).toBeGreaterThan(0.85);
      expect(rho).toBeLessThan(1.3);
    }
    expect(SOLUTE_PRESETS['ethylene-glycol'].molarMassGPerMol).toBeCloseTo(62.07, 2);
    expect(SOLUTE_PRESETS.ki.molarMassGPerMol).toBeCloseTo(166.0, 2);
  });

  it('rejects invalid non-positive denominators or negative masses', () => {
    expect(() => massPercent(-1, 100)).toThrow(RangeError);
    expect(() => massPercent(10, 0)).toThrow(RangeError);
    expect(() => volumePercent(5, 0)).toThrow(RangeError);
    expect(() => massByVolumePercent(5, -10)).toThrow(RangeError);
    expect(() => partsPerMillion(1, 0)).toThrow(RangeError);
    expect(() => moleFractions([])).toThrow(RangeError);
    expect(() => moleFractions([0, 0])).toThrow(RangeError);
    expect(() => molarityFromMass(5, 40, 0)).toThrow(RangeError);
    expect(() => molalityFromMass(5, 0, 1)).toThrow(RangeError);
  });
});
