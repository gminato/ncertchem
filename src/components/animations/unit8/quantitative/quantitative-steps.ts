import {
  ANALYSIS_CONDITIONS,
  carbonFromReadings,
  combustionReadings,
  compositionOf,
  dumasReadings,
  hydrogenFromReadings,
  kjeldahlReadings,
  nitrogenDumasFromReadings,
  nitrogenKjeldahlFromReadings,
  percentFromPrecipitate,
  precipitateReading,
  sampleFromSmiles,
  type CombustionReadings,
  type DumasReadings,
  type KjeldahlReadings,
  type PrecipitateReading,
} from '@/lib/chem/elemental-analysis'

/** The worked sample of Section 8.10: 4-chloroaniline, weighed as 0.2500 g. */
export const EXAMPLE = sampleFromSmiles('chloroaniline', 'NC1=CC=C(Cl)C=C1')
export const EXAMPLE_MASS = 0.25

const comp = compositionOf(EXAMPLE.formula)

/** The four readings the apparatus shows for the worked sample, from the lib. */
export const EXAMPLE_READINGS: {
  combustion: CombustionReadings
  dumas: DumasReadings
  kjeldahl: KjeldahlReadings
  carius: PrecipitateReading
} = {
  combustion: combustionReadings(comp, EXAMPLE_MASS),
  dumas: dumasReadings(comp, EXAMPLE_MASS),
  kjeldahl: kjeldahlReadings(comp, EXAMPLE_MASS),
  carius: precipitateReading(comp, EXAMPLE_MASS, 'halogen', 'Cl'),
}

/** Percentages the four analyses give from those readings (2 dp, as printed). */
export function examplePercentages() {
  const r = EXAMPLE_READINGS
  return {
    C: carbonFromReadings(r.combustion).toFixed(2),
    H: hydrogenFromReadings(r.combustion).toFixed(2),
    NDumas: nitrogenDumasFromReadings(r.dumas).toFixed(2),
    NKjeldahl: nitrogenKjeldahlFromReadings(r.kjeldahl).toFixed(2),
    Cl: percentFromPrecipitate(r.carius).toFixed(2),
  }
}

/** Dumas nitrogen pressure p₁ = p − aqueous tension, mmHg, to 1 dp. */
export function dumasPressure(): string {
  const { pressureMmHg, aqueousTensionMmHg } = ANALYSIS_CONDITIONS
  return (pressureMmHg - aqueousTensionMmHg).toFixed(1)
}

/** One Scrolly Step's target state for the apparatus, in the units each drawing takes. */
export interface AnalysisStepTarget {
  /** Short heading for the Step. */
  title: string
  /** 0 to 1 for the combustion train and the Carius tube. */
  progress: number
  /** Fraction of the nitrometer's 30 mL scale that the nitrogen fills. */
  volumeFraction: number
  /** Burette delivery in mL for the Kjeldahl titration. */
  titrantMl: number
  endPoint: boolean
}

/** The four Steps. Each Step's target is complete; the component tweens to it from zero. */
export function analysisStepTargets(): AnalysisStepTarget[] {
  const r = EXAMPLE_READINGS
  return [
    { title: 'Combustion', progress: 1, volumeFraction: 0, titrantMl: 0, endPoint: false },
    { title: 'Nitrogen by Dumas', progress: 0, volumeFraction: r.dumas.volumeMl / 30, titrantMl: 0, endPoint: false },
    { title: 'Nitrogen by Kjeldahl', progress: 0, volumeFraction: 0, titrantMl: r.kjeldahl.alkaliMl, endPoint: true },
    { title: 'Halogen by Carius', progress: 1, volumeFraction: 0, titrantMl: 0, endPoint: false },
  ]
}

/** Readout lines for each Step, with the NCERT formula and the numbers from the lib. */
export function analysisReadouts(): string[][] {
  const r = EXAMPLE_READINGS
  const p = examplePercentages()
  const vSTP = (r.dumas.volumeMl * 273 * (760 - 26.7)) / (760 * r.dumas.temperatureK)
  const xTitre = r.kjeldahl.acidMl - r.kjeldahl.alkaliMl / 2
  return [
    [
      `CO₂ absorbed in KOH: ${r.combustion.massCO2.toFixed(4)} g`,
      `H₂O absorbed in CaCl₂: ${r.combustion.massH2O.toFixed(4)} g`,
      `%C = 12 × ${r.combustion.massCO2.toFixed(4)} × 100 / (44 × ${EXAMPLE_MASS.toFixed(4)}) = ${p.C}`,
    ],
    [
      `p₁ = 760 − 26.7 = ${dumasPressure()} mmHg`,
      `V = ${r.dumas.volumeMl.toFixed(1)} mL at 300 K, V(STP) = ${vSTP.toFixed(2)} mL`,
      `%N = 28 × ${vSTP.toFixed(2)} × 100 / (22400 × ${EXAMPLE_MASS.toFixed(4)}) = ${p.NDumas}`,
    ],
    [
      `Acid taken V = ${r.kjeldahl.acidMl.toFixed(2)} mL, alkali V₁ = ${r.kjeldahl.alkaliMl.toFixed(2)} mL`,
      `V − V₁/2 = ${xTitre.toFixed(2)} mL, so %N = 1.4 × 0.1 × 2 × ${xTitre.toFixed(2)} / ${EXAMPLE_MASS.toFixed(4)} = ${p.NKjeldahl}`,
    ],
    [
      `AgCl weighed: ${r.carius.mass.toFixed(4)} g`,
      `%Cl = 35.5 × ${r.carius.mass.toFixed(4)} × 100`,
      `÷ (143.5 × ${EXAMPLE_MASS.toFixed(4)})`,
      `= ${p.Cl}`,
    ],
  ]
}
