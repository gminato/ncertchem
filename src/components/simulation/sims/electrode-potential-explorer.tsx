'use client'

import React, { useRef, useState, useId, type ReactNode } from 'react'
import { Button } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import { PotentialLadder } from '@/components/redox/PotentialLadder'
import { formatTrueMinus } from '@/components/redox/geometry'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  EXPLORER_COUPLES,
  getLadderCouples,
  analyseGalvanicCell,
} from './electrode-cell-model'
import styles from './electrode-potential-explorer.module.css'

interface CellPreset {
  id: string
  label: string
  c1: string
  c2: string
}

const PRESETS: readonly CellPreset[] = [
  { id: 'daniell', label: 'Daniell Cell (Zn | Cu)', c1: 'zn', c2: 'cu' },
  { id: 'zn-ag', label: 'Silver–Zinc Cell (Zn | Ag)', c1: 'zn', c2: 'ag' },
  { id: 'fe-cu', label: 'Iron–Copper Cell (Fe | Cu)', c1: 'fe', c2: 'cu' },
  { id: 'mg-she', label: 'Magnesium–Hydrogen (Mg | H₂)', c1: 'mg', c2: 'she' },
  { id: 'al-cu', label: 'Aluminium–Copper (Al | Cu)', c1: 'al', c2: 'cu' },
  { id: 'ni-ag', label: 'Nickel–Silver (Ni | Ag)', c1: 'ni', c2: 'ag' },
]

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{children}</span>
    </div>
  )
}

export function ElectrodePotentialExplorer(_props: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const _active = useIsActive(rootRef)

  const [couple1Id, setCouple1Id] = useState<string>('zn')
  const [couple2Id, setCouple2Id] = useState<string>('cu')
  const [activePreset, setActivePreset] = useState<string | null>('daniell')

  const cell = analyseGalvanicCell(couple1Id, couple2Id)

  const applyPreset = (p: CellPreset) => {
    setCouple1Id(p.c1)
    setCouple2Id(p.c2)
    setActivePreset(p.id)
  }

  const handleSelect1 = (id: string) => {
    setCouple1Id(id)
    setActivePreset(null)
  }

  const handleSelect2 = (id: string) => {
    setCouple2Id(id)
    setActivePreset(null)
  }

  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const arrowRightId = `epe-arr-r-${idPrefix}`
  const arrowLeftId = `epe-arr-l-${idPrefix}`
  const clipAnodeId = `epe-an-clip-${idPrefix}`
  const clipCathodeId = `epe-cat-clip-${idPrefix}`

  // Schematic geometry
  const bW = 124
  const bH = 120
  const anX = 130
  const catX = 410
  const wireY = 46
  const rodTopY = 75
  const rodBottomY = 220
  const bTop = 120
  const liquidY = 150
  const bBottom = bTop + bH

  return (
    <div ref={rootRef} className={styles.sim} data-testid="electrode-potential-explorer">
      {/* Quick Presets */}
      <div className={styles.presets} role="group" aria-label="Electrochemical Cell Presets">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            variant={activePreset === p.id ? 'primary' : 'secondary'}
            onClick={() => applyPreset(p)}
            aria-pressed={activePreset === p.id}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Left Column: Table 7.1 Potential Ladder with live highlights */}
        <div className={styles.ladderCard}>
          <h4 className={styles.ladderCardTitle}>Standard Reduction Potentials Ladder</h4>
          <svg
            viewBox="0 0 760 460"
            className={styles.ladderSvg}
            role="img"
            aria-label={`Electrode potential ladder highlighting cathode ${cell.cathode.name} and anode ${cell.anode.name}`}
            data-testid="potential-ladder-svg"
          >
            <PotentialLadder
              couples={getLadderCouples(cell.cathode.id, cell.anode.id)}
              highlight={[cell.cathode.id, cell.anode.id]}
              range={[-3.3, 3.2]}
            />
          </svg>
          <p className={styles.ladderCaption}>
            Couples arranged by standard reduction potential <span className="sym">E</span>° (Table 7.1).
            The couple higher on the ladder is the cathode (reduction); the lower is the anode (oxidation).
          </p>
        </div>

        {/* Right Column: Schematic and Chemical Analysis Card */}
        <div className={styles.detailCol}>
          {/* Cell Schematic */}
          <div className={styles.schematicCard}>
            <svg
              viewBox="0 0 540 310"
              className={styles.schematicSvg}
              role="img"
              aria-label={`Galvanic cell schematic with ${cell.anode.name} anode on left and ${cell.cathode.name} cathode on right`}
              data-testid="cell-schematic-svg"
            >
              <defs>
                <clipPath id={clipAnodeId}>
                  <rect x={anX - bW / 2} y={bTop} width={bW} height={bH} rx={8} />
                </clipPath>
                <clipPath id={clipCathodeId}>
                  <rect x={catX - bW / 2} y={bTop} width={bW} height={bH} rx={8} />
                </clipPath>

                <marker
                  id={arrowRightId}
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--electron)" />
                </marker>
                <marker
                  id={arrowLeftId}
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--fg-muted)" />
                </marker>
              </defs>

              {/* 1. Anode Compartment (Left) */}
              <g>
                <g clipPath={`url(#${clipAnodeId})`}>
                  <rect
                    x={anX - bW / 2 - 2}
                    y={liquidY}
                    width={bW + 4}
                    height={bBottom - liquidY + 4}
                    fill={cell.anode.solutionToken}
                    opacity={0.3}
                  />
                  <line
                    x1={anX - bW / 2}
                    y1={liquidY}
                    x2={anX + bW / 2}
                    y2={liquidY}
                    stroke="var(--fg-muted)"
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                </g>
                {/* Electrode rod */}
                <rect
                  x={anX - 12}
                  y={rodTopY}
                  width={24}
                  height={rodBottomY - rodTopY}
                  rx={3}
                  fill={cell.anode.colorToken}
                  stroke="var(--fg-muted)"
                  strokeWidth={1.2}
                />
                {/* Beaker outline */}
                <path
                  d={`M ${anX - bW / 2 - 2} ${bTop} L ${anX - bW / 2} ${bTop + 4} L ${anX - bW / 2} ${bBottom - 8} Q ${anX - bW / 2} ${bBottom} ${anX - bW / 2 + 8} ${bBottom} L ${anX + bW / 2 - 8} ${bBottom} Q ${anX + bW / 2} ${bBottom} ${anX + bW / 2} ${bBottom - 8} L ${anX + bW / 2} ${bTop + 4} L ${anX + bW / 2 + 2} ${bTop}`}
                  fill="none"
                  stroke="var(--glass-wall)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {/* Anode label in --ox (amber) */}
                <text
                  x={anX}
                  y={bBottom + 16}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--ox)"
                >
                  Anode ({formatTrueMinus('−')}): {cell.anode.metalName}
                </text>
                <text
                  x={anX}
                  y={bBottom + 34}
                  textAnchor="middle"
                  fontSize={12.5}
                  fill="var(--fg-muted)"
                >
                  {cell.anode.solutionLabel}
                </text>
              </g>

              {/* 2. Cathode Compartment (Right) */}
              <g>
                <g clipPath={`url(#${clipCathodeId})`}>
                  <rect
                    x={catX - bW / 2 - 2}
                    y={liquidY}
                    width={bW + 4}
                    height={bBottom - liquidY + 4}
                    fill={cell.cathode.solutionToken}
                    opacity={0.35}
                  />
                  <line
                    x1={catX - bW / 2}
                    y1={liquidY}
                    x2={catX + bW / 2}
                    y2={liquidY}
                    stroke="var(--fg-muted)"
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                </g>
                {/* Electrode rod */}
                <rect
                  x={catX - 12}
                  y={rodTopY}
                  width={24}
                  height={rodBottomY - rodTopY}
                  rx={3}
                  fill={cell.cathode.colorToken}
                  stroke="var(--fg-muted)"
                  strokeWidth={1.2}
                />
                {/* Beaker outline */}
                <path
                  d={`M ${catX - bW / 2 - 2} ${bTop} L ${catX - bW / 2} ${bTop + 4} L ${catX - bW / 2} ${bBottom - 8} Q ${catX - bW / 2} ${bBottom} ${catX - bW / 2 + 8} ${bBottom} L ${catX + bW / 2 - 8} ${bBottom} Q ${catX + bW / 2} ${bBottom} ${catX + bW / 2} ${bBottom - 8} L ${catX + bW / 2} ${bTop + 4} L ${catX + bW / 2 + 2} ${bTop}`}
                  fill="none"
                  stroke="var(--glass-wall)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {/* Cathode label in --red (indigo) */}
                <text
                  x={catX}
                  y={bBottom + 16}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--red)"
                >
                  Cathode (+): {cell.cathode.metalName}
                </text>
                <text
                  x={catX}
                  y={bBottom + 34}
                  textAnchor="middle"
                  fontSize={12.5}
                  fill="var(--fg-muted)"
                >
                  {cell.cathode.solutionLabel}
                </text>
              </g>

              {/* 3. Salt Bridge */}
              <g>
                <path
                  d={`M ${anX + 22} 185 L ${anX + 22} 118 Q ${anX + 22} 104 ${anX + 38} 104 L ${catX - 38} 104 Q ${catX - 22} 104 ${catX - 22} 118 L ${catX - 22} 185 L ${catX - 38} 185 L ${catX - 38} 120 Q ${catX - 38} 114 ${catX - 46} 114 L ${anX + 46} 114 Q ${anX + 38} 114 ${anX + 38} 120 L ${anX + 38} 185 Z`}
                  fill="var(--surface)"
                  stroke="var(--glass-wall)"
                  strokeWidth={1.5}
                />
                <rect
                  x={270 - 45}
                  y={96}
                  width={90}
                  height={20}
                  rx={4}
                  fill="var(--surface-raised)"
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={270}
                  y={106.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11.5}
                  fontWeight={600}
                  fill="var(--fg)"
                >
                  KCl salt bridge
                </text>

                {/* Ion migration indicators */}
                {!cell.isIdentical && (
                  <g>
                    <text x={anX + 48} y={135} fontSize={12} fontWeight={600} fill="var(--ox)">
                      {formatTrueMinus('Cl⁻ →')}
                    </text>
                    <text x={catX - 68} y={135} fontSize={12} fontWeight={600} fill="var(--red)">
                      → K⁺
                    </text>
                  </g>
                )}
              </g>

              {/* 4. Overhead wire and voltmeter */}
              <g>
                <path
                  d={`M ${anX} ${rodTopY} L ${anX} ${wireY} L 244 ${wireY}`}
                  fill="none"
                  stroke="var(--fg-muted)"
                  strokeWidth={2}
                />
                <path
                  d={`M 296 ${wireY} L ${catX} ${wireY} L ${catX} ${rodTopY}`}
                  fill="none"
                  stroke="var(--fg-muted)"
                  strokeWidth={2}
                />

                {/* Voltmeter meter body */}
                <g transform={`translate(270, ${wireY})`}>
                  <circle cx={0} cy={0} r={24} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.8} />
                  <text x={0} y={-4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--fg-muted)">
                    V
                  </text>
                  <line
                    x1={0}
                    y1={5}
                    x2={cell.isIdentical ? 0 : 10}
                    y2={cell.isIdentical ? -8 : -10}
                    stroke={cell.isIdentical ? 'var(--fg-muted)' : 'var(--heat)'}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <circle cx={0} cy={5} r={2.5} fill="var(--fg)" />

                  {/* Readout badge */}
                  <g transform="translate(0, 32)">
                    <rect
                      x={-44}
                      y={-12}
                      width={88}
                      height={24}
                      rx={4}
                      fill="var(--surface-raised)"
                      stroke="var(--border)"
                      strokeWidth={1.2}
                    />
                    <text
                      x={0}
                      y={0.5}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13.5}
                      fontWeight={700}
                      fill={cell.isIdentical ? 'var(--fg-muted)' : 'var(--fg)'}
                    >
                      {cell.isIdentical ? '0.00' : `+${cell.e0Cell.toFixed(2)}`} <tspan className="sym">V</tspan>
                    </text>
                  </g>
                </g>

                {/* Direction indicators */}
                {!cell.isIdentical && (
                  <g>
                    {/* Electron flow arrow: Anode -> Cathode */}
                    <g transform={`translate(${catX - 60}, ${wireY - 10})`}>
                      <line x1={-16} y1={0} x2={14} y2={0} stroke="var(--electron)" strokeWidth={1.5} markerEnd={`url(#${arrowRightId})`} />
                      <text x={-2} y={-8} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--electron)">
                        <tspan className="sym">e</tspan>⁻ flow
                      </text>
                    </g>

                    {/* Conventional Current: Cathode -> Anode */}
                    <g transform={`translate(${anX + 60}, ${wireY - 10})`}>
                      <line x1={16} y1={0} x2={-14} y2={0} stroke="var(--fg-muted)" strokeWidth={1.5} markerEnd={`url(#${arrowLeftId})`} />
                      <text x={2} y={-8} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--fg-muted)">
                        Current (<tspan className="sym">I</tspan>)
                      </text>
                    </g>
                  </g>
                )}
              </g>
            </svg>
          </div>

          {/* Chemical Analysis Card */}
          <div className={styles.card} data-testid="cell-analysis-card">
            <Row label={<><span className="sym">E</span>°cell calculation</>}>
              <strong data-testid="cell-emf-readout">
                {cell.isIdentical ? (
                  '0.00 V'
                ) : (
                  <>
                    <span className="sym">E</span>°(cathode) − <span className="sym">E</span>°(anode) = +{cell.e0Cathode.toFixed(2)} <span className="sym">V</span> − ({formatTrueMinus(cell.e0Anode >= 0 ? `+${cell.e0Anode.toFixed(2)}` : `−${Math.abs(cell.e0Anode).toFixed(2)}`)} <span className="sym">V</span>) = +{cell.e0Cell.toFixed(2)} <span className="sym">V</span>
                  </>
                )}
              </strong>
            </Row>

            <Row label={<span className={styles.badgeRed}>Cathode (+)</span>}>
              <span>{cell.cathode.name}: {cell.cathode.halfReductionStr} (Reduction)</span>
            </Row>

            <Row label={<span className={styles.badgeOx}>Anode (−)</span>}>
              <span>{cell.anode.name}: {cell.anode.halfOxidationStr} (Oxidation)</span>
            </Row>

            <Row label="Spontaneous reaction">
              <strong data-testid="overall-reaction">{cell.overallReaction}</strong>
            </Row>

            <Row label="Oxidant & Reductant">
              <span>
                Oxidant: <strong className={styles.badgeRed}>{cell.oxidant}</strong> (reduced); Reductant: <strong className={styles.badgeOx}>{cell.reductant}</strong> (oxidised)
              </span>
            </Row>

            <Row label="IUPAC cell notation">
              <code style={{ fontSize: '0.9rem' }}>{cell.cellNotation}</code>
            </Row>
          </div>
        </div>
      </div>

      {/* Accessible live text summary */}
      <p className={styles.live} aria-live="polite" data-testid="cell-summary-live">
        {cell.summaryText}
      </p>

      {/* Controls row */}
      <SimulationControls>
        <div className={styles.controlRow}>
          <div className={styles.selectGroup}>
            <label htmlFor="couple1-select" className={styles.selectLabel}>
              Couple 1 (Left selection)
            </label>
            <select
              id="couple1-select"
              className={styles.select}
              value={couple1Id}
              onChange={(e) => handleSelect1(e.target.value)}
              data-testid="couple1-select"
            >
              {EXPLORER_COUPLES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.e0 >= 0 ? '+' : ''}{c.e0.toFixed(2)} V)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label htmlFor="couple2-select" className={styles.selectLabel}>
              Couple 2 (Right selection)
            </label>
            <select
              id="couple2-select"
              className={styles.select}
              value={couple2Id}
              onChange={(e) => handleSelect2(e.target.value)}
              data-testid="couple2-select"
            >
              {EXPLORER_COUPLES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.e0 >= 0 ? '+' : ''}{c.e0.toFixed(2)} V)
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              setCouple1Id('zn')
              setCouple2Id('cu')
              setActivePreset('daniell')
            }}
          >
            Reset to Daniell Cell
          </Button>
        </div>
      </SimulationControls>
    </div>
  )
}
