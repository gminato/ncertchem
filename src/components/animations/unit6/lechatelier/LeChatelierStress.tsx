'use client'

import { EquilibriumCurves } from '@/components/equilibrium/EquilibriumCurves'
import { LeChatelierScale } from '@/components/equilibrium/LeChatelierScale'
import { useSweptNumber } from '../../unit5/gibbs/useTweenedNumber'
import { PistonVessel } from './PistonVessel'
import { stressSteps, fixed } from './lechatelier-steps'

export interface LeChatelierStressProps {
  step: number
  reducedMotion: boolean
}

const STEPS = stressSteps()
const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 520
const CURVE_X = 0
const BALANCE = { x: 664, y: 0, scale: 0.92 }
const VESSEL = { x: 650, y: 262 }
const READOUT_Y = 326

/** Breaks a sentence into lines of at most `width` characters, at word boundaries. */
function wrap(text: string, width: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > width && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * The Le Chatelier Scrolly: one Step per stress on the Haber baseline. The curves draw the
 * concentrations against lab time with the stress marked by a dashed line. The balance shows the
 * direction the mixture moves, and the vessel shows the settled mixture at the piston's volume.
 */
export function LeChatelierStress({ step, reducedMotion }: LeChatelierStressProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const active = STEPS[index]
  const sweep = useSweptNumber(index, 0, 1, reducedMotion, 1.4)

  const kRest =
    active.kBefore === active.kAfter
      ? ` = ${fixed(active.kAfter, 1)} M⁻²`
      : `: ${fixed(active.kBefore, 1)} → ${fixed(active.kAfter, 1)} M⁻²`
  const qLine = active.immediateQ === null ? 'Q = K: no stress to test' : `Q right after the stress = ${fixed(active.immediateQ, 1)}`
  const readoutLines = wrap(active.readout, 62)

  const vesselSpecies = [
    { id: 'N2', colour: 'var(--fg-muted)', amount: active.settled.N2 },
    { id: 'H2', colour: 'var(--accent)', amount: active.settled.H2 },
    { id: 'NH3', colour: 'var(--fwd)', amount: active.settled.NH3 },
  ]

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${active.title}. ${active.readout}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="lechatelier-scrolly"
      data-step={index}
    >
      <EquilibriumCurves
        x={CURVE_X}
        y={0}
        panels={[{ title: active.title, series: active.series }]}
        timeMax={active.timeMax}
        concMax={active.concMax}
        progress={sweep}
        perturbAt={active.perturbAt ?? undefined}
        equilibriumAt={active.bandAt}
        yLabel="concentration, mol L⁻¹"
        title={`${active.title}: concentrations against lab time`}
      />

      {/* Readout under the curves */}
      <g transform={`translate(0, ${READOUT_Y})`} data-testid="le-chatelier-readout">
        <text x={56} y={0} fontSize={22} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central" style={{ userSelect: 'none' }}>
          <tspan className="sym">K</tspan>
          {kRest}
        </text>
        <text x={56} y={34} fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central" style={{ userSelect: 'none' }}>
          {qLine}
        </text>
        {readoutLines.map((line, i) => (
          <text key={i} x={56} y={74 + i * 26} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)" dominantBaseline="central" style={{ userSelect: 'none' }}>
            {line}
          </text>
        ))}
      </g>

      {/* Balance: the stress tips it, and it partly re-levels as the mixture shifts */}
      <g transform={`translate(${BALANCE.x}, ${BALANCE.y}) scale(${BALANCE.scale})`}>
        <LeChatelierScale
          stress={active.stress}
          shift={active.shift}
          progress={sweep}
          reactantLabel="N₂ + 3H₂"
          productLabel="2NH₃"
          title={`Balance for N2 + 3H2 and 2NH3, stress: ${active.title}`}
        />
      </g>

      {/* Vessel: the settled mixture at the piston's volume */}
      <g transform={`translate(${VESSEL.x}, ${VESSEL.y})`}>
        <PistonVessel
          volume={active.volume}
          species={vesselSpecies}
          caption={`V = ${fixed(active.volume, 2)} L`}
          title={`Vessel at ${fixed(active.volume, 2)} L with the settled mixture`}
        />
        <text x={216} y={34} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central" style={{ userSelect: 'none' }}>
          Colourless gas
        </text>
        <text x={216} y={60} fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)" dominantBaseline="central" style={{ userSelect: 'none' }}>
          <tspan className="sym">[N₂]</tspan> {fixed(active.settled.N2, 2)} M
        </text>
        <text x={216} y={82} fontSize={14} fontFamily="var(--font-sans)" fill="var(--accent)" dominantBaseline="central" style={{ userSelect: 'none' }}>
          <tspan className="sym">[H₂]</tspan> {fixed(active.settled.H2, 2)} M
        </text>
        <text x={216} y={104} fontSize={14} fontFamily="var(--font-sans)" fill="var(--fwd)" dominantBaseline="central" style={{ userSelect: 'none' }}>
          <tspan className="sym">[NH₃]</tspan> {fixed(active.settled.NH3, 2)} M
        </text>
        {active.argonMol > 0 && (
          <text x={216} y={126} fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)" dominantBaseline="central" style={{ userSelect: 'none' }}>
            Ar {fixed(active.argonMol, 2)} mol added
          </text>
        )}
      </g>
    </svg>
  )
}
