/**
 * Demo data for the organic laboratory cards on /vocab. Plain values only, so the same
 * components can be driven from a Scrolly or a Simulation with other numbers.
 */
import type { ChromatogramSpot } from './ChromatographyPlate'
import type { ColumnBand } from './ChromatographyColumn'
import type { FunnelLayer } from './SeparatingFunnel'
import type { TestTubeProps } from './TestTube'

/** TLC of three components: a dye-like spot, a mid spot and a fast spot. */
export const TLC_SPOTS: readonly ChromatogramSpot[] = [
  { id: 'A', rf: 0.22, color: 'var(--spot-1)' },
  { id: 'B', rf: 0.5, color: 'var(--spot-2)' },
  { id: 'C', rf: 0.78, color: 'var(--spot-3)' },
]

/** TLC where two spots are colourless and appear only under UV or iodine. */
export const TLC_COLOURLESS_SPOTS: readonly ChromatogramSpot[] = [
  { id: 'A', rf: 0.3, colourless: true },
  { id: 'B', rf: 0.66, colourless: true },
]

/** Paper chromatography of two amino acids run in a jar. */
export const PAPER_SPOTS: readonly ChromatogramSpot[] = [
  { id: 'X', rf: 0.38, color: 'var(--spot-4)' },
  { id: 'Y', rf: 0.7, color: 'var(--spot-2)' },
]

/**
 * Two immiscible layers listed in the wrong order on purpose: the component sorts them by
 * density, so the less dense ether layer is drawn on top.
 */
export const FUNNEL_LAYERS: readonly [FunnelLayer, FunnelLayer] = [
  { id: 'aqueous', density: 1.0, color: 'var(--liquid)', label: 'aqueous' },
  { id: 'ether', density: 0.71, color: 'var(--spot-4)', label: 'ether' },
]

/** Three components of a column separation: the fastest band arrives first. */
export const COLUMN_BANDS: readonly ColumnBand[] = [
  { id: 'A', color: 'var(--spot-2)', arrival: 0.45 },
  { id: 'B', color: 'var(--spot-3)', arrival: 0.7 },
  { id: 'C', color: 'var(--spot-1)', arrival: 0.92 },
]

/** The eight tubes of Lassaigne's tests, each with the colour or solid that identifies one element. */
export const LASSAIGNE_TUBES: readonly (TestTubeProps & { id: string })[] = [
  { id: 'n-prussian', label: 'N', liquid: 'var(--liquid)', precipitate: { color: 'var(--prussian-blue)', amount: 0.55 } },
  { id: 'scn-blood', label: 'N, S', liquid: 'var(--blood-red)', liquidLevel: 0.7 },
  { id: 's-violet', label: 'S', liquid: 'var(--nitroprusside-violet)', liquidLevel: 0.7 },
  { id: 's-pbs', label: 'S', liquid: 'var(--liquid)', precipitate: { color: 'var(--pbs-black)', amount: 0.6 } },
  { id: 'cl-agcl', label: 'Cl', liquid: 'var(--liquid)', precipitate: { color: 'var(--agcl-white)', amount: 0.6, outline: true } },
  { id: 'br-agbr', label: 'Br', liquid: 'var(--liquid)', precipitate: { color: 'var(--agbr-pale-yellow)', amount: 0.6, outline: true } },
  { id: 'i-agi', label: 'I', liquid: 'var(--liquid)', precipitate: { color: 'var(--agi-yellow)', amount: 0.6 } },
  { id: 'p-phospho', label: 'P', liquid: 'var(--phosphomolybdate-yellow)', liquidLevel: 0.7 },
]
