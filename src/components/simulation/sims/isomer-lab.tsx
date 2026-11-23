'use client'

import { useState } from 'react'
import {
  OctahedralComplex,
  SquarePlanarComplex,
  TONE,
  TetrahedralComplex,
  type ChelateArcSpec,
  type LigandStyle,
} from '@/components/animations/c12-unit5/isomerism/ComplexDiagrams'
import {
  LIGAND_SET_CASES,
  NCERT_ISOMER_KINDS,
  casesForGeometry,
  getLigandSetCase,
  getPairExplanations,
  type IsomerSpec,
  type LabGeometry,
  type LigandSetCase,
  type LigandSetId,
} from '@/lib/chem/isomer-lab'
import type { SimulationProps } from '../registry'
import styles from './isomer-lab.module.css'

const PAIR_EXPLANATIONS = getPairExplanations()

const LIG_X: LigandStyle = { label: 'X', fill: TONE.x }
const LIG_L: LigandStyle = { label: 'L', fill: TONE.l }
const LIG_A: LigandStyle = { label: 'A', fill: TONE.a }
const LIG_B: LigandStyle = { label: 'B', fill: TONE.b }
const LIG_a: LigandStyle = { label: 'a', fill: TONE.x }
const LIG_b: LigandStyle = { label: 'b', fill: TONE.l }
const LIG_N: LigandStyle = { label: 'N', fill: TONE.en }
const LIG_CL: LigandStyle = { label: 'Cl', fill: TONE.x }

const TRIS_CHELATES: readonly ChelateArcSpec[] = [
  { from: 0, to: 2, label: 'en' },
  { from: 3, to: 4, label: 'en' },
  { from: 1, to: 5, label: 'en' },
]

function renderIsomerBody(
  caseId: LigandSetId,
  isomerId: string,
  cx: number,
  cy: number,
  yawDeg: number,
  mirrored: boolean,
  showMirrorPlane: boolean,
) {
  if (caseId === 'sq-mx2l2') {
    const isCis = isomerId === 'cis'
    return (
      <SquarePlanarComplex
        cx={cx}
        cy={cy}
        radius={48}
        metal="Pt"
        ligands={isCis ? [LIG_X, LIG_X, LIG_L, LIG_L] : [LIG_X, LIG_L, LIG_X, LIG_L]}
        highlightPair={isCis ? [0, 1] : [0, 2]}
        showMirrorPlane={showMirrorPlane}
        fontSize={16}
      />
    )
  }

  if (caseId === 'sq-mabxl') {
    const map: Record<string, readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle]> = {
      'cis-1': [LIG_A, LIG_B, LIG_X, LIG_L],
      'cis-2': [LIG_A, LIG_X, LIG_B, LIG_L],
      trans: [LIG_A, LIG_B, LIG_L, LIG_X],
    }
    return (
      <SquarePlanarComplex
        cx={cx}
        cy={cy}
        radius={48}
        metal="M"
        ligands={map[isomerId] ?? map['cis-1']}
        highlightPair={[0, 2]}
        showMirrorPlane={showMirrorPlane}
        fontSize={16}
      />
    )
  }

  if (caseId === 'tet-mx2l2') {
    return (
      <TetrahedralComplex
        cx={cx}
        cy={cy}
        radius={62}
        metal="M"
        ligands={[LIG_X, LIG_X, LIG_L, LIG_L]}
        yawDeg={yawDeg}
        pitchDeg={14}
        showAllEdges
        showMirrorPlane={showMirrorPlane}
        fontSize={16}
      />
    )
  }

  if (caseId === 'oct-mx2l4') {
    const isCis = isomerId === 'cis'
    return (
      <OctahedralComplex
        cx={cx}
        cy={cy}
        radius={58}
        metal="Co"
        ligands={
          isCis
            ? [LIG_X, LIG_L, LIG_L, LIG_X, LIG_L, LIG_L]
            : [LIG_X, LIG_X, LIG_L, LIG_L, LIG_L, LIG_L]
        }
        highlightPair={isCis ? [0, 3] : [0, 1]}
        mirrored={mirrored}
        yawDeg={yawDeg}
        showMirrorPlane={showMirrorPlane}
        mirrorPlane={isCis ? 'diag-03' : 'yz'}
        fontSize={16}
      />
    )
  }

  if (caseId === 'oct-mx2ll2') {
    const isCis = isomerId === 'cis'
    return (
      <OctahedralComplex
        cx={cx}
        cy={cy}
        radius={56}
        metal="Pt"
        ligands={
          isCis
            ? [LIG_CL, LIG_N, LIG_N, LIG_CL, LIG_N, LIG_N]
            : [LIG_CL, LIG_CL, LIG_N, LIG_N, LIG_N, LIG_N]
        }
        chelates={
          isCis
            ? [
                { from: 1, to: 2, label: 'en' },
                { from: 4, to: 5, label: 'en' },
              ]
            : [
                { from: 2, to: 3, label: 'en' },
                { from: 4, to: 5, label: 'en' },
              ]
        }
        mirrored={mirrored}
        yawDeg={yawDeg}
        showMirrorPlane={showMirrorPlane}
        fontSize={16}
      />
    )
  }

  if (caseId === 'oct-ma3b3') {
    const isFac = isomerId === 'fac'
    return (
      <OctahedralComplex
        cx={cx}
        cy={cy}
        radius={58}
        metal="Co"
        ligands={
          isFac
            ? [LIG_a, LIG_b, LIG_a, LIG_a, LIG_b, LIG_b]
            : [LIG_a, LIG_a, LIG_b, LIG_a, LIG_b, LIG_b]
        }
        shadedFace={isFac ? [0, 2, 3] : undefined}
        meridianTriple={isFac ? undefined : [0, 3, 1]}
        mirrored={mirrored}
        yawDeg={yawDeg}
        showMirrorPlane={showMirrorPlane}
        mirrorPlane={isFac ? 'yz' : 'diag-03'}
        fontSize={16}
      />
    )
  }

  // oct-mll3
  return (
    <OctahedralComplex
      cx={cx}
      cy={cy}
      radius={56}
      metal="Co"
      ligands={[LIG_N, LIG_N, LIG_N, LIG_N, LIG_N, LIG_N]}
      chelates={TRIS_CHELATES}
      mirrored={mirrored}
      yawDeg={yawDeg}
      showMirrorPlane={showMirrorPlane}
      fontSize={16}
    />
  )
}

function IsomerDrawing({
  labCase,
  isomer,
  showMirror,
  yawDeg,
}: {
  labCase: LigandSetCase
  isomer: IsomerSpec
  showMirror: boolean
  yawDeg: number
}) {
  if (showMirror && isomer.chiral) {
    return (
      <svg
        className={styles.scene}
        viewBox="0 0 420 220"
        role="img"
        aria-label={`${isomer.label} isomer of ${labCase.formula} with its non-superimposable mirror image (d and l)`}
      >
        {renderIsomerBody(labCase.id, isomer.id, 102, 104, yawDeg, false, false)}
        <text x={102} y={206} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
          d (original)
        </text>
        <line x1={210} y1={16} x2={210} y2={204} stroke={TONE.accent} strokeWidth={2.2} strokeDasharray="6 5" />
        {renderIsomerBody(labCase.id, isomer.id, 318, 104, yawDeg, true, false)}
        <text x={318} y={206} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
          l (mirror image)
        </text>
      </svg>
    )
  }

  return (
    <svg
      className={styles.scene}
      viewBox="0 0 260 210"
      role="img"
      aria-label={`${isomer.label} arrangement of ${labCase.formula}${showMirror ? ', achiral with symmetry mirror plane' : ''}`}
    >
      {renderIsomerBody(labCase.id, isomer.id, 130, 106, yawDeg, false, showMirror && !isomer.chiral)}
    </svg>
  )
}

export function IsomerLab({ reducedMotion: _reducedMotion }: SimulationProps) {
  const [mode, setMode] = useState<'builder' | 'pairs'>('builder')
  const [geometry, setGeometry] = useState<LabGeometry>('square planar')
  const [ligandSetId, setLigandSetId] = useState<LigandSetId>('sq-mx2l2')
  const [showMirror, setShowMirror] = useState(false)
  const [yawDeg, setYawDeg] = useState(22)

  // Pair classifier mode state
  const [pairIdx, setPairIdx] = useState(0)
  const [pickedKind, setPickedKind] = useState<string | null>(null)

  const availableCases = casesForGeometry(geometry)
  const activeCase = getLigandSetCase(ligandSetId)
  const activePair = PAIR_EXPLANATIONS[pairIdx] ?? PAIR_EXPLANATIONS[0]

  const handleGeometryChange = (nextGeo: LabGeometry) => {
    setGeometry(nextGeo)
    const nextCases = casesForGeometry(nextGeo)
    if (nextCases.length > 0) {
      setLigandSetId(nextCases[0].id)
    }
  }

  const handleLigandSetChange = (nextId: LigandSetId) => {
    setLigandSetId(nextId)
    const found = getLigandSetCase(nextId)
    setGeometry(found.geometry)
  }

  const handleSelectPair = (nextIdx: number) => {
    const wrapped = (nextIdx + PAIR_EXPLANATIONS.length) % PAIR_EXPLANATIONS.length
    setPairIdx(wrapped)
    setPickedKind(null)
  }

  const isCorrect = pickedKind !== null && pickedKind === activePair.pair.kind

  const liveSummary =
    mode === 'builder'
      ? `${activeCase.geometry} ${activeCase.formula}: ${activeCase.geometricIsomerCount} geometrical arrangement${activeCase.geometricIsomerCount === 1 ? '' : 's'}. Mirror check ${showMirror ? 'on' : 'off'}. ${activeCase.note}`
      : `Pair ${pairIdx + 1} of ${PAIR_EXPLANATIONS.length}: ${activePair.pair.a} and ${activePair.pair.b}.${
          pickedKind
            ? isCorrect
              ? ` Correct: ${activePair.kindInfo.name} (${activePair.kindInfo.section}). ${activePair.whatChanged}`
              : ` Selected ${pickedKind}. Try again.`
            : ''
        }`

  return (
    <div className={styles.sim}>
      <div className={styles.modeBar} role="tablist" aria-label="Isomer Lab mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'builder'}
          className={`${styles.modeBtn} ${mode === 'builder' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('builder')}
        >
          Isomer Builder
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'pairs'}
          className={`${styles.modeBtn} ${mode === 'pairs' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('pairs')}
        >
          NCERT Pair Classifier (10 pairs)
        </button>
      </div>

      {mode === 'builder' ? (
        <>
          <div className={styles.controls}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Geometry</span>
              <select
                className={styles.select}
                aria-label="Geometry"
                value={geometry}
                onChange={(e) => handleGeometryChange(e.target.value as LabGeometry)}
              >
                <option value="square planar">Square planar (CN 4)</option>
                <option value="octahedral">Octahedral (CN 6)</option>
                <option value="tetrahedral">Tetrahedral (CN 4)</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Ligand set</span>
              <select
                className={styles.select}
                aria-label="Ligand set"
                value={ligandSetId}
                onChange={(e) => handleLigandSetChange(e.target.value as LigandSetId)}
              >
                {availableCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.formula} (${c.exampleFormula})`}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Chirality test</span>
              <button
                type="button"
                aria-pressed={showMirror}
                className={`${styles.toggleBtn} ${showMirror ? styles.toggleBtnActive : ''}`}
                onClick={() => setShowMirror((v) => !v)}
              >
                {showMirror ? 'Mirror image: ON' : 'Show mirror image'}
              </button>
            </div>
          </div>

          {geometry !== 'square planar' && (
            <label className={styles.sliderRow}>
              <span className={styles.fieldLabel}>{`3D view angle: ${yawDeg} deg`}</span>
              <input
                type="range"
                className={styles.slider}
                aria-label="3D view angle"
                min={0}
                max={360}
                step={2}
                value={yawDeg}
                onChange={(e) => setYawDeg(Number(e.target.value))}
              />
            </label>
          )}

          <div className={styles.summaryBar}>
            <div>
              <h3 className={styles.summaryTitle}>{`${activeCase.formula} (${activeCase.exampleFormula})`}</h3>
              <p className={styles.note}>{activeCase.note}</p>
            </div>
            <span className={styles.countBadge}>
              {activeCase.geometricIsomerCount === 1
                ? '1 arrangement (no cis/trans)'
                : `${activeCase.geometricIsomerCount} geometrical isomers`}
            </span>
          </div>

          <div className={showMirror ? styles.gridSingle : styles.grid}>
            {activeCase.isomers.map((iso) => (
              <article key={iso.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <h4 className={styles.cardTitle}>{iso.label}</h4>
                  {showMirror && (
                    <span className={iso.chiral ? styles.badgeChiral : styles.badgeAchiral}>
                      {iso.chiral ? 'Chiral: not superimposable' : 'Achiral: superimposable'}
                    </span>
                  )}
                </div>
                <IsomerDrawing labCase={activeCase} isomer={iso} showMirror={showMirror} yawDeg={yawDeg} />
                <p className={styles.cardSub}>
                  {showMirror && !iso.chiral && iso.achiralReason ? iso.achiralReason : iso.subtitle}
                </p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.pairStage}>
          <div className={styles.pairNav}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>NCERT isomer pair</span>
              <select
                className={styles.select}
                aria-label="NCERT isomer pair"
                value={pairIdx}
                onChange={(e) => handleSelectPair(Number(e.target.value))}
              >
                {PAIR_EXPLANATIONS.map((p) => (
                  <option key={p.index} value={p.index}>
                    {`Pair ${p.index + 1}: ${p.pair.a} / ${p.pair.b}`}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.navGroup}>
              <button type="button" className={styles.navBtn} onClick={() => handleSelectPair(pairIdx - 1)}>
                Previous
              </button>
              <button type="button" className={styles.navBtn} onClick={() => handleSelectPair(pairIdx + 1)}>
                Next
              </button>
            </div>
          </div>

          <div className={styles.pairCards}>
            <div className={styles.formulaBox}>
              <span className={styles.fieldLabel}>Isomer A</span>
              <p className={styles.formulaText}>{activePair.pair.a}</p>
              {activePair.colourHint && (
                <div className={styles.swatchRow}>
                  <span className={styles.swatch} style={{ background: activePair.colourHint.aTone }} />
                  <span>{activePair.colourHint.aLabel}</span>
                </div>
              )}
            </div>
            <div className={styles.formulaBox}>
              <span className={styles.fieldLabel}>Isomer B</span>
              <p className={styles.formulaText}>{activePair.pair.b}</p>
              {activePair.colourHint && (
                <div className={styles.swatchRow}>
                  <span className={styles.swatch} style={{ background: activePair.colourHint.bTone }} />
                  <span>{activePair.colourHint.bLabel}</span>
                </div>
              )}
            </div>
          </div>

          <p className={styles.note}>
            {`Which of the six NCERT isomerism kinds does this pair illustrate?${activePair.pair.figure ? ` (${activePair.pair.figure})` : ''}`}
          </p>

          <div className={styles.kindGrid}>
            {NCERT_ISOMER_KINDS.map((k) => {
              const selected = pickedKind === k.id
              const btnClass = [
                styles.kindBtn,
                selected && isCorrect ? styles.kindBtnCorrect : '',
                selected && !isCorrect ? styles.kindBtnWrong : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button key={k.id} type="button" className={btnClass} onClick={() => setPickedKind(k.id)}>
                  {`${k.name.replace(' isomerism', '')} (${k.section})`}
                </button>
              )
            })}
          </div>

          {pickedKind && (
            <div className={`${styles.feedback} ${isCorrect ? styles.feedbackGood : styles.feedbackTry}`}>
              <p className={styles.feedbackTitle}>
                {isCorrect
                  ? `Correct: ${activePair.kindInfo.name} (${activePair.kindInfo.family === 'stereo' ? 'Stereoisomerism' : 'Structural isomerism'}, Section ${activePair.kindInfo.section})`
                  : 'Not quite. Look closely at what changed between Isomer A and Isomer B.'}
              </p>
              <p className={styles.feedbackBody}>
                {isCorrect
                  ? activePair.whatChanged
                  : 'Check whether the bonds themselves changed (structural) or only the 3D arrangement / mirror-image handedness (stereoisomerism).'}
              </p>
            </div>
          )}
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
