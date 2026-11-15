'use client'

import { SealedVessel } from '@/components/equilibrium'
import { Label } from '@/components/vocab'
import { formatConstant } from '../kpkc/kpkc-steps'
import { CACO3_KP_1100K } from '@/lib/chem/heterogeneous'
import {
  CO2_CONCENTRATION_AT_EQUILIBRIUM,
  DIAL_MAX_BAR,
  HET_T,
  HET_V,
  GAS_PARTICLES_PER_MOL,
  PARTICLES_PER_MOL,
  hetSteps,
  type HetStep,
  type VesselView,
} from './heterogeneous-steps'

export interface HeterogeneousProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 760
const VIEW_HEIGHT = 368
const STEPS = hetSteps()
const VESSEL_Y = 40
const VESSEL_X = { a: 0, b: 400 } as const
const CO2_COLOUR = 'var(--no2)'
const SOLID_COLOUR = 'var(--fg-muted)'

/** Two sealed vessels side by side. Each shows CO2 above and the CaCO3 solid at the bottom. */
function VesselPair({ a, b }: { a: VesselView; b: VesselView }) {
  return (
    <g data-testid="het-vessels">
      {([a, b] as const).map((v) => {
        const x = VESSEL_X[v.label === 'A' ? 'a' : 'b']
        const co2Count = Math.round(v.co2Moles * GAS_PARTICLES_PER_MOL)
        const solidCount = Math.round(v.solidRemaining * PARTICLES_PER_MOL)
        return (
          <g key={v.label} data-testid={`het-vessel-${v.label}`} data-solid-present={v.solidPresent ? 'true' : 'false'}>
            <SealedVessel
              x={x}
              y={VESSEL_Y}
              species={[
                { id: 'co2', color: CO2_COLOUR, phase: 'gas', label: 'CO₂(g)' },
                { id: 'caco3', color: SOLID_COLOUR, phase: 'solid', label: 'CaCO₃(s)' },
              ]}
              counts={[co2Count, solidCount]}
              seed={v.label === 'A' ? 4 : 9}
              solid={v.solidPresent}
              exchange="dissolution"
              gauge={{ fraction: v.pressureBar / DIAL_MAX_BAR, label: `${formatConstant(v.pressureBar)} bar` }}
              title={`Vessel ${v.label}: ${formatConstant(v.solidStart)} mol CaCO₃ at the start`}
            />
            <Label x={x + 180} y={VESSEL_Y - 16} fontSize={16} fill="var(--fg)">
              Vessel {v.label}: {formatConstant(v.solidStart)} mol CaCO₃ at the start
            </Label>
            <Label x={x + 180} y={VESSEL_Y + 318} fontSize={15} fill="var(--fg-muted)">
              CO₂ {formatConstant(v.co2Moles)} mol · solid left {v.solidPresent ? formatConstant(v.solidRemaining) : '0'} mol
            </Label>
          </g>
        )
      })}
    </g>
  )
}

/** Three cards for the other heterogeneous equilibria, with the solids and liquids marked as left out. */
function OtherEquilibria() {
  const cards: { equation: string; left: string; expression: string; value: string; notes: string[] }[] = [
    {
      equation: 'CaCO₃(s) ⇌ CaO(s) + CO₂(g)',
      left: 'Left out: CaCO₃(s) and CaO(s)',
      expression: "K′c = [CO₂]",
      value: `= ${formatConstant(CO2_CONCENTRATION_AT_EQUILIBRIUM)} mol L⁻¹ at ${HET_T} K`,
      notes: [`Kp = p(CO₂) = ${formatConstant(CACO3_KP_1100K)} bar, the`, 'same for any amount of solid.'],
    },
    {
      equation: 'H₂O(l) ⇌ H₂O(g)',
      left: 'Left out: H₂O(l), the liquid',
      expression: 'Kp = p(H₂O)',
      value: 'the vapour pressure at T',
      notes: ['Fixed by the temperature while', 'some liquid water is present.'],
    },
    {
      equation: 'Ni(s) + 4CO(g) ⇌ Ni(CO)₄(g)',
      left: 'Left out: Ni(s), the solid',
      expression: 'Kc = [Ni(CO)₄]/[CO]⁴',
      value: 'Ni(s) is not in Kc.',
      notes: ['Any amount of nickel, however', 'small, gives the same Kc.'],
    },
  ]
  const width = 236
  const gap = 26
  const left = (VIEW_WIDTH - (width * 3 + gap * 2)) / 2
  return (
    <g data-testid="het-cards">
      {cards.map((card, i) => {
        const x = left + i * (width + gap)
        const cx = x + width / 2
        return (
          <g key={card.equation}>
            <rect x={x} y={28} width={width} height={300} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
            <Label x={cx} y={58} fontSize={15} fill="var(--fg)">
              {card.equation}
            </Label>
            <rect x={x + 14} y={78} width={width - 28} height={32} rx={8} fill="var(--accent-soft)" />
            <Label x={cx} y={94} fontSize={14} fill="var(--fg)">
              {card.left}
            </Label>
            <Label x={cx} y={146} fontSize={19} fill="var(--fg)" fontWeight={600}>
              <tspan className="sym">{card.expression.split(' = ')[0]}</tspan>
              {card.expression.includes(' = ') ? ` = ${card.expression.split(' = ')[1]}` : ''}
            </Label>
            <Label x={cx} y={180} fontSize={14} fill="var(--fg-muted)">
              {card.value}
            </Label>
            {card.notes.map((line, j) => (
              <Label key={j} x={cx} y={236 + j * 22} fontSize={14} fill="var(--fg-muted)">
                {line}
              </Label>
            ))}
          </g>
        )
      })}
    </g>
  )
}

/**
 * The heterogeneous Scrolly: two CaCO3 vessels at 1100 K with a little solid and a lot. The CO2
 * pressure at equilibrium is 2.00 bar in both, while the solid is present. A scarce vessel shows
 * the pressure falling below Kp when the solid runs out. The last Step applies the rule to other
 * heterogeneous equilibria.
 */
export function Heterogeneous({ step }: HeterogeneousProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const current: HetStep = STEPS[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`CaCO₃ in a closed vessel: ${current.title}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="heterogeneous"
      data-step={index}
    >
      {current.kind === 'vessels' ? (
        <VesselPair a={current.a} b={current.b} />
      ) : (
        <OtherEquilibria />
      )}
    </svg>
  )
}
