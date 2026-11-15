import { analyteById, columnArrival, modelRf, type Analyte } from '@/lib/chem/chromatography'
import type { ChromatogramSpot, ColumnBand, VisualiseMode } from '@/components/organic/lab'

/** The apparatus drawn on one Step. */
export type SceneView = 'column' | 'tlc' | 'paper'

/** Solvent strength used for every Step, so the Rf values agree with the Prose. */
export const SCENE_SOLVENT = 0.4

export interface SceneStep {
  view: SceneView
  /** Progress of the eluent or solvent front, 0 to 1. */
  progress: number
  visualise: VisualiseMode
  /** Draws the measuring overlay on the TLC plate. */
  measure: boolean
  /** Index into the plate's spots for the measuring overlay. */
  measureSpot: number
  /** Caption above the drawing. */
  title: string
}

/** Short labels used on the drawings. Each one stands for a substance in ANALYTES. */
const SCENE_IDS: readonly { letter: string; analyte: Analyte }[] = [
  { letter: 'R', analyte: analyteById('red') },
  { letter: 'B', analyte: analyteById('blue') },
  { letter: 'G', analyte: analyteById('green') },
  { letter: 'C', analyte: analyteById('colourless') },
]

/** The substance behind a scene letter (R, B, G or C). */
export function sceneAnalyte(letter: string): Analyte {
  const found = SCENE_IDS.find((x) => x.letter === letter)
  if (!found) throw new RangeError(`No scene spot ${letter}`)
  return found.analyte
}

/** The four spots of the scene. C is colourless: it shows only after visualisation. */
export function sceneSpots(): ChromatogramSpot[] {
  return SCENE_IDS.map(({ letter, analyte }) => ({
    id: letter,
    rf: modelRf(analyte.adsorption, SCENE_SOLVENT),
    color: analyte.colourless ? undefined : analyte.color,
    colourless: analyte.colourless,
  }))
}

/** The three coloured bands on the column, with their arrival progress from the model. */
export function sceneBands(): ColumnBand[] {
  return SCENE_IDS.filter(({ analyte }) => !analyte.colourless).map(({ letter, analyte }) => ({
    id: letter,
    color: analyte.color,
    arrival: columnArrival(analyte.adsorption, SCENE_SOLVENT),
  }))
}

/** Column bands ordered by arrival: the first band to arrive is fraction F1. */
export function elutionOrder(): ColumnBand[] {
  return [...sceneBands()].sort((a, b) => a.arrival - b.arrival)
}

/** Two coloured dyes for the paper strip. */
export function paperSpots(): ChromatogramSpot[] {
  return sceneSpots().filter((s) => s.id === 'R' || s.id === 'G')
}

/** The six Steps of the Scrolly. Each one is a fixed pose; the drawing tweens between them. */
export function sceneSteps(): SceneStep[] {
  const order = elutionOrder().map((b, i) => `F${i + 1} = ${b.id}`)
  return [
    {
      view: 'column',
      progress: 0.25,
      visualise: 'none',
      measure: false,
      measureSpot: 0,
      title: 'Column: the eluent carries the bands down at different speeds',
    },
    {
      view: 'column',
      progress: 1,
      visualise: 'none',
      measure: false,
      measureSpot: 0,
      title: `Fractions collected: ${order.join(', ')}`,
    },
    {
      view: 'tlc',
      progress: 0,
      visualise: 'none',
      measure: false,
      measureSpot: 0,
      title: 'Thin layer plate: spots placed on the origin line',
    },
    {
      view: 'tlc',
      progress: 0.8,
      visualise: 'none',
      measure: false,
      measureSpot: 0,
      title: 'Developed plate: each spot moves its own fraction of the front',
    },
    {
      view: 'tlc',
      progress: 0.8,
      visualise: 'iodine',
      measure: false,
      measureSpot: 0,
      title: 'Iodine vapour: the colourless spot C turns brown',
    },
    {
      view: 'paper',
      progress: 0.8,
      visualise: 'none',
      measure: false,
      measureSpot: 0,
      title: 'Paper: water held in the paper is the stationary phase',
    },
  ]
}
