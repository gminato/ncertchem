'use client'

import { Electron, EnergyLevel, Label, Nucleus, VocabDefs } from '@/components/vocab'
import { nucleons } from '@/lib/chem/atom-structure'
import { clampIndex } from '../subatomic/notation'
import styles from '../subatomic/subatomic.module.css'

export interface IsotopeNucleiProps {
  step: number
  reducedMotion: boolean
}

/** Number of Steps in the IsotopeNuclei animation. */
export const ISOTOPE_STEP_COUNT = 4

const VIEW_W = 640
const VIEW_H = 540

interface Species {
  Z: number
  A: number
  symbol: string
  name?: string
}

const HYDROGEN: Species[] = [
  { Z: 1, A: 1, symbol: 'H', name: 'protium' },
  { Z: 1, A: 2, symbol: 'H', name: 'deuterium' },
  { Z: 1, A: 3, symbol: 'H', name: 'tritium' },
]

const ISOBARS: Species[] = [
  { Z: 18, A: 40, symbol: 'Ar' },
  { Z: 20, A: 40, symbol: 'Ca' },
]

const CAPTIONS = [
  'Protium: one proton and no neutron. Most hydrogen atoms are this.',
  'Deuterium: add one neutron. It is about 0.015 % of hydrogen.',
  'Tritium: two neutrons. It occurs only in trace amounts.',
  'Isobars: the same 40 nucleons, but a different number of protons.',
]

/** Number of protons for each of the `count` nucleons, spread evenly through the sequence. */
function protonFlags(Z: number, A: number): boolean[] {
  return Array.from({ length: A }, (_, i) => Math.floor(((i + 1) * Z) / A) > Math.floor((i * Z) / A))
}

/** Position of the i-th nucleon on a golden-angle (Fermat) spiral, in SVG units. */
function spiralPosition(i: number, spacing: number): { x: number; y: number } {
  const angle = i * 2.39996323
  const radius = spacing * Math.sqrt(i)
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

/**
 * The symbol with its mass number above and atomic number below, on the
 * left, as in ᴬ_Z X. Drawn in three pieces so the stack lines up.
 */
function IsotopeSymbol({ x, y, A, Z, symbol }: { x: number; y: number; A: number; Z: number; symbol: string }) {
  // The group is about 40 units wide, so starting 22 units left centres it on x.
  const left = x - 22
  return (
    <g>
      <Label x={left} y={y - 9} fontSize={15} textAnchor="start" fill="var(--fg-muted)">
        {A}
      </Label>
      <Label x={left} y={y + 11} fontSize={15} textAnchor="start" fill="var(--fg-muted)">
        {Z}
      </Label>
      <Label x={left + 19} y={y + 1} fontSize={24} textAnchor="start" fill="var(--fg)">
        {symbol}
      </Label>
    </g>
  )
}

/** Particle counts in standard notation: p⁺, n⁰ and e⁻. */
function countsLine(Z: number, A: number): string {
  const c = nucleons(Z, A)
  return `p⁺ ${c.protons}   n⁰ ${c.neutrons}   e⁻ ${c.electrons}`
}

/**
 * IsotopeNuclei: the three isotopes of hydrogen, then two isobars. Nucleon
 * counts come from the library's nucleons() function. Isotopes differ in the
 * number of neutrons; isobars share A but differ in Z.
 */
export function IsotopeNuclei({ step }: IsotopeNucleiProps) {
  const activeStep = clampIndex(step, ISOTOPE_STEP_COUNT)
  const isobarStep = activeStep === 3

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role="img"
        aria-label="Isotopes of hydrogen, protium, deuterium and tritium, which differ in neutron number; then the isobars argon-40 and calcium-40, which share a mass number of 40"
        data-testid="isotope-nuclei"
        data-step={activeStep}
      >
        <VocabDefs idPrefix="iso" />

        {!isobarStep &&
          HYDROGEN.map((sp, i) => {
            const cx = [110, 320, 530][i]
            const cy = 200
            const active = i === activeStep
            const counts = nucleons(sp.Z, sp.A)
            const electronAngle = -Math.PI / 3
            return (
              <g key={`h-${sp.A}`} opacity={active ? 1 : 0.28} style={{ transition: 'opacity 0.4s ease' }}>
                <EnergyLevel variant="orbit" r={74} x={cx} y={cy} />
                <Nucleus protons={counts.protons} neutrons={counts.neutrons} x={cx} y={cy} nucleonRadius={15} defsPrefix="iso" />
                <Electron x={cx + 74 * Math.cos(electronAngle)} y={cy + 74 * Math.sin(electronAngle)} size={12} defsPrefix="iso" />
                <IsotopeSymbol x={cx} y={300} A={sp.A} Z={sp.Z} symbol={sp.symbol} />
                <Label x={cx} y={336} fontSize={16} textAnchor="middle" fill="var(--fg)">
                  {sp.name}
                </Label>
                <Label x={cx} y={362} fontSize={14} textAnchor="middle" fill="var(--fg-muted)">
                  {countsLine(sp.Z, sp.A)}
                </Label>
              </g>
            )
          })}

        {isobarStep &&
          ISOBARS.map((sp, col) => {
            const cx = [170, 470][col]
            const cy = 176
            const flags = protonFlags(sp.Z, sp.A)
            const dotR = 8
            const spacing = 17
            return (
              <g key={`iso-${sp.symbol}`}>
                {flags.map((isProton, i) => {
                  const p = spiralPosition(i, spacing)
                  return (
                    <circle
                      key={`n-${i}`}
                      cx={cx + p.x}
                      cy={cy + p.y}
                      r={dotR}
                      style={{ fill: isProton ? 'var(--proton)' : 'var(--neutron)', stroke: 'var(--bg)', strokeWidth: 0.8 }}
                    />
                  )
                })}
                <IsotopeSymbol x={cx} y={330} A={sp.A} Z={sp.Z} symbol={sp.symbol} />
                <Label x={cx} y={366} fontSize={14} textAnchor="middle" fill="var(--fg-muted)">
                  {countsLine(sp.Z, sp.A)}
                </Label>
              </g>
            )
          })}

        {isobarStep && (
          <g>
            <circle cx={150} cy={402} r={7} style={{ fill: 'var(--proton)' }} />
            <Label x={164} y={402} fontSize={15} textAnchor="start" fill="var(--fg-muted)">
              proton
            </Label>
            <circle cx={260} cy={402} r={7} style={{ fill: 'var(--neutron)' }} />
            <Label x={274} y={402} fontSize={15} textAnchor="start" fill="var(--fg-muted)">
              neutron
            </Label>
          </g>
        )}

        <Label x={VIEW_W / 2} y={470} fontSize={17} textAnchor="middle" fill="var(--fg)">
          {CAPTIONS[activeStep]}
        </Label>
        {isobarStep && (
          <Label x={VIEW_W / 2} y={500} fontSize={15} textAnchor="middle" fill="var(--fg-muted)">
            Chemistry follows the electrons, which equal Z for a neutral atom.
          </Label>
        )}
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {CAPTIONS[activeStep]}
      </p>
    </div>
  )
}
