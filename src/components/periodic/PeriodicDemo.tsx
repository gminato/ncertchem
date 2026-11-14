'use client'

import React, { useState } from 'react'
import { PeriodicTable } from './PeriodicTable'
import type { CellStyle } from './PeriodicTable'
import { ScaleLegend } from './ScaleLegend'
import { TrendChart } from './TrendChart'
import type { TrendHighlight } from './TrendChart'
import { AtomSizeRow } from './AtomSizeRow'
import { ElementTile } from './ElementTile'
import { MISSING_FILL, SEQUENTIAL_VIRIDIS, divergingRamp, divergingScale, sequentialScale } from './colour-scale'
import { displayName } from './layout'
import type { ElementRecord } from './types'
import {
  PERIODIC_TABLE,
  elementByZ,
  ionizationAnomalies,
  outerConfiguration,
  tablePosition,
} from '../../lib/chem/periodic-data'
import type { IonizationAnomalyReason } from '../../lib/chem/periodic-data'

const EV_TO_KJ_PER_MOL = 96.485

const EN_DOMAIN: [number, number] = [0.7, 4]
/** Electron gain enthalpy in kJ mol⁻¹. Negative means energy is released. */
const GAIN_DOMAIN: [number, number] = [-360, 60]

const electronegativityFill = sequentialScale(EN_DOMAIN, SEQUENTIAL_VIRIDIS)
const gainFill = divergingScale(GAIN_DOMAIN, 0)

function electronegativityCell(el: ElementRecord): CellStyle {
  const fill = electronegativityFill(el.electronegativity)
  if (fill === null) return { fill: MISSING_FILL, value: '—' }
  return { fill, value: (el.electronegativity as number).toFixed(2) }
}

function gainKjPerMol(el: ElementRecord): number | null {
  return el.electronAffinityEv === null ? null : -el.electronAffinityEv * EV_TO_KJ_PER_MOL
}

function gainCell(el: ElementRecord): CellStyle {
  const kj = gainKjPerMol(el)
  const fill = gainFill(kj)
  if (fill === null) return { fill: MISSING_FILL, value: '—' }
  return { fill, value: Math.round(kj as number).toString() }
}

// Period 2, main-group elements, in atomic-number order (Li to Ne).
const PERIOD_TWO = PERIODIC_TABLE.filter((e) => e.period === 2 && (e.block === 's' || e.block === 'p')).sort(
  (a, b) => a.Z - b.Z
)
const PERIOD_TWO_POINTS = PERIOD_TWO.map((el) => ({
  x: el.Z,
  y: el.firstIonizationEnergyKjPerMol,
  label: el.symbol,
}))

const REASON_TEXT: Record<IonizationAnomalyReason, string> = {
  'p-electron-shielded': 'the 2p electron is shielded',
  'paired-electron-repulsion': 'paired electrons repel',
}

/** Dips in the data, with NCERT's reasons, mapped onto the period-2 points. */
const PERIOD_TWO_HIGHLIGHTS: TrendHighlight[] = ionizationAnomalies(2).flatMap((a) => {
  const index = PERIOD_TWO.findIndex((el) => el.Z === a.to)
  if (index < 0) return []
  return [{ index, text: `${elementByZ(a.to).symbol} dips: ${REASON_TEXT[a.reason]}` }]
})

/** Mendeleev's 1871 prediction (eka-aluminium). Its values are unknown, shown as "?". */
const EKA_ALUMINIUM: ElementRecord = {
  Z: 31,
  symbol: 'Ea',
  name: 'Eka-aluminium',
  atomicMass: 68,
  group: 13,
  period: 4,
  block: 'p',
  fBlockRow: null,
  category: 'metal',
  pubchemGroupBlock: '',
  electronegativity: null,
  atomicRadiusPm: null,
  firstIonizationEnergyEv: null,
  firstIonizationEnergyKjPerMol: null,
  electronAffinityEv: null,
  standardState: '',
}

const SODIUM = elementByZ(11)

export function PeriodicDemo() {
  const [selected, setSelected] = useState<number>(11)
  const picked = PERIODIC_TABLE.find((e) => e.Z === selected) ?? SODIUM

  return (
    <div>
      {/* 1. Full 118-element table, shaded by block */}
      <PeriodicTable
        elements={PERIODIC_TABLE}
        position={tablePosition}
        variant="full"
        blockShading
        showGroupNumbers
        showPeriodNumbers
        selected={selected}
        onSelect={(el) => setSelected(el.Z)}
        title="Periodic table of the elements, shaded by block"
      />
      <p role="status" aria-live="polite" style={{ fontSize: '0.9rem', color: 'var(--fg)', margin: '12px 0 0' }}>
        {`${displayName(picked)} (${picked.symbol}), Z ${picked.Z}, atomic mass ${picked.atomicMass.toFixed(picked.atomicMass < 100 ? 2 : 1)} u. `}
        <span style={{ color: 'var(--fg-subtle)' }}>Use the arrow keys to move and Enter to select.</span>
      </p>

      <Divider />

      {/* 2. Heatmaps with legends */}
      <div style={{ display: 'grid', gap: 32 }}>
        <div>
          <PeriodicTable
            elements={PERIODIC_TABLE}
            position={tablePosition}
            variant="compact"
            cell={electronegativityCell}
            showGroupNumbers
            title="Heatmap of Pauling electronegativity for all elements"
          />
          <div style={{ marginTop: 16 }}>
            <ScaleLegend
              stops={SEQUENTIAL_VIRIDIS}
              domain={EN_DOMAIN}
              unit="Pauling"
              label="Electronegativity"
              kind="sequential"
            />
          </div>
        </div>

        <div>
          <PeriodicTable
            elements={PERIODIC_TABLE}
            position={tablePosition}
            variant="compact"
            cell={gainCell}
            showGroupNumbers
            title="Heatmap of electron gain enthalpy for all elements, diverging around zero"
          />
          <div style={{ marginTop: 16 }}>
            <ScaleLegend
              stops={divergingRamp()}
              domain={GAIN_DOMAIN}
              unit="kJ mol⁻¹"
              label="Electron gain enthalpy"
              kind="diverging"
              midpoint={0}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* 3. Ionization enthalpy across period 2, with the data's own dips called out */}
      <TrendChart
        points={PERIOD_TWO_POINTS}
        xLabel="Atomic number, Z"
        yLabel={
          <>
            First ionization enthalpy, <tspan className="sym">Δ</tspan>
            <tspan className="sym" baselineShift="sub" fontSize="0.75em">
              i
            </tspan>
            <tspan className="sym">H</tspan> / kJ mol⁻¹
          </>
        }
        yDomain={[0, 2500]}
        highlight={PERIOD_TWO_HIGHLIGHTS}
        title="First ionization enthalpy across period 2, with dips at boron and oxygen"
      />

      <Divider />

      {/* 4. Isoelectronic species: same electron count, different nuclear charge */}
      <AtomSizeRow
        items={[
          { label: 'O', charge: '2−', sublabel: '140 pm', radiusPm: 140 },
          { label: 'F', charge: '−', sublabel: '133 pm', radiusPm: 133 },
          { label: 'Na', charge: '+', sublabel: '102 pm', radiusPm: 102 },
          { label: 'Mg', charge: '2+', sublabel: '72 pm', radiusPm: 72 },
        ]}
        nucleus
        title="Ionic radii of four isoelectronic 10-electron species, from O2- (140 pm) to Mg2+ (72 pm)"
      />

      <Divider />

      {/* 5. Element tiles: one observed, one predicted */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <ElementTile element={SODIUM} configuration={outerConfiguration(11) ?? undefined} />
        <ElementTile element={EKA_ALUMINIUM} predicted />
      </div>
    </div>
  )
}

function Divider() {
  return <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '32px 0' }} />
}
