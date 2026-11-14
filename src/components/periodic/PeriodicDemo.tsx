'use client'

import React, { useState } from 'react'
import { PeriodicTable } from './PeriodicTable'
import type { CellStyle } from './PeriodicTable'
import { ScaleLegend } from './ScaleLegend'
import { TrendChart } from './TrendChart'
import { AtomSizeRow } from './AtomSizeRow'
import { ElementTile } from './ElementTile'
import {
  MISSING_FILL,
  SEQUENTIAL_VIRIDIS,
  divergingRamp,
  divergingScale,
  sequentialScale,
} from './colour-scale'
import { FIXTURE_ELEMENTS, fixturePosition } from './fixture'
import type { ElementRecord } from './types'

const ELECTRONEGATIVITY_DOMAIN: [number, number] = [0.8, 4]
const AFFINITY_DOMAIN: [number, number] = [-0.5, 3.6]

const electronegativityFill = sequentialScale(ELECTRONEGATIVITY_DOMAIN, SEQUENTIAL_VIRIDIS)
const affinityFill = divergingScale(AFFINITY_DOMAIN, 0)

/** Cell styling for the electronegativity heatmap. Missing values hatch. */
function electronegativityCell(el: ElementRecord): CellStyle {
  const fill = electronegativityFill(el.electronegativity)
  if (fill === null) return { fill: MISSING_FILL, value: '—' }
  return { fill, value: el.electronegativity?.toFixed(2) }
}

/** Cell styling for the electron affinity heatmap. Signed around zero. */
function affinityCell(el: ElementRecord): CellStyle {
  const fill = affinityFill(el.electronAffinity)
  if (fill === null) return { fill: MISSING_FILL, value: '—' }
  return { fill, value: el.electronAffinity?.toFixed(2) }
}

const PERIOD_TWO = FIXTURE_ELEMENTS.filter((el) => el.period === 2).sort((a, b) => a.Z - b.Z)
const PERIOD_TWO_POINTS = PERIOD_TWO.map((el) => ({
  x: el.Z,
  y: el.firstIonizationEnergyEv,
  label: el.symbol,
}))

/** Boron and oxygen are the two dips in period 2. */
const B_INDEX = PERIOD_TWO.findIndex((el) => el.symbol === 'B')
const O_INDEX = PERIOD_TWO.findIndex((el) => el.symbol === 'O')

const SODIUM = FIXTURE_ELEMENTS.find((el) => el.symbol === 'Na') ?? null

/** Eka-aluminium: Mendeleev's 1871 prediction, later found as gallium. */
const EKA_ALUMINIUM: ElementRecord = {
  Z: 31,
  symbol: 'Ea',
  name: 'Eka-aluminium',
  atomicMass: 68,
  group: 13,
  period: 4,
  block: 'p',
  category: 'metal',
  electronegativity: null,
  firstIonizationEnergyEv: null,
  electronAffinity: null,
  atomicRadius: null,
}

export function PeriodicDemo() {
  const [selected, setSelected] = useState<number | undefined>(11)
  const [lastPicked, setLastPicked] = useState<string | null>(null)

  return (
    <div>
      {/* 1. Full table: block shading, group and period numbers, keyboard navigable */}
      <PeriodicTable
        elements={FIXTURE_ELEMENTS}
        position={fixturePosition}
        variant="full"
        blockShading
        showGroupNumbers
        showPeriodNumbers
        selected={selected}
        onSelect={(el) => {
          setSelected(el.Z)
          setLastPicked(`${el.name}, Z ${el.Z}`)
        }}
        title="Periodic table of the fixture elements, shaded by block"
      />
      <p role="status" aria-live="polite" style={{ fontSize: '0.85rem', color: 'var(--fg-muted)', margin: '8px 0 0' }}>
        {lastPicked ? `Selected ${lastPicked}` : 'Use the arrow keys to move, Enter to select.'}
      </p>

      <Divider />

      {/* 2. Compact heatmap with its legend */}
      <div style={{ display: 'grid', gap: 24 }}>
        <div>
          <PeriodicTable
            elements={FIXTURE_ELEMENTS}
            position={fixturePosition}
            variant="compact"
            cell={electronegativityCell}
            showGroupNumbers
            title="Heatmap of electronegativity for the fixture elements"
          />
          <div style={{ marginTop: 16 }}>
            <ScaleLegend
              stops={SEQUENTIAL_VIRIDIS}
              domain={ELECTRONEGATIVITY_DOMAIN}
              unit="Pauling"
              label="Electronegativity"
              kind="sequential"
            />
          </div>
        </div>

        <div>
          <PeriodicTable
            elements={FIXTURE_ELEMENTS}
            position={fixturePosition}
            variant="compact"
            cell={affinityCell}
            showGroupNumbers
            title="Heatmap of electron affinity for the fixture elements, diverging around zero"
          />
          <div style={{ marginTop: 16 }}>
            <ScaleLegend
              stops={divergingRamp()}
              domain={AFFINITY_DOMAIN}
              unit="eV"
              label="Electron affinity"
              kind="diverging"
              midpoint={0}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* 3. Trend chart with an anomaly callout for each dip in period 2 */}
      <TrendChart
        points={PERIOD_TWO_POINTS}
        xLabel="Atomic number, Z"
        yLabel="First ionisation energy (eV)"
        yDomain={[0, 25]}
        highlight={[
          { index: B_INDEX, text: 'B dips: the 2p electron is shielded' },
          { index: O_INDEX, text: 'O dips: paired electrons repel' },
        ].filter((h) => h.index >= 0)}
        title="First ionisation energy across period 2, with dips at boron and oxygen"
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
        <ElementTile element={SODIUM} configuration="[Ne] 3s1" />
        <ElementTile element={EKA_ALUMINIUM} predicted />
      </div>

    </div>
  )
}

function Divider() {
  return <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '32px 0' }} />
}
