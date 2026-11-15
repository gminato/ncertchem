'use client'

import { Label } from '@/components/vocab'
import { CONTACT_STEP_COUNT, clampHBondStep, contactTargetForStep, type ContactId } from './hbond-steps'
import styles from './hbond.module.css'

export interface HBondContactsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 500

interface Point {
  x: number
  y: number
}

/** Shortens the segment from a to b so that it starts and ends at the rims of two circles. */
function trim(a: Point, ra: number, b: Point, rb: number): { x1: number; y1: number; x2: number; y2: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  return { x1: a.x + ux * ra, y1: a.y + uy * ra, x2: b.x - ux * rb, y2: b.y - uy * rb }
}

/** An atom: a disc with its symbol. Hydrogen is small and pale, and the electronegative atoms are shaded. */
function Atom({ at, symbol, radius, kind }: { at: Point; symbol: string; radius: number; kind: 'H' | 'X' | 'C' }) {
  const fill = kind === 'H' ? 'var(--surface-raised)' : kind === 'X' ? 'var(--accent-soft)' : 'var(--surface)'
  const stroke = kind === 'X' ? 'var(--accent)' : 'var(--fg-muted)'
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={radius} strokeWidth={1.4} style={{ fill, stroke }} />
      <Label x={at.x} y={at.y + 0.5} fontSize={kind === 'H' ? 15 : 18} fill="var(--fg)">
        {symbol}
      </Label>
    </g>
  )
}

/** A covalent bond: a solid stick between the rims of two atoms. */
function Covalent({ a, ra, b, rb }: { a: Point; ra: number; b: Point; rb: number }) {
  const s = trim(a, ra, b, rb)
  return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={2.4} strokeLinecap="round" style={{ stroke: 'var(--fg-muted)' }} />
}

/** A hydrogen bond: a dotted line, as NCERT draws it (Section 4.9). */
function HBond({ a, ra, b, rb }: { a: Point; ra: number; b: Point; rb: number }) {
  const s = trim(a, ra, b, rb)
  return (
    <line
      x1={s.x1}
      y1={s.y1}
      x2={s.x2}
      y2={s.y2}
      strokeWidth={2.2}
      strokeDasharray="2 5"
      strokeLinecap="round"
      style={{ stroke: 'var(--accent)' }}
      data-testid="hbond-line"
    />
  )
}

/** The δ+ and δ− markers beside an atom. */
function Charge({ at, sign }: { at: Point; sign: '+' | '−' }) {
  return (
    <Label x={at.x} y={at.y} fontSize={16} fill="var(--accent)">
      {`δ${sign}`}
    </Label>
  )
}

/**
 * HBondContacts: four drawings of Section 4.9. A polar H–F bond, the HF zig-zag chain, the
 * water dimer, and the intramolecular contact in o-nitrophenol. Each layer fades in for its Step.
 */
export function HBondContacts({ step, reducedMotion }: HBondContactsProps) {
  const target = contactTargetForStep(step)
  const index = clampHBondStep(step, CONTACT_STEP_COUNT)
  const layer = (id: ContactId) => ({
    'data-layer': id,
    className: styles.layer,
    style: { opacity: target.id === id ? 1 : 0 },
  })

  // Step 1 geometry: the zig-zag F–H···F–H···F chain.
  const chainF = [
    { x: 90, y: 330 },
    { x: 250, y: 330 },
    { x: 410, y: 330 },
  ]
  const chainH = [
    { x: 170, y: 268 },
    { x: 330, y: 268 },
    { x: 490, y: 268 },
  ]

  // Step 2 geometry: a water dimer.
  const oA = { x: 150, y: 320 }
  const hA1 = { x: 118, y: 258 }
  const hA2 = { x: 182, y: 258 }
  const oB = { x: 330, y: 252 }
  const hB1 = { x: 298, y: 186 }
  const hB2 = { x: 362, y: 186 }

  // Step 3 geometry: o-nitrophenol, drawn at its own origin and shifted into the panel below.
  // Ring centre (300, 320), radius 85, pointy top.
  const ring = [
    { x: 300, y: 235 },
    { x: 373.6, y: 277.5 },
    { x: 373.6, y: 362.5 },
    { x: 300, y: 405 },
    { x: 226.4, y: 362.5 },
    { x: 226.4, y: 277.5 },
  ]
  const phenolO = { x: 300, y: 150 }
  const phenolH = { x: 354, y: 162 }
  const nitroN = { x: 434, y: 242 }
  const nitroO1 = { x: 434, y: 180 }
  const nitroO2 = { x: 488, y: 273 }

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label="Hydrogen bonding drawings: a polar H–F bond, a zig-zag chain of HF molecules, water molecules linked by O–H···O, and the intramolecular bond in o-nitrophenol"
      data-testid="hbond-contacts"
      data-step={index}
      data-id={target.id}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      {/* Step 0: the polar H–F bond */}
      <g {...layer('cause')}>
        <Label x={VIEW_WIDTH / 2} y={34} fontSize={16} fill="var(--fg-muted)">
          One H–F bond: the electrons sit closer to F
        </Label>
        <ellipse cx={372} cy={290} rx={78} ry={52} style={{ fill: 'var(--accent-soft)', opacity: 0.6 }} />
        <Covalent a={{ x: 230, y: 290 }} ra={16} b={{ x: 330, y: 290 }} rb={26} />
        <Atom at={{ x: 230, y: 290 }} symbol="H" radius={16} kind="H" />
        <Atom at={{ x: 330, y: 290 }} symbol="F" radius={26} kind="X" />
        <Charge at={{ x: 230, y: 248 }} sign="+" />
        <Charge at={{ x: 330, y: 240 }} sign="−" />
        <Label x={VIEW_WIDTH / 2} y={400} fontSize={15} fill="var(--fg-muted)">
          The shaded cloud is pulled towards F, which leaves H partly bare.
        </Label>
      </g>

      {/* Step 1: the HF chain */}
      <g {...layer('chain')}>
        <Label x={VIEW_WIDTH / 2} y={34} fontSize={16} fill="var(--fg-muted)">
          Hydrogen fluoride: a zig-zag chain of molecules
        </Label>
        {chainF.map((f, i) => (
          <Covalent key={`hf-${i}`} a={f} ra={26} b={chainH[i]} rb={16} />
        ))}
        {chainF.slice(0, 2).map((f, i) => (
          <HBond key={`hb-${i}`} a={chainH[i]} ra={16} b={chainF[i + 1]} rb={26} />
        ))}
        {chainF.map((f, i) => (
          <Atom key={`F-${i}`} at={f} symbol="F" radius={26} kind="X" />
        ))}
        {chainH.map((h, i) => (
          <Atom key={`H-${i}`} at={h} symbol="H" radius={16} kind="H" />
        ))}
        {chainH.map((h, i) => (
          <Charge key={`dp-${i}`} at={{ x: h.x, y: h.y - 26 }} sign="+" />
        ))}
        {chainF.map((f, i) => (
          <Charge key={`dm-${i}`} at={{ x: f.x, y: f.y + 44 }} sign="−" />
        ))}
        {chainF.slice(0, 2).map((f, i) => (
          <Label key={`hl-${i}`} x={(chainH[i].x + chainF[i + 1].x) / 2} y={404} fontSize={14} fill="var(--accent)">
            hydrogen bond
          </Label>
        ))}
      </g>

      {/* Step 2: water */}
      <g {...layer('water')}>
        <Label x={VIEW_WIDTH / 2} y={34} fontSize={16} fill="var(--fg-muted)">
          Water: O–H···O between two molecules
        </Label>
        <Covalent a={oA} ra={24} b={hA1} rb={14} />
        <Covalent a={oA} ra={24} b={hA2} rb={14} />
        <Covalent a={oB} ra={24} b={hB1} rb={14} />
        <Covalent a={oB} ra={24} b={hB2} rb={14} />
        <HBond a={hA2} ra={14} b={oB} rb={24} />
        <Atom at={oA} symbol="O" radius={24} kind="X" />
        <Atom at={hA1} symbol="H" radius={14} kind="H" />
        <Atom at={hA2} symbol="H" radius={14} kind="H" />
        <Atom at={oB} symbol="O" radius={24} kind="X" />
        <Atom at={hB1} symbol="H" radius={14} kind="H" />
        <Atom at={hB2} symbol="H" radius={14} kind="H" />
        <Label x={256} y={222} fontSize={15} fill="var(--accent)">
          H···O
        </Label>
        <Label x={oA.x} y={372} fontSize={15} fill="var(--fg-muted)">
          water
        </Label>
        <Label x={oB.x} y={296} fontSize={15} fill="var(--fg-muted)">
          water
        </Label>
      </g>

      {/* Step 3: o-nitrophenol */}
      <g {...layer('intramolecular')}>
        <Label x={VIEW_WIDTH / 2} y={34} fontSize={16} fill="var(--fg-muted)">
          o-Nitrophenol: a bond inside one molecule
        </Label>
        <g transform="translate(-55 40)">
          <polygon
            points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ fill: 'none', stroke: 'var(--fg-muted)' }}
          />
          <Covalent a={ring[0]} ra={0} b={phenolO} rb={20} />
          <Covalent a={phenolO} ra={20} b={phenolH} rb={14} />
          <Covalent a={ring[1]} ra={0} b={nitroN} rb={16} />
          <Covalent a={nitroN} ra={16} b={nitroO1} rb={16} />
          <Covalent a={nitroN} ra={16} b={nitroO2} rb={16} />
          <HBond a={phenolH} ra={14} b={nitroO1} rb={16} />
          <Atom at={phenolO} symbol="O" radius={20} kind="X" />
          <Atom at={phenolH} symbol="H" radius={14} kind="H" />
          <Atom at={nitroN} symbol="N" radius={16} kind="X" />
          <Atom at={nitroO1} symbol="O" radius={16} kind="X" />
          <Atom at={nitroO2} symbol="O" radius={16} kind="X" />
          <Label x={phenolO.x - 30} y={phenolO.y} fontSize={15} fill="var(--fg-muted)" textAnchor="end">
            OH
          </Label>
          <Label x={nitroN.x + 26} y={nitroN.y - 40} fontSize={15} fill="var(--fg-muted)" textAnchor="start">
            NO₂
          </Label>
          <Label x={(phenolH.x + nitroO1.x) / 2} y={(phenolH.y + nitroO1.y) / 2 - 18} fontSize={15} fill="var(--accent)">
            H···O
          </Label>
        </g>
        <Label x={VIEW_WIDTH / 2} y={470} fontSize={14} fill="var(--fg-subtle)">
          The H···O contact closes a six-membered ring, all within one molecule.
        </Label>
      </g>
    </svg>
  )
}
