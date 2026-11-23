/**
 * Pure chemistry model and formatting helpers for Class 12 Unit 7, Section 7.3
 * ("Structures of Functional Groups"). Every bond length, angle and tetrahedral
 * reference is imported directly from `ncert-c12-unit7-data.ts`.
 */

import {
  NCERT_FIG_7_1_STRUCTURES,
  TETRAHEDRAL_ANGLE,
  type FunctionalGroupGeometry,
} from './ncert-c12-unit7-data'

export type MoleculeId = FunctionalGroupGeometry['id']

export const MOLECULE_ORDER: readonly MoleculeId[] = [
  'methanol',
  'phenol',
  'methoxymethane',
] as const

export interface GeometryReadout {
  record: FunctionalGroupGeometry
  sCharacterPercent: string
  ohBondDisplay: string
  angleDisplay: string
  deviationDeg: number
  deviationDisplay: string
  mechanismTag: string
  mechanismDetail: string
}

/** Look up one of the three NCERT Fig. 7.1 records by molecule ID. */
export function geometryRecord(id: MoleculeId): FunctionalGroupGeometry {
  const row = NCERT_FIG_7_1_STRUCTURES.find((entry) => entry.id === id)
  if (!row) {
    throw new RangeError(`No Fig. 7.1 geometry record for ${id}`)
  }
  return row
}

/** Exact signed difference (in degrees) from the ideal tetrahedral angle 109°28′. */
export function tetrahedralDeviationDeg(angleDeg: number): number {
  return angleDeg - TETRAHEDRAL_ANGLE.deg
}

/** Format a signed angular deviation using a true minus sign (U+2212). */
export function formatSignedDeviation(deltaDeg: number): string {
  const abs = Math.abs(deltaDeg).toFixed(2)
  const sign = deltaDeg >= 0 ? '+' : '−'
  return `${sign}${abs}°`
}

/** Format O–H bond length faithfully without inventing unprinted NCERT values. */
export function formatOhBondLength(record: FunctionalGroupGeometry): string {
  if (record.ohBondLengthPm !== null) return `${record.ohBondLengthPm} pm`
  if (record.id === 'phenol') return 'Not printed in Fig. 7.1'
  return 'N/A'
}

/** Format bond angle exactly as printed in NCERT Fig. 7.1 (108.9°, 109°, 111.7°). */
export function formatBondAngle(angleDeg: number): string {
  return Number.isInteger(angleDeg) ? `${angleDeg}°` : `${angleDeg.toFixed(1)}°`
}

/** s-character percentage of the attached carbon hybrid orbital. */
export function sCharacterLabel(hybridisation: FunctionalGroupGeometry['carbonHybridisation']): string {
  return hybridisation === 'sp²' ? '33.3% s-character' : '25% s-character'
}

/** Build the complete UI and accessibility readout for the active molecule. */
export function buildGeometryReadout(id: MoleculeId): GeometryReadout {
  const record = geometryRecord(id)
  const deviationDeg = tetrahedralDeviationDeg(record.bondAngleDeg)
  const mechanismById: Record<MoleculeId, { tag: string; detail: string }> = {
    methanol: {
      tag: 'sp³–sp³ σ overlap & lone-pair compression',
      detail: 'Two oxygen lone pairs repel strongly and compress C–O–H slightly below 109°28′.',
    },
    phenol: {
      tag: 'Lone-pair π conjugation & sp² contraction',
      detail: 'Partial C=O double-bond character plus 33.3% s-character sp² C shortens C–O by 6 pm.',
    },
    methoxymethane: {
      tag: 'Bulky –CH₃ steric repulsion opens C–O–C',
      detail: 'Repulsion between two –CH₃ groups widens C–O–C past 109°28′, while C–O stays 141 pm.',
    },
  }
  const mech = mechanismById[id]

  return {
    record,
    sCharacterPercent: sCharacterLabel(record.carbonHybridisation),
    ohBondDisplay: formatOhBondLength(record),
    angleDisplay: formatBondAngle(record.bondAngleDeg),
    deviationDeg,
    deviationDisplay: formatSignedDeviation(deviationDeg),
    mechanismTag: mech.tag,
    mechanismDetail: mech.detail,
  }
}

/** Concise aria-live summary announcing all live values when the learner switches molecules. */
export function geometrySummary(id: MoleculeId): string {
  const r = buildGeometryReadout(id)
  return (
    `${r.record.name} (${r.record.unicode}): carbon ${r.record.carbonHybridisation} (${r.sCharacterPercent}), ` +
    `C–O bond ${r.record.coBondLengthPm} pm, O–H bond ${r.ohBondDisplay}, ` +
    `${r.record.bondAngleLabel} angle ${r.angleDisplay} (${r.deviationDisplay} vs ${TETRAHEDRAL_ANGLE.printed}).`
  )
}

/** Difference in C–O bond length (pm) between methanol and phenol. */
export function methanolPhenolBondDiffPm(): number {
  return geometryRecord('methanol').coBondLengthPm - geometryRecord('phenol').coBondLengthPm
}
