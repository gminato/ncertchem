'use client'

import { useState } from 'react'
import { Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { PlotFrame, PlotPoint } from '@/components/vocab/kinetics'
import { PolarBond } from '@/components/vocab/organic6'
import { formatDipole, type CarbonHalogenBond, type Halogen } from '@/lib/chem/ncert-c12-unit6-data'
import { CX_HALOGENS, bondRow, bondSummary, largestDipoleRow } from '@/lib/chem/c-x-bond-model'
import styles from './c-x-bond-explorer.module.css'

const OPTIONS = CX_HALOGENS.map((h) => ({ value: h, label: h }))

interface ChartSpec {
  yTitle: string
  domain: { yMin: number; yMax: number }
  yTicks: number[]
  yFormat: (v: number) => string
  pick: (row: CarbonHalogenBond) => number
  label: (row: CarbonHalogenBond) => string
}

const CHARTS: readonly ChartSpec[] = [
  {
    yTitle: 'bond length / pm',
    domain: { yMin: 0, yMax: 250 },
    yTicks: [0, 50, 100, 150, 200, 250],
    yFormat: (v) => String(v),
    pick: (r) => r.lengthPm,
    label: (r) => `${r.lengthPm} pm`,
  },
  {
    yTitle: 'bond enthalpy / kJ mol⁻¹',
    domain: { yMin: 0, yMax: 550 },
    yTicks: [0, 100, 200, 300, 400, 500],
    yFormat: (v) => String(v),
    pick: (r) => r.enthalpyKjPerMol,
    label: (r) => `${r.enthalpyKjPerMol}`,
  },
  {
    yTitle: 'dipole moment / D',
    domain: { yMin: 0, yMax: 2.5 },
    yTicks: [0, 0.5, 1, 1.5, 2, 2.5],
    yFormat: (v) => v.toFixed(1),
    pick: (r) => r.dipoleDebye,
    label: (r) => formatDipole(r.dipoleDebye),
  },
]

function TrendChart({ spec, selected }: { spec: ChartSpec; selected: Halogen }) {
  const selectedIndex = CX_HALOGENS.indexOf(selected)
  return (
    <svg className={styles.chart} viewBox="0 0 300 250" role="img" aria-label={`${spec.yTitle} for CH₃–F, CH₃–Cl, CH₃–Br and CH₃–I, with ${selected} highlighted`}>
      <PlotFrame
        x={66}
        y={14}
        width={222}
        height={180}
        domain={{ xMin: -0.6, xMax: 3.6, yMin: spec.domain.yMin, yMax: spec.domain.yMax }}
        xTicks={[0, 1, 2, 3]}
        xTickFormat={(v) => CX_HALOGENS[v] ?? ''}
        yTicks={spec.yTicks}
        yTickFormat={spec.yFormat}
        xTitle="halogen"
        yTitle={spec.yTitle}
      >
        {CX_HALOGENS.map((h, i) => {
          const row = bondRow(h)
          const isSelected = i === selectedIndex
          return (
            <PlotPoint
              key={h}
              at={{ x: i, y: spec.pick(row) }}
              tone={isSelected ? 'accent' : 'neutral'}
              label={isSelected ? spec.label(row) : undefined}
              side="above"
            />
          )
        })}
      </PlotFrame>
    </svg>
  )
}

export function CXBondExplorer(_props: SimulationProps) {
  const [halogen, setHalogen] = useState<Halogen>('Cl')
  const row = bondRow(halogen)
  const largest = largestDipoleRow()

  return (
    <div className={styles.sim}>
      <SimulationControls>
        <Segmented label="Halogen X in CH₃–X" options={OPTIONS} value={halogen} onChange={setHalogen} />
      </SimulationControls>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox="95 40 370 150" role="img" aria-label={`CH₃–${halogen} drawn to scale with its bond length in pm, δ+ and δ− and a dipole arrow`}>
          <PolarBond halogen={halogen} lengthPm={row.lengthPm} unitsPerPm={1} ruler dipole />
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>C–X bond length</span>
          <span className={styles.statValue}>{row.lengthPm} pm</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Bond enthalpy</span>
          <span className={styles.statValue}>{row.enthalpyKjPerMol} kJ mol⁻¹</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Dipole moment</span>
          <span className={styles.statValue}>{formatDipole(row.dipoleDebye)}</span>
        </div>
      </div>

      <div className={styles.charts}>
        {CHARTS.map((spec) => (
          <TrendChart key={spec.yTitle} spec={spec} selected={halogen} />
        ))}
      </div>

      <p className={styles.note}>
        The largest dipole in Table 6.2 belongs to {largest.unicode}. Bond polarity and bond length both feed into the dipole, so the values do not climb steadily down the group.
      </p>

      <p className={styles.srOnly} aria-live="polite">
        {bondSummary(halogen)}
      </p>
    </div>
  )
}
