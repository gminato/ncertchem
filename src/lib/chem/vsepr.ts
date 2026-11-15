/**
 * VSEPR geometry for NCERT Class 11 Unit 4, Section 4.4 (Tables 4.6, 4.7 and 4.8). Given the
 * bonding pairs and lone pairs on a central atom, it returns the electron-pair geometry, the
 * molecular shape, the ideal angles, and the angle NCERT states where it states one.
 *
 * Domains are placed as unit vectors around the central atom. A multiple bond counts as one
 * domain (NCERT's postulate on multiple bonds), so the domain count is the number of atoms
 * bonded plus the lone pairs. Lone pairs take the positions that minimise lone pair repulsion:
 * equatorial in a trigonal bipyramid, and trans to each other in an octahedron with two lone
 * pairs.
 *
 * Only the combinations NCERT tabulates are supported. Others throw RangeError.
 */

/** A 3D unit vector as [x, y, z]. */
export type Vec3 = readonly [number, number, number]

/** The VSEPR classification of one central atom. */
export interface VseprClass {
  /** AB-notation, e.g. "AB2E2" (the NCERT Table 4.7 and 4.8 notation). */
  notation: string
  /** Arrangement of all electron pairs (bonding and lone), as in Table 4.6 and 4.7. */
  electronGeometry: string
  /** Shape of the atoms only (the molecular geometry). */
  molecularShape: string
  /** Ideal angles between domains in the arrangement, in degrees. */
  idealAngles: readonly number[]
  /** The angle NCERT states for this shape in Table 4.8, in degrees, or null if not stated. */
  reportedAngle: number | null
}

/** Unit vectors for the bonding and lone-pair domains of a central atom. */
export interface VseprPositions {
  bonds: Vec3[]
  lonePairs: Vec3[]
}

const SQRT3 = Math.sqrt(3)

const CLASSES: Readonly<Record<string, VseprClass>> = {
  '2,0': {
    notation: 'AB2', electronGeometry: 'Linear', molecularShape: 'Linear', idealAngles: [180], reportedAngle: null,
  },
  '3,0': {
    notation: 'AB3', electronGeometry: 'Trigonal planar', molecularShape: 'Trigonal planar', idealAngles: [120], reportedAngle: null,
  },
  '4,0': {
    notation: 'AB4', electronGeometry: 'Tetrahedral', molecularShape: 'Tetrahedral', idealAngles: [109.5], reportedAngle: null,
  },
  '5,0': {
    notation: 'AB5', electronGeometry: 'Trigonal bipyramidal', molecularShape: 'Trigonal bipyramidal', idealAngles: [90, 120], reportedAngle: null,
  },
  '6,0': {
    notation: 'AB6', electronGeometry: 'Octahedral', molecularShape: 'Octahedral', idealAngles: [90], reportedAngle: null,
  },
  '2,1': {
    notation: 'AB2E', electronGeometry: 'Trigonal planar', molecularShape: 'Bent', idealAngles: [120], reportedAngle: 119.5,
  },
  '3,1': {
    notation: 'AB3E', electronGeometry: 'Tetrahedral', molecularShape: 'Trigonal pyramidal', idealAngles: [109.5], reportedAngle: 107,
  },
  '2,2': {
    notation: 'AB2E2', electronGeometry: 'Tetrahedral', molecularShape: 'Bent', idealAngles: [109.5], reportedAngle: 104.5,
  },
  '4,1': {
    notation: 'AB4E', electronGeometry: 'Trigonal bipyramidal', molecularShape: 'See-saw', idealAngles: [90, 120], reportedAngle: null,
  },
  '3,2': {
    notation: 'AB3E2', electronGeometry: 'Trigonal bipyramidal', molecularShape: 'T-shape', idealAngles: [90], reportedAngle: null,
  },
  '5,1': {
    notation: 'AB5E', electronGeometry: 'Octahedral', molecularShape: 'Square pyramid', idealAngles: [90], reportedAngle: null,
  },
  '4,2': {
    notation: 'AB4E2', electronGeometry: 'Octahedral', molecularShape: 'Square planar', idealAngles: [90], reportedAngle: null,
  },
}

function classKey(bondPairs: number, lonePairs: number): string {
  for (const [name, value] of [['bondPairs', bondPairs], ['lonePairs', lonePairs]] as const) {
    if (!Number.isInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative integer (received ${value})`)
  }
  const key = `${bondPairs},${lonePairs}`
  if (!CLASSES[key]) throw new RangeError(`VSEPR class with ${bondPairs} bonding pairs and ${lonePairs} lone pairs is not in NCERT Tables 4.6 to 4.8`)
  return key
}

/**
 * VSEPR classification for a central atom with the given bonding and lone pairs.
 *
 * @throws {RangeError} If the combination is not in NCERT Tables 4.6 to 4.8
 */
export function vseprClass(bondPairs: number, lonePairs: number): VseprClass {
  return CLASSES[classKey(bondPairs, lonePairs)]
}

const TETRAHEDRAL: readonly Vec3[] = [
  [1 / SQRT3, 1 / SQRT3, 1 / SQRT3],
  [1 / SQRT3, -1 / SQRT3, -1 / SQRT3],
  [-1 / SQRT3, 1 / SQRT3, -1 / SQRT3],
  [-1 / SQRT3, -1 / SQRT3, 1 / SQRT3],
]

/** Equatorial directions of a trigonal bipyramid, in the xy plane at 0°, 120° and 240°. */
const EQUATORIAL: readonly Vec3[] = [
  [1, 0, 0],
  [-0.5, SQRT3 / 2, 0],
  [-0.5, -SQRT3 / 2, 0],
]

const OCTAHEDRAL: readonly Vec3[] = [
  [0, 0, 1],
  [0, 0, -1],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
]

/** Splits a list of domain directions into lone-pair directions (first `lonePairs`) and bonds. */
function split(domains: readonly Vec3[], lonePairIndices: readonly number[]): VseprPositions {
  const lonePairs = lonePairIndices.map((i) => domains[i])
  const bonds = domains.filter((_d, i) => !lonePairIndices.includes(i))
  return { bonds: [...bonds], lonePairs: [...lonePairs] }
}

/**
 * Unit vectors for each bonding pair and lone pair of a central atom. The orientation is
 * fixed so tests and drawings can rely on it: linear along z; trigonal planar in the xy plane;
 * tetrahedral on the cube vertices; trigonal bipyramid with axial z and equatorial xy with
 * lone pairs equatorial; octahedral on the axes with lone pairs trans.
 *
 * @throws {RangeError} If the combination is not in NCERT Tables 4.6 to 4.8
 */
export function vseprPositions(bondPairs: number, lonePairs: number): VseprPositions {
  const key = classKey(bondPairs, lonePairs)
  switch (key) {
    case '2,0':
      return { bonds: [[0, 0, 1], [0, 0, -1]], lonePairs: [] }
    case '3,0':
      return { bonds: trigonalPlanar([90, 210, 330]), lonePairs: [] }
    case '4,0':
      return { bonds: [...TETRAHEDRAL], lonePairs: [] }
    case '5,0':
      return { bonds: [...EQUATORIAL, [0, 0, 1], [0, 0, -1]], lonePairs: [] }
    case '6,0':
      return { bonds: [...OCTAHEDRAL], lonePairs: [] }
    case '2,1':
      // Lone pair at 90°, bonds at 210° and 330°.
      return { bonds: trigonalPlanar([210, 330]), lonePairs: trigonalPlanar([90]) }
    case '3,1':
      return split(TETRAHEDRAL, [0])
    case '2,2':
      return split(TETRAHEDRAL, [0, 1])
    case '4,1': {
      // Equatorial directions come first, so the lone pair takes an equatorial slot.
      const domains: Vec3[] = [...EQUATORIAL, [0, 0, 1], [0, 0, -1]]
      return split(domains, [0])
    }
    case '3,2': {
      const domains: Vec3[] = [...EQUATORIAL, [0, 0, 1], [0, 0, -1]]
      return split(domains, [0, 1])
    }
    case '5,1':
      return split(OCTAHEDRAL, [0])
    case '4,2':
      return split(OCTAHEDRAL, [0, 1])
    default:
      throw new RangeError(`No geometry for ${key}`)
  }
}

/** Unit vectors in the xy plane at the given angles in degrees. */
function trigonalPlanar(anglesDeg: readonly number[]): Vec3[] {
  return anglesDeg.map((deg) => {
    const rad = (deg * Math.PI) / 180
    return [Math.round(Math.cos(rad) * 1e12) / 1e12, Math.round(Math.sin(rad) * 1e12) / 1e12, 0] as const
  })
}

/** Species NCERT names in Tables 4.6 to 4.8, with their bonding and lone pair counts. */
export const NCERT_SPECIES_DOMAINS: Readonly<Record<string, { bondPairs: number; lonePairs: number }>> = {
  BeCl2: { bondPairs: 2, lonePairs: 0 },
  HgCl2: { bondPairs: 2, lonePairs: 0 },
  BF3: { bondPairs: 3, lonePairs: 0 },
  CH4: { bondPairs: 4, lonePairs: 0 },
  'NH4⁺': { bondPairs: 4, lonePairs: 0 },
  PCl5: { bondPairs: 5, lonePairs: 0 },
  SF6: { bondPairs: 6, lonePairs: 0 },
  SO2: { bondPairs: 2, lonePairs: 1 },
  NH3: { bondPairs: 3, lonePairs: 1 },
  H2O: { bondPairs: 2, lonePairs: 2 },
  SF4: { bondPairs: 4, lonePairs: 1 },
  ClF3: { bondPairs: 3, lonePairs: 2 },
  BrF5: { bondPairs: 5, lonePairs: 1 },
  XeF4: { bondPairs: 4, lonePairs: 2 },
}

/** A predicted shape for a named species: its domain counts and its VSEPR classification. */
export interface PredictedShape extends VseprClass {
  species: string
  bondPairs: number
  lonePairs: number
}

/**
 * Predicted shape of one of the species NCERT names in Tables 4.6 to 4.8.
 *
 * @throws {RangeError} If the species is not one of those in NCERT_SPECIES_DOMAINS
 */
export function predictShape(species: string): PredictedShape {
  const domains = NCERT_SPECIES_DOMAINS[species]
  if (!domains) throw new RangeError(`${species} is not a species NCERT names in Tables 4.6 to 4.8`)
  return { species, ...domains, ...vseprClass(domains.bondPairs, domains.lonePairs) }
}
