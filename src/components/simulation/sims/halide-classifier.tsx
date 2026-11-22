'use client'

import { useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import {
  HALIDE_GALLERY,
  buildHalideSmiles,
  halideFormula,
  halideVerdict,
  normaliseBuildSpec,
  type HalideBuildSpec,
  type HalideFeature,
} from '@/lib/chem/halide-builder'
import { classifyHalideSmiles, type HalideClass } from '@/lib/chem/haloalkanes'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import styles from './halide-classifier.module.css'

type Mode = 'gallery' | 'build'

const MODE_OPTIONS = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'build', label: 'Build my own' },
] as const

const FEATURE_OPTIONS = [
  { value: 'plain', label: 'Plain chain' },
  { value: 'alkene', label: 'C=C in chain' },
  { value: 'ring', label: 'Benzene ring' },
] as const

const HALOGEN_OPTIONS = [
  { value: 'F', label: 'F' },
  { value: 'Cl', label: 'Cl' },
  { value: 'Br', label: 'Br' },
  { value: 'I', label: 'I' },
] as const

/** The drawing box is the Simulation's 560 by 340 viewBox. */
const VIEW = { width: 560, height: 340 }
/** Highlight ring radius, in bond lengths (scaled with the drawing). */
const RING_RADIUS = 0.42

/** The name, or null when the namer does not cover the molecule (it throws outside its scope). */
function safeName(smiles: string): string | null {
  try {
    return iupacNameFromSmiles(smiles)
  } catch {
    return null
  }
}

/** Largest scale (bond length in px) that fits the molecule in the viewBox, capped at a comfortable size. */
function fitScale(smiles: string): number {
  const frame = drawingFrame(parseSmiles(smiles), 1)
  return Math.min(96, 480 / frame.bounds.width, 280 / frame.bounds.height)
}

/** The hybridisation label with a real superscript. */
function hybridisationText(h: HalideClass['hybridisation']): string {
  return h === 'sp3' ? 'sp³' : 'sp²'
}

/** What the neighbour that decides the class is, in words a student can check on the drawing. */
function neighbourText(kind: HalideClass['kind']): string {
  switch (kind) {
    case 'allylic':
      return 'a C=C carbon next door'
    case 'benzylic':
      return 'a benzene ring carbon next door'
    case 'vinylic':
      return 'the C=C carbon it is bonded to'
    case 'aryl':
      return 'a benzene ring carbon'
    case 'alkyl':
      return 'No C=C or ring next door'
  }
}

/**
 * The halide classifier. Gallery: pick one of the Section's molecules. Build my own: a chain of 1 to 5
 * carbons, with a C=C or a benzene ring, and a halogen on a chosen carbon. The drawing is the same
 * molecule as the verdict; the carbon that carries X and the neighbour that decides its class are
 * outlined. Every name, formula and class comes from the libs.
 */
export function HalideClassifier(_props: SimulationProps) {
  const [mode, setMode] = useState<Mode>('gallery')
  const [picked, setPicked] = useState(0)
  const [spec, setSpec] = useState<HalideBuildSpec>({
    carbons: 3,
    feature: 'plain',
    doubleAfter: 1,
    site: 1,
    halogen: 'Br',
  })

  const shown = normaliseBuildSpec(spec)
  const smiles = mode === 'gallery' ? HALIDE_GALLERY[picked] : buildHalideSmiles(shown)
  const name = safeName(smiles)
  const verdict = halideVerdict(smiles)
  const formula = halideFormula(smiles)
  const result = classifyHalideSmiles(smiles)
  const graph = parseSmiles(smiles)
  const scale = fitScale(smiles)
  const frame = drawingFrame(graph, scale)

  const siteOptions = [
    ...Array.from({ length: shown.carbons }, (_, i) => ({ value: `C${i + 1}`, label: `C${i + 1}` })),
    ...(shown.feature === 'ring' ? [{ value: 'ring', label: 'Ring (para)' }] : []),
  ]
  const siteValue = shown.site === 'ring' ? 'ring' : `C${shown.site}`

  const setFeature = (feature: HalideFeature) => {
    setSpec((s) => normaliseBuildSpec({ ...s, feature, site: feature === 'ring' || s.site !== 'ring' ? s.site : 1 }))
  }

  const summary = `${name ?? 'Molecule'}, ${formula}: ${verdict}.`

  return (
    <div className={styles.classifier} data-testid="halide-classifier">
      <div className={styles.modeRow}>
        <Segmented
          label="Mode"
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
        />
      </div>

      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            role="img"
            aria-label={`Structure: ${name ?? 'not named by the namer'}, ${verdict}`}
            className={styles.drawing}
            data-testid="halide-drawing"
          >
            <SkeletalFormula
              graph={graph}
              scale={scale}
              x={VIEW.width / 2}
              y={VIEW.height / 2}
              overlay={result.halides.map((h) => (
                <g key={`hl-${h.carbon}`}>
                  {h.decidingNeighbour !== null && (
                    <circle
                      cx={frame.points[h.decidingNeighbour].x}
                      cy={frame.points[h.decidingNeighbour].y}
                      r={RING_RADIUS * scale}
                      fill="none"
                      stroke={ROLE_TONE.sp2}
                      strokeWidth={3}
                      strokeDasharray="6 4"
                    />
                  )}
                  <circle
                    cx={frame.points[h.carbon].x}
                    cy={frame.points[h.carbon].y}
                    r={RING_RADIUS * scale}
                    fill="none"
                    stroke={ROLE_TONE.sp3}
                    strokeWidth={3.5}
                  />
                </g>
              ))}
            />
          </svg>
          <figcaption className={styles.caption}>
            {mode === 'gallery' ? 'Pick a molecule below.' : 'Built from your choices below.'}
          </figcaption>
        </figure>

        <div className={styles.panel}>
          {/* name is null only if safeName fails, which the builder cannot reach; show the formula then */}
          <p className={styles.name} data-testid="halide-name">{name ?? formula}</p>
          {name !== null && <p className={styles.formula}>{formula}</p>}
          <p className={styles.verdict} data-testid="halide-verdict">{verdict}</p>

          <ul className={styles.details}>
            {result.halides.map((h) => (
              <li key={`d-${h.carbon}`} className={styles.detail}>
                <span className={styles.swatchX} aria-hidden="true" />
                <span>
                  The carbon bearing {h.halogen} is {hybridisationText(h.hybridisation)}
                  {h.degree && h.degree !== 'methyl' ? ` (${h.degree})` : ''}.
                  {h.decidingNeighbour !== null ? ` Deciding neighbour: ${neighbourText(h.kind)}.` : ` ${neighbourText(h.kind)}.`}
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.legend} aria-hidden="true">
            <span className={styles.legendItem}><span className={styles.swatchX} />carbon with X</span>
            <span className={styles.legendItem}><span className={styles.swatchNeighbour} />deciding neighbour</span>
          </div>

          <p className={styles.srOnly} aria-live="polite" data-testid="halide-live">{summary}</p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          {mode === 'gallery' && (
            <div className={styles.gallery} role="group" aria-label="Gallery of molecules">
              {HALIDE_GALLERY.map((s, i) => (
                <Button
                  key={s}
                  variant={i === picked ? 'primary' : 'secondary'}
                  aria-pressed={i === picked}
                  onClick={() => setPicked(i)}
                  className={styles.galleryButton}
                >
                  {safeName(s) ?? s}
                </Button>
              ))}
            </div>
          )}

          {mode === 'build' && (
            <>
              <div className={styles.fieldRow}>
                <Slider
                  label="Carbons in the chain"
                  value={shown.carbons}
                  min={1}
                  max={5}
                  step={1}
                  onChange={(carbons) => setSpec((s) => normaliseBuildSpec({ ...s, carbons }))}
                />
                <Segmented
                  label="Chain feature"
                  options={FEATURE_OPTIONS}
                  value={shown.feature}
                  onChange={setFeature}
                />
              </div>
              <div className={styles.fieldRow}>
                {shown.feature === 'alkene' && shown.carbons >= 2 && (
                  <Slider
                    label="Double bond after carbon"
                    value={shown.doubleAfter}
                    min={1}
                    max={shown.carbons - 1}
                    step={1}
                    onChange={(doubleAfter) => setSpec((s) => normaliseBuildSpec({ ...s, doubleAfter }))}
                  />
                )}
                <Segmented
                  label="Halogen on"
                  options={siteOptions}
                  value={siteValue}
                  onChange={(v) => setSpec((s) => normaliseBuildSpec({ ...s, site: v === 'ring' ? 'ring' : Number(v.slice(1)) }))}
                />
                <Segmented
                  label="Halogen"
                  options={HALOGEN_OPTIONS}
                  value={shown.halogen}
                  onChange={(halogen) => setSpec((s) => ({ ...s, halogen }))}
                />
              </div>
            </>
          )}
        </div>
      </SimulationControls>
    </div>
  )
}
