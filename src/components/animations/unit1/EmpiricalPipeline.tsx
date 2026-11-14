'use client'

import type { CSSProperties } from 'react'
import { Label, atomColor } from '@/components/vocab'
import { buildEmpiricalPipeline, type PipelineRow } from '@/lib/chem/empirical-pipeline'
import {
  PIPELINE_COLUMN_ORDER,
  clampPipelineStep,
  targetsForPipelineStep,
  type PipelineColumn,
} from './empirical-pipeline-steps'
import styles from './EmpiricalPipeline.module.css'

export interface EmpiricalPipelineProps {
  step: number
  reducedMotion: boolean
}

/** The worked example: glucose, C₆H₁₂O₆, with its mass percentages from the molar mass. */
const PIPELINE = buildEmpiricalPipeline('C6H12O6')

// Geometry in SVG units. The viewBox is 640 × 540, the same as the Scrolly panel.
const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
const BAR = { left: 60, width: 520, top: 74, height: 56 }
const TABLE = { symbolX: 62, headerY: 196, firstRowY: 252, rowGap: 50 }
const COLUMN_X: Record<PipelineColumn, number> = {
  percent: 230,
  grams: 350,
  moles: 470,
  ratio: 590,
}
const HIGHLIGHT_WIDTH = 104
const RESULT_Y = 428

const ANIMATED_TRANSITION = 'opacity 0.55s var(--ease-out), transform 0.55s var(--ease-out)'

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉'
const subscript = (text: string) => text.replace(/\d/g, (digit) => SUBSCRIPTS[Number(digit)])

const ELEMENT_NAME: Record<string, string> = { C: 'Carbon', H: 'Hydrogen', O: 'Oxygen' }

/** Sums of mass percentages can be off by 0.01 from rounding, so the bar is scaled to their total. */
function segments(rows: PipelineRow[]) {
  const total = rows.reduce((sum, row) => sum + row.percent, 0)
  let cursor = BAR.left
  return rows.map((row) => {
    const width = (row.percent / total) * BAR.width
    const segment = { row, x: cursor, width }
    cursor += width
    return segment
  })
}

/**
 * EmpiricalPipeline: the five-Step route from mass percentages to a molecular
 * formula. A 100 g bar is split by element colour. The table then shows grams,
 * moles, and the whole-number ratio, and the last Step gives the empirical
 * formula and the multiple n that yields the molecular formula.
 */
export function EmpiricalPipeline({ step, reducedMotion }: EmpiricalPipelineProps) {
  const targets = targetsForPipelineStep(step)
  const transition = reducedMotion ? 'none' : ANIMATED_TRANSITION
  const bar = segments(PIPELINE.rows)
  const rowY = (index: number) => TABLE.firstRowY + index * TABLE.rowGap
  const headers: { column: PipelineColumn; top: string; bottom: string }[] = [
    { column: 'percent', top: 'Mass', bottom: '%' },
    { column: 'grams', top: 'Grams', bottom: 'in 100 g' },
    { column: 'moles', top: 'Moles', bottom: 'g ÷ A' },
    { column: 'ratio', top: 'Ratio', bottom: '÷ smallest' },
  ]
  const cell = (row: PipelineRow, column: PipelineColumn): string => {
    switch (column) {
      case 'percent':
        return formatFixed(row.percent, 2)
      case 'grams':
        return formatFixed(row.grams, 2)
      case 'moles':
        return formatFixed(row.moles, 3)
      case 'ratio':
        return formatFixed(row.ratio, 2)
    }
  }

  const n = PIPELINE.n
  const molecularMass = PIPELINE.molarMass.toFixed(2)
  const empiricalMass = PIPELINE.empiricalMass.toFixed(2)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`Empirical formula pipeline for glucose: mass percentages of 40.00 % carbon, 6.71 % hydrogen and 53.29 % oxygen become grams in a 100 g sample, then moles, then whole-number ratios, giving CH2O and, with n = ${n}, the molecular formula ${PIPELINE.molecularLabel}`}
        data-testid="empirical-pipeline"
        data-step={clampPipelineStep(step)}
      >
        {/* The 100 g sample, split by element colour */}
        <g>
          <rect
            x={BAR.left}
            y={BAR.top}
            width={BAR.width}
            height={BAR.height}
            rx={8}
            className={styles.barFrame}
          />
          {bar.map(({ row, x, width }) => (
            <rect
              key={row.symbol}
              x={x}
              y={BAR.top}
              width={width}
              height={BAR.height}
              fill={atomColor(row.symbol)}
              className={styles.barSegment}
            />
          ))}
          {bar.map(({ row, x, width }) => (
            <Label
              key={`label-${row.symbol}`}
              x={x + width / 2}
              y={BAR.top - 18}
              fontSize={17}
              fill="var(--fg)"
            >
              {row.symbol} {formatFixed(row.percent, 2)} %
            </Label>
          ))}
          <Label x={BAR.left + BAR.width / 2} y={BAR.top + BAR.height + 22} fontSize={17}>
            100 g of glucose (C₆H₁₂O₆), a sample of the compound
          </Label>
        </g>

        {/* Highlight behind the column in focus */}
        {targets.activeColumn && (
          <rect
            x={COLUMN_X[targets.activeColumn] - HIGHLIGHT_WIDTH / 2}
            y={TABLE.headerY - 26}
            width={HIGHLIGHT_WIDTH}
            height={rowY(2) - TABLE.headerY + 52}
            rx={10}
            className={styles.highlight}
            style={{ transition } as CSSProperties}
            data-column={targets.activeColumn}
          />
        )}

        {/* Table headers */}
        <Label x={TABLE.symbolX} y={TABLE.headerY} fontSize={17} textAnchor="start" fill="var(--fg-muted)">
          Element
        </Label>
        {headers.map(({ column, top, bottom }) => (
          <g key={column} data-header={column}>
            <Label
              x={COLUMN_X[column]}
              y={TABLE.headerY - 8}
              fontSize={17}
              fill={targets.activeColumn === column ? 'var(--accent)' : 'var(--fg-muted)'}
            >
              {top}
            </Label>
            <Label
              x={COLUMN_X[column]}
              y={TABLE.headerY + 12}
              fontSize={15}
              fill={targets.activeColumn === column ? 'var(--accent)' : 'var(--fg-subtle)'}
            >
              {bottom}
            </Label>
          </g>
        ))}

        {/* Rows */}
        {PIPELINE.rows.map((row, index) => (
          <g key={row.symbol} data-row={row.symbol}>
            <circle cx={TABLE.symbolX + 6} cy={rowY(index)} r={8} fill={atomColor(row.symbol)} />
            <Label x={TABLE.symbolX + 22} y={rowY(index)} fontSize={20} textAnchor="start" fill="var(--fg)">
              {row.symbol}
              <tspan fontSize={15} fill="var(--fg-subtle)" dx={8}>
                {ELEMENT_NAME[row.symbol]}
              </tspan>
            </Label>
            {PIPELINE_COLUMN_ORDER.map((column) => (
              <Label
                key={column}
                x={COLUMN_X[column]}
                y={rowY(index)}
                fontSize={20}
                fill="var(--fg)"
              >
                {cell(row, column)}
              </Label>
            ))}
          </g>
        ))}

        {/* Result: empirical and molecular formulas */}
        <g
          style={{ opacity: targets.result, transition } as CSSProperties}
          data-result={targets.result > 0.5 ? 'shown' : 'hidden'}
        >
          <line x1={60} x2={580} y1={RESULT_Y - 30} y2={RESULT_Y - 30} className={styles.rule} />
          <Label x={TABLE.symbolX} y={RESULT_Y} fontSize={19} textAnchor="start" fill="var(--fg-muted)">
            Empirical formula
          </Label>
          <Label x={330} y={RESULT_Y} fontSize={26} textAnchor="start" fill="var(--accent)">
            {subscript(PIPELINE.empiricalLabel)}
          </Label>
          <Label x={TABLE.symbolX} y={RESULT_Y + 42} fontSize={19} textAnchor="start" fill="var(--fg-muted)">
            n = {molecularMass} ÷ {empiricalMass} = {n}
          </Label>
          <Label x={TABLE.symbolX} y={RESULT_Y + 90} fontSize={19} textAnchor="start" fill="var(--fg-muted)">
            Molecular formula
          </Label>
          <Label x={330} y={RESULT_Y + 90} fontSize={26} textAnchor="start" fill="var(--accent)">
            {subscript(PIPELINE.molecularLabel)}
          </Label>
        </g>
      </svg>
    </div>
  )
}

function formatFixed(x: number, decimals: number): string {
  return x.toFixed(decimals)
}
