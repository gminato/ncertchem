import type { ReactNode } from 'react'

/**
 * Explicit-hydrogen drawings of the two-carbon compounds of the alkene maker (bromoethane, ethanol,
 * 1,2-dibromoethane and ethene). A bare bond-line drawing of C2 compounds is just a line or an "=",
 * so these show every C and H. The coordinates are design units; `scale` multiplies them, and the
 * drawing is centred on (x, y). Labels come from the caller (the lib's α and β facts).
 */

export type TwoCarbonKind = 'bromoethane' | 'ethanol' | 'dibromoethane' | 'ethene'

/** SMILES of each two-carbon compound the drawings cover. */
export const TWO_CARBON_SMILES: Record<string, TwoCarbonKind> = {
  CCBr: 'bromoethane',
  CCO: 'ethanol',
  BrCCBr: 'dibromoethane',
  'C=C': 'ethene',
}

const FONT = 'var(--font-sans)'
const BOND = 'var(--fg)'
const LABEL_GAP = 17

interface Pt {
  x: number
  y: number
}

/** The atoms and bonds of each kind, in design units (bond length about 84). */
function layoutOf(kind: TwoCarbonKind): { atoms: { p: Pt; text: string; colour?: string }[]; bonds: [number, number, 1 | 2][]; alpha: number[]; beta: number[] } {
  switch (kind) {
    case 'bromoethane':
    case 'ethanol': {
      // CH3 (β) on the left, CH2 (α) in the middle, the halogen or OH on the right.
      const X = kind === 'bromoethane' ? { text: 'Br', colour: 'var(--atom-hal)' } : { text: 'OH', colour: 'var(--atom-o)' }
      return {
        atoms: [
          { p: { x: -84, y: 0 }, text: 'C' },
          { p: { x: 84, y: 0 }, text: 'C' },
          { p: { x: 175, y: 0 }, ...X },
          { p: { x: -180, y: 0 }, text: 'H' },
          { p: { x: -84, y: -100 }, text: 'H' },
          { p: { x: -84, y: 100 }, text: 'H' },
          { p: { x: 84, y: -100 }, text: 'H' },
          { p: { x: 84, y: 100 }, text: 'H' },
        ],
        bonds: [
          [0, 1, 1],
          [1, 2, 1],
          [0, 3, 1],
          [0, 4, 1],
          [0, 5, 1],
          [1, 6, 1],
          [1, 7, 1],
        ],
        alpha: [1],
        beta: [0],
      }
    }
    case 'dibromoethane':
      return {
        atoms: [
          { p: { x: -48, y: 0 }, text: 'C' },
          { p: { x: 48, y: 0 }, text: 'C' },
          { p: { x: -140, y: 0 }, text: 'Br', colour: 'var(--atom-hal)' },
          { p: { x: 140, y: 0 }, text: 'Br', colour: 'var(--atom-hal)' },
          { p: { x: -48, y: -100 }, text: 'H' },
          { p: { x: -48, y: 100 }, text: 'H' },
          { p: { x: 48, y: -100 }, text: 'H' },
          { p: { x: 48, y: 100 }, text: 'H' },
        ],
        bonds: [
          [0, 1, 1],
          [0, 2, 1],
          [1, 3, 1],
          [0, 4, 1],
          [0, 5, 1],
          [1, 6, 1],
          [1, 7, 1],
        ],
        alpha: [0, 1],
        beta: [],
      }
    case 'ethene':
      return {
        atoms: [
          { p: { x: -44, y: 0 }, text: 'C' },
          { p: { x: 44, y: 0 }, text: 'C' },
          { p: { x: -104, y: -84 }, text: 'H' },
          { p: { x: -104, y: 84 }, text: 'H' },
          { p: { x: 104, y: -84 }, text: 'H' },
          { p: { x: 104, y: 84 }, text: 'H' },
        ],
        bonds: [
          [0, 1, 2],
          [0, 2, 1],
          [0, 3, 1],
          [1, 4, 1],
          [1, 5, 1],
        ],
        alpha: [],
        beta: [],
      }
  }
}

/** The two-carbon drawing: atoms, bonds (a double bond is two offset lines) and the α and β highlights. */
export function TwoCarbonDrawing({
  kind,
  x,
  y,
  scale = 1,
  alphaLabel,
  betaLabel,
}: {
  kind: TwoCarbonKind
  x: number
  y: number
  scale?: number
  /** Text under the α-carbon, e.g. "α-carbon". */
  alphaLabel?: string
  /** Text under the β-carbon, e.g. "β-carbon: 3 H". */
  betaLabel?: string
}): ReactNode {
  const L = layoutOf(kind)
  const P = (p: Pt) => ({ x: x + p.x * scale, y: y + p.y * scale })
  const cut = LABEL_GAP * scale
  const lines: ReactNode[] = []
  L.bonds.forEach(([a, b, order], i) => {
    const A = P(L.atoms[a].p)
    const B = P(L.atoms[b].p)
    const len = Math.hypot(B.x - A.x, B.y - A.y) || 1
    const ux = (B.x - A.x) / len
    const uy = (B.y - A.y) / len
    const offsets = order === 2 ? [5 * scale, -5 * scale] : [0]
    offsets.forEach((off, j) => {
      const nx = -uy * off
      const ny = ux * off
      lines.push(
        <line
          key={`b-${i}-${j}`}
          x1={A.x + ux * cut + nx}
          y1={A.y + uy * cut + ny}
          x2={B.x - ux * cut + nx}
          y2={B.y - uy * cut + ny}
          stroke={BOND}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      )
    })
  })
  const fs = Math.round(30 * scale)
  return (
    <g>
      {L.beta.map((i) => (
        <circle key={`beta-${i}`} cx={P(L.atoms[i].p).x} cy={P(L.atoms[i].p).y} r={64 * scale} fill="var(--highlight)" opacity={0.5} />
      ))}
      {L.alpha.map((i) => (
        <circle key={`alpha-${i}`} cx={P(L.atoms[i].p).x} cy={P(L.atoms[i].p).y} r={64 * scale} fill="var(--highlight)" opacity={0.25} />
      ))}
      {lines}
      {L.atoms.map((a, i) => {
        const p = P(a.p)
        return (
          <text key={`t-${i}`} x={p.x} y={p.y + fs * 0.36} textAnchor="middle" fontSize={fs} fontWeight={600} fontFamily={FONT} fill={a.colour ?? 'var(--fg)'}>
            {a.text}
          </text>
        )
      })}
      {L.beta.length > 0 && betaLabel && (
        <text x={P(L.atoms[L.beta[0]].p).x} y={y + 150 * scale} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {betaLabel}
        </text>
      )}
      {L.alpha.length > 0 && alphaLabel && (
        <text x={P(L.atoms[L.alpha[0]].p).x} y={y + 150 * scale} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {alphaLabel}
        </text>
      )}
    </g>
  )
}
