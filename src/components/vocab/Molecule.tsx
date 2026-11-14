import React, { forwardRef, useMemo } from 'react'
import { Atom } from './Atom'
import { atomRadius } from './atom'
import { MOLECULE_LAYOUTS, type MoleculeBond } from './molecules'

export type MoleculeStyle = 'space-filling' | 'ball-and-stick'

export interface MoleculeProps extends Omit<React.SVGAttributes<SVGGElement>, 'style'> {
  /** A key of MOLECULE_LAYOUTS, e.g. "H2O", "CO2", "CH4". */
  formula: string
  /** Space-filling spheres overlap slightly; ball-and-stick shows bonds between smaller atoms. */
  style?: MoleculeStyle
  x?: number
  y?: number
  scale?: number
  defsPrefix?: string
}

/** Space-filling spheres are this many times their atom radius, so neighbours overlap a little. */
const SPACE_FILL_FACTOR = 1.2
/** Ball-and-stick spheres are this fraction of their atom radius. */
const BALL_FACTOR = 0.5
const BOND_WIDTH = 3.6
const MULTIPLE_BOND_GAP = 3.4

/** Offsets for each bond order, measured perpendicular to the bond. */
const BOND_OFFSETS: Record<MoleculeBond['order'], number[]> = {
  1: [0],
  2: [-MULTIPLE_BOND_GAP, MULTIPLE_BOND_GAP],
  3: [-MULTIPLE_BOND_GAP * 1.4, 0, MULTIPLE_BOND_GAP * 1.4],
}

/**
 * A molecule from MOLECULE_LAYOUTS. Atoms are drawn back to front. Unknown
 * formulas render nothing, so a typo cannot break the page.
 */
export const Molecule = forwardRef<SVGGElement, MoleculeProps>(function Molecule(
  { formula, style = 'space-filling', x = 0, y = 0, scale = 1, defsPrefix = 'vocab', className, ...rest },
  ref
) {
  const layout = MOLECULE_LAYOUTS[formula]

  const atoms = useMemo(
    () => (layout ? [...layout.atoms].sort((a, b) => a.z - b.z) : []),
    [layout]
  )

  if (!layout) return null

  const ballAndStick = style === 'ball-and-stick'
  const radiusOf = (element: string) =>
    ballAndStick ? atomRadius(element) * BALL_FACTOR : atomRadius(element) * SPACE_FILL_FACTOR

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})${scale !== 1 ? ` scale(${scale})` : ''}`}
      className={className}
      {...rest}
    >
      {ballAndStick &&
        layout.bonds.map((bond, i) => {
          const pa = layout.atoms[bond.a]
          const pb = layout.atoms[bond.b]
          const dx = pb.x - pa.x
          const dy = pb.y - pa.y
          const len = Math.hypot(dx, dy) || 1
          const nx = -dy / len
          const ny = dx / len
          return BOND_OFFSETS[bond.order].map((off, k) => (
            <line
              key={`${i}-${k}`}
              x1={pa.x + nx * off}
              y1={pa.y + ny * off}
              x2={pb.x + nx * off}
              y2={pb.y + ny * off}
              stroke="var(--bond)"
              strokeWidth={BOND_WIDTH}
              strokeLinecap="round"
            />
          ))
        })}

      {atoms.map((atom, i) => (
        <Atom
          key={`${atom.element}-${i}`}
          element={atom.element}
          x={atom.x}
          y={atom.y}
          r={radiusOf(atom.element)}
          defsPrefix={defsPrefix}
        />
      ))}
    </g>
  )
})
