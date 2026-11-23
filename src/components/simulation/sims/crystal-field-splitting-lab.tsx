'use client'

import React, { useState } from 'react'
import type { SimulationProps } from '../registry'
import {
  CFT_COLOR,
  EnergyAxis,
  OrbitalLevelSet,
  SplitDoubleArrow,
  fillSubshellSlots,
  formatOctahedralConfig,
  formatTetrahedralConfig,
  toSuperscript,
} from '@/components/animations/c12-unit5/cft/cft-svg-helpers'
import {
  DEFAULT_D_COUNT,
  DEFAULT_LIGAND_INDEX,
  DEFAULT_PAIRING_ENERGY,
  LAB_LIGANDS,
  MAX_ENERGY_SCALE,
  MAX_PAIRING_ENERGY,
  MIN_PAIRING_ENERGY,
  computeCftLabSnapshot,
  type CftGeometry,
} from '@/lib/chem/cft-lab'
import styles from './crystal-field-splitting-lab.module.css'

const SVG_W = 640
const SVG_H = 360

export function CrystalFieldSplittingLab({ reducedMotion }: SimulationProps) {
  const [dCount, setDCount] = useState<number>(DEFAULT_D_COUNT)
  const [geometry, setGeometry] = useState<CftGeometry>('octahedral')
  const [ligandIndex, setLigandIndex] = useState<number>(DEFAULT_LIGAND_INDEX)
  const [pairingEnergy, setPairingEnergy] = useState<number>(DEFAULT_PAIRING_ENERGY)

  const snap = computeCftLabSnapshot(dCount, geometry, ligandIndex, pairingEnergy)

  const tStyle: React.CSSProperties | undefined = reducedMotion
    ? undefined
    : { transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }

  // Energy diagram layout on left side (x: 20..405)
  const baryY = 192
  const minGapPx = 68
  const maxGapPx = 220
  const gapPx = Math.round(minGapPx + (snap.deltaActive / MAX_ENERGY_SCALE) * (maxGapPx - minGapPx))
  const upperY = Math.round(baryY - snap.upperShiftFraction * gapPx)
  const lowerY = Math.round(baryY - snap.lowerShiftFraction * gapPx)
  const diagCx = 216

  const upperElectrons = fillSubshellSlots(snap.upperElectrons, snap.upperSlots)
  const lowerElectrons = fillSubshellSlots(snap.lowerElectrons, snap.lowerSlots)

  // Δ vs P comparison bar layout on right side (x: 425..624)
  const barBaseY = 286
  const barMaxH = 200
  const deltaBarH = Math.max(16, Math.round((snap.deltaActive / MAX_ENERGY_SCALE) * barMaxH))
  const pairingBarH = Math.max(16, Math.round((snap.pairingEnergy / MAX_ENERGY_SCALE) * barMaxH))
  const deltaSymbol = snap.geometry === 'octahedral' ? 'Δo' : 'Δt'
  const pairingLineY = barBaseY - pairingBarH

  const configDisplay =
    snap.geometry === 'octahedral'
      ? formatOctahedralConfig(snap.lowerElectrons, snap.upperElectrons)
      : formatTetrahedralConfig(snap.lowerElectrons, snap.upperElectrons)

  const liveSummary =
    `d${snap.d} ${snap.geometry} complex with ligand ${snap.ligand.display}: ` +
    `${deltaSymbol} is ${snap.deltaActive} kJ/mol, pairing energy P is ${snap.pairingEnergy} kJ/mol (illustrative). ` +
    `Configuration ${configDisplay}, ${snap.unpaired} unpaired electrons, ${snap.spinSummary}.`

  const upperShiftText = snap.geometry === 'octahedral' ? '+3/5 Δo' : '+2/5 Δt'
  const lowerShiftText = snap.geometry === 'octahedral' ? '−2/5 Δo' : '−3/5 Δt'

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        {/* d-electron count stepper + slider */}
        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label htmlFor="cft-d-count" className={styles.fieldLabel}>
              d electrons
            </label>
            <span className={styles.fieldValue}>{`d${toSuperscript(snap.d)}`}</span>
          </div>
          <div className={styles.stepperRow}>
            <button
              type="button"
              className={styles.stepBtn}
              aria-label="Decrease d electrons"
              disabled={dCount <= 1}
              onClick={() => setDCount((v) => Math.max(1, v - 1))}
            >
              −
            </button>
            <input
              id="cft-d-count"
              type="range"
              min={1}
              max={10}
              step={1}
              value={dCount}
              onChange={(e) => setDCount(Number(e.target.value))}
              className={styles.range}
            />
            <button
              type="button"
              className={styles.stepBtn}
              aria-label="Increase d electrons"
              disabled={dCount >= 10}
              onClick={() => setDCount((v) => Math.min(10, v + 1))}
            >
              +
            </button>
          </div>
        </div>

        {/* Geometry toggle */}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Geometry</span>
          <div className={styles.toggleGroup} role="group" aria-label="Complex geometry">
            <button
              type="button"
              className={styles.toggleBtn}
              aria-pressed={geometry === 'octahedral'}
              onClick={() => setGeometry('octahedral')}
            >
              Octahedral
            </button>
            <button
              type="button"
              className={styles.toggleBtn}
              aria-pressed={geometry === 'tetrahedral'}
              onClick={() => setGeometry('tetrahedral')}
            >
              Tetrahedral
            </button>
          </div>
        </div>

        {/* Spectrochemical ligand dropdown */}
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Ligand (spectrochemical series)</span>
          <select
            className={styles.select}
            aria-label="Ligand from spectrochemical series"
            value={ligandIndex}
            onChange={(e) => setLigandIndex(Number(e.target.value))}
          >
            {LAB_LIGANDS.map((lig, i) => (
              <option key={lig.formula} value={i}>
                {`${lig.rank}. ${lig.display} (Δo = ${lig.illustrativeDeltaO})`}
              </option>
            ))}
          </select>
        </label>

        {/* Pairing energy P slider */}
        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label htmlFor="cft-pairing-p" className={styles.fieldLabel}>
              Pairing energy P
            </label>
            <span className={styles.fieldValue}>{`${snap.pairingEnergy} kJ/mol`}</span>
          </div>
          <input
            id="cft-pairing-p"
            type="range"
            min={MIN_PAIRING_ENERGY}
            max={MAX_PAIRING_ENERGY}
            step={5}
            value={pairingEnergy}
            onChange={(e) => setPairingEnergy(Number(e.target.value))}
            className={styles.range}
          />
        </div>
      </div>

      {/* Main SVG stage */}
      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          role="img"
          aria-label={liveSummary}
        >
          {/* Left header */}
          <text x={216} y={28} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
            {snap.geometry === 'octahedral'
              ? `Octahedral d${toSuperscript(snap.d)} with ${snap.ligand.display}`
              : `Tetrahedral d${toSuperscript(snap.d)} with ${snap.ligand.display}`}
          </text>

          <EnergyAxis x={34} yTop={48} yBottom={324} />

          {/* Dashed barycentre line */}
          <line x1={54} y1={baryY} x2={396} y2={baryY} stroke={CFT_COLOR.subtle} strokeWidth={1.5} strokeDasharray="6 5" />
          <text
            x={diagCx}
            y={baryY + 5}
            textAnchor="middle"
            fontSize={15}
            fill={CFT_COLOR.muted}
            stroke={CFT_COLOR.surface}
            strokeWidth={5}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            Barycentre
          </text>

          {/* Splitting double arrow */}
          <SplitDoubleArrow x={76} yTop={upperY} yBottom={lowerY} color={CFT_COLOR.fg} transitionStyle={tStyle} />
          <text x={86} y={baryY + 5} fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
            {deltaSymbol}
          </text>

          {/* Upper level set */}
          <OrbitalLevelSet
            cx={diagCx}
            y={upperY}
            slots={snap.upperSlots}
            slotWidth={40}
            slotGap={12}
            stroke={CFT_COLOR.highRepulsion}
            electrons={upperElectrons}
            arrowHeight={30}
            transitionStyle={tStyle}
          />
          <text x={306} y={upperY + 5} fontSize={16} fontWeight={700} fill={CFT_COLOR.highRepulsion} style={tStyle}>
            {`${snap.upperLabel} (${upperShiftText})`}
          </text>

          {/* Lower level set */}
          <OrbitalLevelSet
            cx={diagCx}
            y={lowerY}
            slots={snap.lowerSlots}
            slotWidth={40}
            slotGap={12}
            stroke={CFT_COLOR.lowRepulsion}
            electrons={lowerElectrons}
            arrowHeight={30}
            transitionStyle={tStyle}
          />
          <text x={306} y={lowerY + 5} fontSize={16} fontWeight={700} fill={CFT_COLOR.lowRepulsion} style={tStyle}>
            {`${snap.lowerLabel} (${lowerShiftText})`}
          </text>

          {/* Tetrahedral ratio note inside diagram */}
          {snap.geometry === 'tetrahedral' && (
            <text x={216} y={338} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
              {`Δt = (4/9) Δo = ${snap.deltaActive} kJ/mol (low spin rarely observed)`}
            </text>
          )}

          {/* Vertical divider */}
          <line x1={416} y1={24} x2={416} y2={336} stroke={CFT_COLOR.border} strokeWidth={1.2} />

          {/* Right: Δ vs P bar chart */}
          <text x={526} y={28} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
            {`${deltaSymbol} vs P (illustrative)`}
          </text>

          {/* Horizontal P threshold line */}
          <line
            x1={444}
            y1={pairingLineY}
            x2={610}
            y2={pairingLineY}
            stroke={CFT_COLOR.pairing}
            strokeWidth={1.6}
            strokeDasharray="5 4"
            style={tStyle}
          />

          {/* Baseline */}
          <line x1={440} y1={barBaseY} x2={614} y2={barBaseY} stroke={CFT_COLOR.subtle} strokeWidth={1.5} />

          {/* Δ bar */}
          <rect
            x={462}
            y={barBaseY - deltaBarH}
            width={52}
            height={deltaBarH}
            rx={6}
            fill={snap.cheaperRoute === 'gap' ? CFT_COLOR.success : CFT_COLOR.highRepulsion}
            fillOpacity={0.28}
            stroke={snap.cheaperRoute === 'gap' ? CFT_COLOR.success : CFT_COLOR.highRepulsion}
            strokeWidth={snap.cheaperRoute === 'gap' ? 2.4 : 1.8}
            style={tStyle}
          />
          <text
            x={488}
            y={barBaseY - deltaBarH - 8}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={CFT_COLOR.fg}
            stroke={CFT_COLOR.surface}
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
            style={tStyle}
          >
            {snap.deltaActive}
          </text>
          <text x={488} y={barBaseY + 22} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
            {deltaSymbol}
          </text>

          {/* P bar */}
          <rect
            x={540}
            y={barBaseY - pairingBarH}
            width={52}
            height={pairingBarH}
            rx={6}
            fill={snap.cheaperRoute === 'pairing' ? CFT_COLOR.success : CFT_COLOR.pairing}
            fillOpacity={0.28}
            stroke={snap.cheaperRoute === 'pairing' ? CFT_COLOR.success : CFT_COLOR.pairing}
            strokeWidth={snap.cheaperRoute === 'pairing' ? 2.4 : 1.8}
            style={tStyle}
          />
          <text
            x={566}
            y={barBaseY - pairingBarH - 8}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={CFT_COLOR.fg}
            stroke={CFT_COLOR.surface}
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
            style={tStyle}
          >
            {snap.pairingEnergy}
          </text>
          <text x={566} y={barBaseY + 22} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
            P
          </text>

          {/* Cheaper route summary under bars */}
          <text x={526} y={338} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.success}>
            {snap.cheaperRoute === 'gap' ? `${deltaSymbol} < P: gap is cheaper` : `${deltaSymbol} ≥ P: pairing is cheaper`}
          </text>
        </svg>
      </div>

      {/* Readout cards */}
      <div className={styles.readouts}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Configuration</p>
          <p className={styles.cardValue}>{configDisplay}</p>
          <p className={styles.cardSub}>{`Ligand rank ${snap.ligand.rank} of ${LAB_LIGANDS.length} (${snap.ligand.display})`}</p>
        </div>

        <div className={styles.card}>
          <p className={styles.cardLabel}>Unpaired electrons</p>
          <p className={styles.cardValue}>{snap.unpaired}</p>
          <p className={styles.cardSub}>{snap.unpaired === 0 ? 'Diamagnetic (all paired)' : 'Paramagnetic'}</p>
        </div>

        <div className={styles.card}>
          <p className={styles.cardLabel}>Field and spin state</p>
          <p className={styles.cardValue}>{snap.spinSummary}</p>
          <p className={styles.cardSub}>
            {snap.geometry === 'octahedral'
              ? `Δo = ${snap.deltaO} kJ/mol, P = ${snap.pairingEnergy} kJ/mol`
              : `Δt = (4/9) Δo = ${snap.deltaActive} kJ/mol`}
          </p>
        </div>
      </div>

      <p className={styles.disclaimer}>
        Ligand order follows the NCERT spectrochemical series (Unit 5, p. 132). Numeric Δo and P values are an illustrative scale, not NCERT data.
      </p>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
