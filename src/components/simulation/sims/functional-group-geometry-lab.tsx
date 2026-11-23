'use client'

import { useState } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { FunctionalGroupMolecule } from '@/components/animations/c12-unit7/structures/FunctionalGroupMolecule'
import { TETRAHEDRAL_ANGLE } from '@/lib/chem/ncert-c12-unit7-data'
import {
  MOLECULE_ORDER,
  buildGeometryReadout,
  formatBondAngle,
  geometryRecord,
  geometrySummary,
  type MoleculeId,
} from '@/lib/chem/c12-u7-s3-geometry'
import styles from './functional-group-geometry-lab.module.css'

const MOLECULE_OPTIONS = MOLECULE_ORDER.map((id) => {
  const r = geometryRecord(id)
  return { value: id, label: `${r.name} (${r.unicode})` }
})

const SHORT_FORMULA: Record<MoleculeId, string> = {
  methanol: 'CH₃OH',
  phenol: 'C₆H₅OH',
  methoxymethane: 'CH₃OCH₃',
}

function BondLengthChart({
  selected,
  onSelect,
}: {
  selected: MoleculeId
  onSelect: (id: MoleculeId) => void
}) {
  const W = 340
  const H = 205
  const left = 56
  const right = 324
  const top = 36
  const bottom = 166
  const plotW = right - left
  const plotH = bottom - top
  const yMin = 130
  const yMax = 146
  const yTicks = [130, 134, 138, 142, 146]
  const mapY = (pm: number) => bottom - ((pm - yMin) / (yMax - yMin)) * plotH

  return (
    <svg
      className={styles.chartSvg}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="C–O bond length comparison across methanol (142 pm), phenol (136 pm), and methoxymethane (141 pm)"
    >
      <text x={left} y={18} fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C–O bond length (pm)
      </text>

      {yTicks.map((t) => {
        const y = mapY(t)
        return (
          <g key={`len-${t}`}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="var(--kin-grid)" strokeWidth={1} />
            <text
              x={left - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={15}
              fontFamily="var(--font-mono)"
              fill="var(--fg-muted)"
            >
              {t}
            </text>
          </g>
        )
      })}

      <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} />
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} />

      {MOLECULE_ORDER.map((id, i) => {
        const rec = geometryRecord(id)
        const isSel = id === selected
        const cx = left + ((i + 0.5) / MOLECULE_ORDER.length) * plotW
        const barW = 46
        const yTop = mapY(rec.coBondLengthPm)
        const barH = Math.max(4, bottom - yTop)
        return (
          <g
            key={id}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(id)}
          >
            <rect
              x={cx - barW / 2}
              y={yTop}
              width={barW}
              height={barH}
              rx={5}
              fill={isSel ? 'var(--accent)' : 'var(--fg-subtle)'}
              fillOpacity={isSel ? 0.92 : 0.42}
            />
            <text
              x={cx}
              y={yTop - 10}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fontFamily="var(--font-mono)"
              fill={isSel ? 'var(--accent)' : 'var(--fg-muted)'}
            >
              {`${rec.coBondLengthPm}`}
            </text>
            <text
              x={cx}
              y={bottom + 20}
              textAnchor="middle"
              fontSize={15}
              fontWeight={isSel ? 700 : 500}
              fontFamily="var(--font-sans)"
              fill={isSel ? 'var(--fg)' : 'var(--fg-muted)'}
            >
              {SHORT_FORMULA[id]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function BondAngleChart({
  selected,
  showTetrahedralRef,
  onSelect,
}: {
  selected: MoleculeId
  showTetrahedralRef: boolean
  onSelect: (id: MoleculeId) => void
}) {
  const W = 340
  const H = 205
  const left = 56
  const right = 324
  const top = 36
  const bottom = 166
  const plotW = right - left
  const plotH = bottom - top
  const yMin = 106
  const yMax = 114
  const yTicks = [106, 108, 110, 112, 114]
  const mapY = (deg: number) => bottom - ((deg - yMin) / (yMax - yMin)) * plotH
  const refY = mapY(TETRAHEDRAL_ANGLE.deg)

  return (
    <svg
      className={styles.chartSvg}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Bond angle at oxygen comparison across methanol (108.9°), phenol (109°), and methoxymethane (111.7°) against 109°28′ tetrahedral reference"
    >
      <text x={left} y={18} fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        Bond angle at oxygen (°)
      </text>

      {yTicks.map((t) => {
        const y = mapY(t)
        return (
          <g key={`ang-${t}`}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="var(--kin-grid)" strokeWidth={1} />
            <text
              x={left - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={15}
              fontFamily="var(--font-mono)"
              fill="var(--fg-muted)"
            >
              {`${t}°`}
            </text>
          </g>
        )
      })}

      <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} />
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} />

      {showTetrahedralRef && (
        <g>
          <line
            x1={left}
            y1={refY}
            x2={right}
            y2={refY}
            stroke="var(--fg-muted)"
            strokeWidth={1.8}
            strokeDasharray="5 4"
          />
          <text
            x={left + (plotW / 3)}
            y={refY - 11}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            fontFamily="var(--font-mono)"
            fill="var(--fg-muted)"
          >
            {TETRAHEDRAL_ANGLE.printed}
          </text>
        </g>
      )}

      {MOLECULE_ORDER.map((id, i) => {
        const rec = geometryRecord(id)
        const isSel = id === selected
        const cx = left + ((i + 0.5) / MOLECULE_ORDER.length) * plotW
        const cy = mapY(rec.bondAngleDeg)
        const labelAbove = rec.bondAngleDeg >= TETRAHEDRAL_ANGLE.deg
        return (
          <g
            key={id}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(id)}
          >
            <line
              x1={cx}
              y1={refY}
              x2={cx}
              y2={cy}
              stroke={isSel ? 'var(--accent)' : 'var(--fg-subtle)'}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={cy}
              r={isSel ? 7 : 5.5}
              fill={isSel ? 'var(--accent)' : 'var(--fg-muted)'}
              stroke="var(--surface)"
              strokeWidth={1.8}
            />
            <text
              x={cx}
              y={labelAbove ? cy - 13 : cy + 20}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fontFamily="var(--font-mono)"
              fill={isSel ? 'var(--accent)' : 'var(--fg-muted)'}
            >
              {formatBondAngle(rec.bondAngleDeg)}
            </text>
            <text
              x={cx}
              y={bottom + 20}
              textAnchor="middle"
              fontSize={15}
              fontWeight={isSel ? 700 : 500}
              fontFamily="var(--font-sans)"
              fill={isSel ? 'var(--fg)' : 'var(--fg-muted)'}
            >
              {SHORT_FORMULA[id]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * Flagship Section 7.3 Simulation (`functional-group-geometry-lab`):
 * Interactive geometry lab comparing methanol, phenol, and methoxymethane
 * against NCERT Fig. 7.1 bond lengths, bond angles, and 109°28′ reference.
 */
export function FunctionalGroupGeometryLab({ reducedMotion }: SimulationProps) {
  const [moleculeId, setMoleculeId] = useState<MoleculeId>('methanol')
  const [showLonePairs, setShowLonePairs] = useState(true)
  const [showTetrahedralRef, setShowTetrahedralRef] = useState(true)
  const [showMechanism, setShowMechanism] = useState(true)
  const [compareAll, setCompareAll] = useState(false)

  const readout = buildGeometryReadout(moleculeId)
  const { record } = readout

  return (
    <div className={styles.sim}>
      <SimulationControls>
        <div className={styles.controlsWrap}>
          <Segmented
            label="Molecule"
            options={MOLECULE_OPTIONS}
            value={moleculeId}
            onChange={setMoleculeId}
          />
          <div className={styles.togglesGroup}>
            <Toggle
              label="Show lone pairs"
              checked={showLonePairs}
              onChange={setShowLonePairs}
            />
            <Toggle
              label="Show tetrahedral 109°28′ reference"
              checked={showTetrahedralRef}
              onChange={setShowTetrahedralRef}
            />
            <Toggle
              label="Show electronic/steric mechanism"
              checked={showMechanism}
              onChange={setShowMechanism}
            />
            <Toggle
              label="Compare all 3"
              checked={compareAll}
              onChange={setCompareAll}
            />
          </div>
        </div>
      </SimulationControls>

      {compareAll ? (
        <>
          <div className={styles.compareGrid}>
            {MOLECULE_ORDER.map((id) => {
              const r = geometryRecord(id)
              const active = id === moleculeId
              return (
                <button
                  key={id}
                  type="button"
                  className={styles.compareCard}
                  data-active={active ? 'true' : 'false'}
                  aria-pressed={active}
                  onClick={() => setMoleculeId(id)}
                >
                  <div className={styles.compareCardHead}>
                    <span>{r.name}</span>
                    <span className={styles.compareFormula}>{r.unicode}</span>
                  </div>
                  <svg
                    className={styles.moleculeSvg}
                    viewBox="0 0 360 250"
                    role="img"
                    aria-label={`${r.name} (${r.unicode}) scaled geometry: C–O ${r.coBondLengthPm} pm, angle ${formatBondAngle(r.bondAngleDeg)}`}
                  >
                    <FunctionalGroupMolecule
                      moleculeId={id}
                      ox={196}
                      oy={86}
                      unitsPerPm={0.68}
                      showLonePairs={showLonePairs}
                      showTetrahedralRef={showTetrahedralRef}
                      showOrbitalOverlap={showMechanism && id === 'methanol'}
                      showConjugation={showMechanism && id === 'phenol'}
                      showStericHalos={showMechanism && id === 'methoxymethane'}
                      highlightCarbons={showMechanism}
                      showHybridTags={false}
                      showBondLengthCallouts
                      showAngleCallout
                      compact
                      reducedMotion={reducedMotion}
                    />
                  </svg>
                </button>
              )
            })}
          </div>
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <BondLengthChart selected={moleculeId} onSelect={setMoleculeId} />
            </div>
            <div className={styles.chartCard}>
              <BondAngleChart
                selected={moleculeId}
                showTetrahedralRef={showTetrahedralRef}
                onSelect={setMoleculeId}
              />
            </div>
          </div>
        </>
      ) : (
        <div className={styles.mainGrid}>
          <div className={styles.stageCard}>
            <div className={styles.stageHeader}>
              <h4 className={styles.stageTitle}>
                {`${record.name} (${record.unicode})`}
              </h4>
              {showMechanism && (
                <span className={styles.mechBadge} data-testid="mechanism-badge">
                  {readout.mechanismTag}
                </span>
              )}
            </div>
            <svg
              className={styles.moleculeSvg}
              viewBox="0 0 390 265"
              role="img"
              aria-label={geometrySummary(moleculeId)}
            >
              <FunctionalGroupMolecule
                moleculeId={moleculeId}
                ox={214}
                oy={84}
                unitsPerPm={0.76}
                showLonePairs={showLonePairs}
                showTetrahedralRef={showTetrahedralRef}
                showOrbitalOverlap={showMechanism && moleculeId === 'methanol'}
                showConjugation={showMechanism && moleculeId === 'phenol'}
                showStericHalos={showMechanism && moleculeId === 'methoxymethane'}
                highlightCarbons={showMechanism}
                showHybridTags
                showBondLengthCallouts
                showAngleCallout
                reducedMotion={reducedMotion}
              />
            </svg>
          </div>

          <div className={styles.chartsStack}>
            <div className={styles.chartCard}>
              <BondLengthChart selected={moleculeId} onSelect={setMoleculeId} />
            </div>
            <div className={styles.chartCard}>
              <BondAngleChart
                selected={moleculeId}
                showTetrahedralRef={showTetrahedralRef}
                onSelect={setMoleculeId}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.readout}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Carbon hybridisation</span>
          <span className={styles.statValue} data-testid="readout-hybridisation">
            {record.carbonHybridisation}
          </span>
          <span className={styles.statSub}>{readout.sCharacterPercent}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>C–O bond length</span>
          <span className={styles.statValue} data-testid="readout-co-length">
            {`${record.coBondLengthPm} pm`}
          </span>
          <span className={styles.statSub}>
            {record.id === 'phenol' ? '6 pm shorter than methanol' : 'sp³ carbon σ bond'}
          </span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>O–H bond length</span>
          <span className={styles.statValue} data-testid="readout-oh-length">
            {readout.ohBondDisplay}
          </span>
          <span className={styles.statSub}>
            {record.id === 'methanol'
              ? 'NCERT Fig. 7.1'
              : record.id === 'phenol'
                ? 'Omitted in NCERT Fig. 7.1'
                : 'No O–H bond in ether'}
          </span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>{`Bond angle (${record.bondAngleLabel})`}</span>
          <span className={styles.statValue} data-testid="readout-bond-angle">
            {readout.angleDisplay}
          </span>
          <span className={styles.statSub} data-testid="readout-angle-delta">
            {`${readout.deviationDisplay} vs ${TETRAHEDRAL_ANGLE.printed}`}
          </span>
        </div>
      </div>

      <p className={styles.explanation} data-testid="readout-explanation">
        {record.explanation}
      </p>

      <p className={styles.srOnly} aria-live="polite">
        {geometrySummary(moleculeId)}
      </p>
    </div>
  )
}
