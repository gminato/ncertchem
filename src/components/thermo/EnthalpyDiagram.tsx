import React, { forwardRef, useMemo } from 'react'
import { Label } from '../vocab/Label'
import { enthalpyLevelLayout, enthalpyY, type EnthalpyScale } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const ENTHALPY_SIZE = { width: 360, height: 262 } as const

const PLOT = { left: 128, right: 352, top: 26, bottom: 232 }
const LABEL_X = 118
const LEVEL_FONT = 13
const STEP_FONT = 12
const LABEL_GAP = 15
const HEAD = 7

export interface EnthalpyLevel {
  id: string
  /** Text beside the level, for example "C(s) + O₂(g)". */
  label: React.ReactNode
  /** Enthalpy of the level in kJ mol⁻¹, relative to the reference. */
  H: number
  /**
   * Horizontal extent of the level, in column units (column i is centred on i + 0.5).
   * Defaults to the full width. Use it to stop a level where its arrows meet it.
   */
  span?: readonly [number, number]
}

export interface EnthalpyStep {
  id: string
  /** Level the step starts from. */
  from: string
  /** Level the step ends at. */
  to: string
  /** Column the arrow sits in, from 0 at the left. */
  column: number
  /** Enthalpy change of the step in kJ mol⁻¹. */
  dH: number
  /** Name of the step shown above its value, for example "ΔH₁". Default "ΔH". */
  name?: React.ReactNode
  /** Route this step belongs to. Used with `highlightRoute`. */
  route?: string
}

export interface EnthalpyDiagramProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  levels: readonly EnthalpyLevel[]
  steps: readonly EnthalpyStep[]
  /** Number of columns. Defaults to one more than the largest step column. */
  columns?: number
  /** Draws the steps of this route in full strength and fades the rest. */
  highlightRoute?: string
  /** Accessible name for the diagram. */
  title?: string
}

function formatSigned(value: number): string {
  const magnitude = Math.abs(value).toFixed(1)
  return value < 0 ? `−${magnitude}` : `+${magnitude}`
}

/**
 * An enthalpy-level diagram: one horizontal level per species, and a vertical arrow
 * for each step. Up is endothermic (warm) and down is exothermic (cool). Level labels
 * sit in a gutter at the left and are spread apart where they would collide. Used for
 * Hess cycles (two routes between the same start and end) and Born–Haber staircases.
 */
export const EnthalpyDiagram = forwardRef<SVGGElement, EnthalpyDiagramProps>(function EnthalpyDiagram(
  { levels, steps, columns, highlightRoute, title, className, ...rest },
  ref
) {
  const cols = columns ?? Math.max(1, ...steps.map((s) => s.column + 1))
  const colW = (PLOT.right - PLOT.left) / cols

  const scale: EnthalpyScale = useMemo(() => {
    const hs = levels.map((l) => l.H)
    return {
      top: PLOT.top,
      bottom: PLOT.bottom,
      hMin: hs.length ? Math.min(...hs) : 0,
      hMax: hs.length ? Math.max(...hs) : 1,
    }
  }, [levels])

  const { rungY, labels } = enthalpyLevelLayout(
    levels.map((l) => l.H),
    scale,
    LABEL_GAP
  )
  const yById = new Map(levels.map((l, i) => [l.id, rungY[i]]))
  const colX = (c: number) => PLOT.left + c * colW

  return (
    <g ref={ref} className={className} {...rest}>
      {title && <title>{title}</title>}

      {/* Levels: one thin horizontal line per species, with its label in the gutter */}
      {levels.map((level, i) => {
        const y = rungY[i]
        const [a, b] = level.span ?? [0, cols]
        const place = labels[i]
        return (
          <g key={`level-${level.id}`} data-testid="enthalpy-level">
            <line
              x1={colX(a)}
              x2={colX(b)}
              y1={y}
              y2={y}
              strokeWidth={1.6}
              style={{ stroke: 'var(--fg-muted)' }}
            />
            {place.nudged && (
              <line
                x1={PLOT.left - 2}
                x2={LABEL_X + 3}
                y1={y}
                y2={place.labelY}
                strokeWidth={0.8}
                style={{ stroke: 'var(--fg-subtle)' }}
              />
            )}
            <Label x={LABEL_X} y={place.labelY} textAnchor="end" fontSize={LEVEL_FONT} fill="var(--fg)">
              {level.label}
            </Label>
          </g>
        )
      })}

      {/* Steps: vertical arrows, coloured by sign, with ΔH labels to their right */}
      {steps.map((step) => {
        const y1 = yById.get(step.from)
        const y2 = yById.get(step.to)
        if (y1 === undefined || y2 === undefined) return null
        const down = y2 > y1
        const x = colX(step.column + 0.5)
        const tone = step.dH < 0 ? 'var(--work)' : 'var(--heat)'
        const dimmed = highlightRoute !== undefined && step.route !== highlightRoute
        const start = y1 + (down ? 3 : -3)
        const end = y2 - (down ? 3 : -3)
        const midY = (y1 + y2) / 2
        return (
          <g
            key={`step-${step.id}`}
            data-testid="enthalpy-step"
            opacity={dimmed ? 0.4 : 1}
          >
            <line
              x1={x}
              y1={start}
              x2={x}
              y2={end}
              strokeWidth={highlightRoute !== undefined && !dimmed ? 2.8 : 2}
              strokeLinecap="round"
              style={{ stroke: tone }}
            />
            <polygon
              points={`${x},${end} ${x - HEAD * 0.6},${end - (down ? HEAD : -HEAD)} ${x + HEAD * 0.6},${end - (down ? HEAD : -HEAD)}`}
              style={{ fill: tone }}
            />
            <Label x={x + 7} y={midY - 7} textAnchor="start" fontSize={STEP_FONT} fill="var(--fg)" halo>
              <tspan className="sym">{step.name ?? 'ΔH'}</tspan>
            </Label>
            <Label x={x + 7} y={midY + 8} textAnchor="start" fontSize={STEP_FONT} fill={tone} halo>
              {formatSigned(step.dH)}
            </Label>
          </g>
        )
      })}
    </g>
  )
})
