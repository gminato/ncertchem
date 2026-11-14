import { Atom } from '@/components/vocab/Atom'
import type { MovingAtom } from './atom-scene'

export interface SceneBondDraw {
  a: number
  b: number
  /** 0 hides the bond, 1 draws it fully. */
  opacity: number
}

export interface SceneViewProps {
  atoms: readonly MovingAtom[]
  bonds?: readonly SceneBondDraw[]
  /** Stroke width of bonds, in SVG units. */
  bondWidth?: number
  defsPrefix: string
}

/**
 * Draws atoms and bonds from the atom-scene engine. Bonds are drawn first so that the
 * spheres sit on top of them. Needs VocabDefs in the same SVG.
 */
export function SceneView({ atoms, bonds = [], bondWidth = 3, defsPrefix }: SceneViewProps) {
  return (
    <g>
      {bonds.map((bond, i) => {
        if (bond.opacity <= 0.001) return null
        const pa = atoms[bond.a]
        const pb = atoms[bond.b]
        return (
          <line
            key={`bond-${i}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            strokeWidth={bondWidth}
            strokeLinecap="round"
            style={{ stroke: 'var(--bond)', opacity: bond.opacity }}
          />
        )
      })}
      {atoms.map((atom, i) => (
        <Atom
          key={`atom-${i}`}
          element={atom.element}
          x={atom.x}
          y={atom.y}
          r={atom.r}
          defsPrefix={defsPrefix}
        />
      ))}
    </g>
  )
}
