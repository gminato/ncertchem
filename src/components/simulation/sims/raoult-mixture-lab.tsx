'use client';

import { useState, type ReactNode } from 'react';
import { Segmented, Slider } from '@/components/controls';
import { VocabDefs } from '@/components/vocab';
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg';
import type { SimulationProps } from '@/components/simulation/registry';
import {
  getLiquidPairPreset,
  LIQUID_PAIR_PRESETS,
  type LiquidPairPresetId,
  moreVolatileComponent,
  NON_VOLATILE_WATER_PRESET,
  raoultBinary,
  raoultNonVolatile,
} from '@/lib/chem/raoult-law';
import styles from './raoult-mixture-lab.module.css';

type LabMode = 'volatile' | 'non-volatile';

const MODE_OPTIONS: readonly { value: LabMode; label: string }[] = [
  { value: 'volatile', label: 'Two volatile liquids' },
  { value: 'non-volatile', label: 'Non-volatile solute' },
] as const;

const PAIR_OPTIONS: readonly { value: LiquidPairPresetId; label: string }[] =
  LIQUID_PAIR_PRESETS.map((preset) => ({
    value: preset.id,
    label: preset.label,
  }));

/** Deterministic spread order so solute particles distribute evenly across 10 surface sites */
const SOLUTE_SPREAD_ORDER = [4, 1, 7, 2, 8, 5, 0, 9, 3, 6] as const;

const VAPOUR_DOT_POSITIONS = [
  { x: 426, y: 120 },
  { x: 478, y: 112 },
  { x: 528, y: 124 },
  { x: 448, y: 146 },
  { x: 504, y: 148 },
  { x: 430, y: 168 },
  { x: 484, y: 166 },
  { x: 534, y: 164 },
] as const;

const UNICODE_SUB_MAP: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
};

/** Splits a chemical formula with Unicode subscript digits into clean tokens. */
function parseFormulaTokens(formula: string): { text: string; isSub: boolean }[] {
  const out: { text: string; isSub: boolean }[] = [];
  for (const ch of formula) {
    const mapped = UNICODE_SUB_MAP[ch];
    const isSub = mapped !== undefined;
    const val = mapped ?? ch;
    const prev = out[out.length - 1];
    if (prev && prev.isSub === isSub) {
      prev.text += val;
    } else {
      out.push({ text: val, isSub });
    }
  }
  return out;
}

/** Pure SVG formula renderer using <Sub> tspans (safe inside <text>). */
function SvgFormulaTspan({ formula }: { formula: string }): ReactNode {
  return (
    <>
      {parseFormulaTokens(formula).map((tok, i) =>
        tok.isSub ? <Sub key={i}>{tok.text}</Sub> : tok.text,
      )}
    </>
  );
}

function HtmlFormula({ formula }: { formula: string }): ReactNode {
  return (
    <>
      {parseFormulaTokens(formula).map((tok, i) =>
        tok.isSub ? <sub key={i}>{tok.text}</sub> : tok.text,
      )}
    </>
  );
}

export function RaoultMixtureLab({ reducedMotion }: SimulationProps) {
  const [mode, setMode] = useState<LabMode>('volatile');
  const [pairId, setPairId] = useState<LiquidPairPresetId>('chloroform-dcm');
  const [x2, setX2] = useState<number>(0.5);
  const t = useAmbientTime(reducedMotion);

  const preset = getLiquidPairPreset(pairId);
  const binary = raoultBinary({
    p1Zero: preset.p1Zero,
    p2Zero: preset.p2Zero,
    x2,
  });
  const nonVol = raoultNonVolatile({
    p1Zero: NON_VOLATILE_WATER_PRESET.p1Zero,
    xSolute: x2,
  });

  const moreVol = moreVolatileComponent(preset.p1Zero, preset.p2Zero);

  // Graph geometry (left panel)
  const gx0 = 64;
  const gx1 = 362;
  const gy0 = 286;
  const gy1 = 56;
  const toX = (frac: number) => gx0 + frac * (gx1 - gx0);

  const activeYMax =
    mode === 'volatile' ? preset.yMax : NON_VOLATILE_WATER_PRESET.yMax;
  const activeTickStep =
    mode === 'volatile' ? preset.tickStep : NON_VOLATILE_WATER_PRESET.tickStep;
  const activeUnit =
    mode === 'volatile' ? preset.unit : NON_VOLATILE_WATER_PRESET.unit;

  const toY = (p: number) => gy0 - (p / activeYMax) * (gy0 - gy1);

  const ticks: number[] = [];
  for (let v = 0; v <= activeYMax; v += activeTickStep) {
    ticks.push(v);
  }

  // Stacked composition bars (right panel in volatile mode)
  const barTop = 82;
  const barHeight = 176;
  const liq2H = binary.x2 * barHeight;
  const vap2H = binary.y2 * barHeight;

  // Non-volatile surface occupancy (10 sites)
  const soluteSiteCount = Math.round(x2 * 10);
  const blockedIndices = new Set<number>(
    SOLUTE_SPREAD_ORDER.slice(0, soluteSiteCount),
  );
  const visibleVapourCount = Math.round(nonVol.xSolvent * VAPOUR_DOT_POSITIONS.length);

  const transitionStyle = reducedMotion ? undefined : { transition: 'all 140ms ease-out' };

  const summary =
    mode === 'volatile'
      ? `${preset.name1} and ${preset.name2} at ${preset.temperatureK} K. Liquid mole fractions: x1 equals ${binary.x1.toFixed(2)}, x2 equals ${binary.x2.toFixed(2)}. Partial pressures: p1 equals ${binary.p1.toFixed(1)} ${preset.unit}, p2 equals ${binary.p2.toFixed(1)} ${preset.unit}, total pressure ${binary.pTotal.toFixed(1)} ${preset.unit}. Equilibrium vapour mole fractions: y1 equals ${binary.y1.toFixed(2)}, y2 equals ${binary.y2.toFixed(2)}.`
      : `Water with non-volatile sucrose at ${NON_VOLATILE_WATER_PRESET.temperatureK} K. Solvent mole fraction ${nonVol.xSolvent.toFixed(2)}, solute mole fraction ${x2.toFixed(2)}. Solution vapour pressure is ${nonVol.pSolution.toFixed(2)} mmHg, lowered by ${nonVol.lowering.toFixed(2)} mmHg from pure water at ${NON_VOLATILE_WATER_PRESET.p1Zero} mmHg.`;

  // Midpoint position for p_total line label
  const midP = (preset.p1Zero + preset.p2Zero) / 2;

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented
          label="Solution type"
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
        />

        {mode === 'volatile' && (
          <Segmented
            label="Liquid pair"
            options={PAIR_OPTIONS}
            value={pairId}
            onChange={setPairId}
          />
        )}

        <Slider
          label={
            mode === 'volatile'
              ? `Mole fraction of ${preset.formula2} (x₂)`
              : 'Non-volatile solute mole fraction (x₂)'
          }
          value={x2}
          min={0}
          max={1}
          step={0.02}
          onChange={setX2}
          format={(v) => v.toFixed(2)}
        />
      </div>

      <div className={styles.stage}>
        <svg
          viewBox="0 0 580 364"
          className={styles.svg}
          role="img"
          aria-label={summary}
        >
          <VocabDefs idPrefix="rml" />

          {/* Graph title */}
          <text
            x={(gx0 + gx1) / 2}
            y={26}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
          >
            {mode === 'volatile'
              ? `${preset.name1} + ${preset.name2} (${preset.temperatureK} K)`
              : `${NON_VOLATILE_WATER_PRESET.name} + Non-Volatile Solute (${NON_VOLATILE_WATER_PRESET.temperatureK} K)`}
          </text>

          {/* Axes */}
          <line
            x1={gx0}
            y1={gy1}
            x2={gx0}
            y2={gy0}
            stroke="var(--fg)"
            strokeWidth={1.8}
          />
          <line
            x1={gx0}
            y1={gy0}
            x2={gx1}
            y2={gy0}
            stroke="var(--fg)"
            strokeWidth={1.8}
          />
          <line
            x1={gx1}
            y1={gy1}
            x2={gx1}
            y2={gy0}
            stroke="var(--border)"
            strokeWidth={1.2}
          />

          {/* Y gridlines and ticks */}
          {ticks.map((val) => (
            <g key={`ytick-${val}`}>
              {val > 0 && (
                <line
                  x1={gx0}
                  y1={toY(val)}
                  x2={gx1}
                  y2={toY(val)}
                  stroke="var(--border)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
              )}
              <text
                x={gx0 - 9}
                y={toY(val) + 5}
                textAnchor="end"
                fontSize={14}
                fill="var(--fg-muted)"
                fontFamily="var(--font-mono)"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={16}
            y={170}
            textAnchor="middle"
            fontSize={14}
            fontWeight={600}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            transform="rotate(-90 16 170)"
          >
            Vapour pressure ({activeUnit})
          </text>

          {/* X-axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={`xtick-${tick}`}>
              <line
                x1={toX(tick)}
                y1={gy0}
                x2={toX(tick)}
                y2={gy0 + 5}
                stroke="var(--fg-muted)"
                strokeWidth={1.4}
              />
              <text
                x={toX(tick)}
                y={gy0 + 22}
                textAnchor="middle"
                fontSize={14}
                fill="var(--fg-muted)"
                fontFamily="var(--font-mono)"
              >
                {tick.toFixed(tick === 0 || tick === 1 ? 0 : 2)}
              </text>
            </g>
          ))}
          <text
            x={(gx0 + gx1) / 2}
            y={342}
            textAnchor="middle"
            fontSize={14}
            fontWeight={600}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
          >
            {mode === 'volatile' ? (
              <>
                Mole fraction x<Sub>2</Sub> of <SvgFormulaTspan formula={preset.formula2} />  (x<Sub>1</Sub> = 1 − x<Sub>2</Sub>)
              </>
            ) : (
              <>
                Solute mole fraction x<Sub>2</Sub>  (x<Sub>1</Sub> = 1 − x<Sub>2</Sub>)
              </>
            )}
          </text>

          {/* Clean hairline vertical divider between graph and right panel (no nested boxes!) */}
          <line x1={386} y1={34} x2={386} y2={340} stroke="var(--border)" strokeWidth={1.1} opacity={0.8} />

          {mode === 'volatile' ? (
            <g>
              {/* p1 dashed line */}
              <line
                x1={toX(0)}
                y1={toY(preset.p1Zero)}
                x2={toX(1)}
                y2={toY(0)}
                stroke="var(--spot-1)"
                strokeWidth={2.2}
                strokeDasharray="6 4"
              />
              {/* p2 dashed line */}
              <line
                x1={toX(0)}
                y1={toY(0)}
                x2={toX(1)}
                y2={toY(preset.p2Zero)}
                stroke="var(--spot-2)"
                strokeWidth={2.2}
                strokeDasharray="6 4"
              />
              {/* pTotal solid line */}
              <line
                x1={toX(0)}
                y1={toY(preset.p1Zero)}
                x2={toX(1)}
                y2={toY(preset.p2Zero)}
                stroke="var(--accent)"
                strokeWidth={3}
                strokeLinecap="round"
              />

              {/* Endpoint & p_total annotations with proper Sub/Sup */}
              <text
                x={gx0 + 6}
                y={Math.max(gy1 + 14, toY(preset.p1Zero) - 9)}
                fontSize={14}
                fontWeight={700}
                fill="var(--spot-1)"
                fontFamily="var(--font-sans)"
              >
                p<Sub>1</Sub><Sup>0</Sup>
              </text>
              <text
                x={gx1 - 6}
                y={Math.max(gy1 + 14, toY(preset.p2Zero) - 9)}
                textAnchor="end"
                fontSize={14}
                fontWeight={700}
                fill="var(--spot-2)"
                fontFamily="var(--font-sans)"
              >
                p<Sub>2</Sub><Sup>0</Sup>
              </text>
              <text
                x={toX(0.5)}
                y={Math.max(gy1 + 16, toY(midP) - 14)}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="var(--accent)"
                fontFamily="var(--font-sans)"
              >
                p<Sub>total</Sub>
              </text>

              {/* Live vertical cursor */}
              <line
                x1={toX(x2)}
                y1={gy0}
                x2={toX(x2)}
                y2={toY(binary.pTotal)}
                stroke="var(--fg-subtle)"
                strokeWidth={1.6}
                strokeDasharray="4 3"
                style={transitionStyle}
              />
              <circle
                cx={toX(x2)}
                cy={toY(binary.p1)}
                r={5.2}
                fill="var(--spot-1)"
                stroke="var(--surface)"
                strokeWidth={1.6}
                style={transitionStyle}
              />
              <circle
                cx={toX(x2)}
                cy={toY(binary.p2)}
                r={5.2}
                fill="var(--spot-2)"
                stroke="var(--surface)"
                strokeWidth={1.6}
                style={transitionStyle}
              />
              <circle
                cx={toX(x2)}
                cy={toY(binary.pTotal)}
                r={6.2}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={1.8}
                style={transitionStyle}
              />

              {/* Right panel (borderless): Liquid vs Vapour composition */}
              <text
                x={484}
                y={26}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="var(--fg)"
                fontFamily="var(--font-sans)"
              >
                Liquid vs Vapour
              </text>

              {/* Liquid bar */}
              <rect
                x={418}
                y={barTop}
                width={52}
                height={Math.max(0, barHeight - liq2H)}
                fill="var(--spot-1)"
                style={transitionStyle}
              />
              <rect
                x={418}
                y={barTop + (barHeight - liq2H)}
                width={52}
                height={Math.max(0, liq2H)}
                fill="var(--spot-2)"
                style={transitionStyle}
              />
              <rect
                x={418}
                y={barTop}
                width={52}
                height={barHeight}
                rx={4}
                fill="none"
                stroke="var(--border)"
                strokeWidth={1.4}
              />
              {binary.x1 >= 0.16 && (
                <text
                  x={444}
                  y={barTop + (barHeight - liq2H) / 2 + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--accent-fg)"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(binary.x1 * 100)}%
                </text>
              )}
              {binary.x2 >= 0.16 && (
                <text
                  x={444}
                  y={barTop + (barHeight - liq2H) + liq2H / 2 + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--accent-fg)"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(binary.x2 * 100)}%
                </text>
              )}
              <text
                x={444}
                y={barTop + barHeight + 22}
                textAnchor="middle"
                fontSize={14}
                fill="var(--fg-muted)"
                fontFamily="var(--font-sans)"
              >
                Liquid
              </text>

              {/* Vapour bar */}
              <rect
                x={498}
                y={barTop}
                width={52}
                height={Math.max(0, barHeight - vap2H)}
                fill="var(--spot-1)"
                style={transitionStyle}
              />
              <rect
                x={498}
                y={barTop + (barHeight - vap2H)}
                width={52}
                height={Math.max(0, vap2H)}
                fill="var(--spot-2)"
                style={transitionStyle}
              />
              <rect
                x={498}
                y={barTop}
                width={52}
                height={barHeight}
                rx={4}
                fill="none"
                stroke="var(--border)"
                strokeWidth={1.4}
              />
              {binary.y1 >= 0.16 && (
                <text
                  x={524}
                  y={barTop + (barHeight - vap2H) / 2 + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--accent-fg)"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(binary.y1 * 100)}%
                </text>
              )}
              {binary.y2 >= 0.16 && (
                <text
                  x={524}
                  y={barTop + (barHeight - vap2H) + vap2H / 2 + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--accent-fg)"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(binary.y2 * 100)}%
                </text>
              )}
              <text
                x={524}
                y={barTop + barHeight + 22}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="var(--fg)"
                fontFamily="var(--font-sans)"
              >
                Vapour
              </text>

              {/* Clean inline enrichment readout (no nested pill box) */}
              <text
                x={484}
                y={324}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="var(--accent)"
                fontFamily="var(--font-mono)"
              >
                {x2 === 0 ? (
                  <>
                    Pure <SvgFormulaTspan formula={preset.formula1} />
                  </>
                ) : x2 === 1 ? (
                  <>
                    Pure <SvgFormulaTspan formula={preset.formula2} />
                  </>
                ) : moreVol === 2 ? (
                  <>
                    y<Sub>2</Sub> ({binary.y2.toFixed(2)}) &gt; x<Sub>2</Sub> ({binary.x2.toFixed(2)})
                  </>
                ) : (
                  <>
                    y<Sub>1</Sub> ({binary.y1.toFixed(2)}) &gt; x<Sub>1</Sub> ({binary.x1.toFixed(2)})
                  </>
                )}
              </text>
            </g>
          ) : (
            <g>
              {/* Pure solvent horizontal reference */}
              <line
                x1={gx0}
                y1={toY(NON_VOLATILE_WATER_PRESET.p1Zero)}
                x2={gx1}
                y2={toY(NON_VOLATILE_WATER_PRESET.p1Zero)}
                stroke="var(--fg-subtle)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <text
                x={gx1 - 6}
                y={toY(NON_VOLATILE_WATER_PRESET.p1Zero) - 9}
                textAnchor="end"
                fontSize={14}
                fontWeight={600}
                fill="var(--fg-muted)"
                fontFamily="var(--font-sans)"
              >
                Pure p<Sub>1</Sub><Sup>0</Sup> = {NON_VOLATILE_WATER_PRESET.p1Zero} mmHg
              </text>

              {/* Lowered p1 line */}
              <line
                x1={toX(0)}
                y1={toY(NON_VOLATILE_WATER_PRESET.p1Zero)}
                x2={toX(1)}
                y2={toY(0)}
                stroke="var(--spot-1)"
                strokeWidth={3}
                strokeLinecap="round"
              />

              {/* Highlight lowering drop Δp1 at current x2 */}
              {x2 > 0.04 && (
                <g>
                  <line
                    x1={toX(x2)}
                    y1={toY(NON_VOLATILE_WATER_PRESET.p1Zero)}
                    x2={toX(x2)}
                    y2={toY(nonVol.pSolution)}
                    stroke="var(--caution)"
                    strokeWidth={4}
                    strokeLinecap="round"
                    style={transitionStyle}
                  />
                  <text
                    x={x2 > 0.84 ? toX(x2) - 10 : toX(x2) + 10}
                    y={
                      (toY(NON_VOLATILE_WATER_PRESET.p1Zero) +
                        toY(nonVol.pSolution)) /
                        2 +
                      5
                    }
                    textAnchor={x2 > 0.84 ? 'end' : 'start'}
                    fontSize={14}
                    fontWeight={700}
                    fill="var(--caution)"
                    fontFamily="var(--font-sans)"
                  >
                    Δp<Sub>1</Sub>
                  </text>
                </g>
              )}

              {/* Active point */}
              <line
                x1={toX(x2)}
                y1={gy0}
                x2={toX(x2)}
                y2={toY(nonVol.pSolution)}
                stroke="var(--fg-subtle)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <circle
                cx={toX(x2)}
                cy={toY(nonVol.pSolution)}
                r={6.2}
                fill="var(--spot-1)"
                stroke="var(--surface)"
                strokeWidth={1.8}
                style={transitionStyle}
              />

              {/* Right panel (borderless): Surface occupancy mini-vessel */}
              <text
                x={484}
                y={26}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="var(--fg)"
                fontFamily="var(--font-sans)"
              >
                Surface Occupancy
              </text>

              {/* Mini closed glass vessel */}
              <rect
                x={408}
                y={74}
                width={152}
                height={208}
                rx={14}
                fill="var(--glass-fill)"
                stroke="var(--glass-wall)"
                strokeWidth={2}
              />
              <rect
                x={410}
                y={76}
                width={148}
                height={118}
                rx={12}
                fill="var(--vapour)"
                opacity={0.55}
              />
              <path
                d="M 410 194 L 558 194 L 558 268 Q 558 280 546 280 L 422 280 Q 410 280 410 268 Z"
                fill="var(--liquid)"
                opacity={0.8}
              />
              <line
                x1={410}
                y1={194}
                x2={558}
                y2={194}
                stroke="var(--liquid-edge)"
                strokeWidth={2}
              />
              <line
                x1={418}
                y1={92}
                x2={418}
                y2={266}
                stroke="var(--glass-sheen)"
                strokeWidth={2.4}
                strokeLinecap="round"
              />

              {/* Living vapour spheres drifting gently */}
              {VAPOUR_DOT_POSITIONS.slice(0, visibleVapourCount).map((pt, i) => {
                const dx = reducedMotion ? 0 : Math.sin(t * 1.4 + i * 1.9) * 4;
                const dy = reducedMotion ? 0 : Math.cos(t * 1.2 + i * 2.2) * 3.5;
                return (
                  <g key={`nv-vap-${i}`}>
                    <circle
                      cx={pt.x + dx}
                      cy={pt.y + dy}
                      r={5.2}
                      fill="var(--spot-1)"
                      stroke="var(--atom-rim)"
                      strokeWidth={0.9}
                    />
                    <circle
                      cx={pt.x + dx}
                      cy={pt.y + dy}
                      r={5.2}
                      fill="url(#rml-sphere-shading)"
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                );
              })}

              {/* 10 surface sites with 3D-shaded spheres */}
              {Array.from({ length: 10 }, (_, idx) => {
                const cx = 420 + idx * 14.2;
                const cy = 204;
                const isBlocked = blockedIndices.has(idx);
                const r = isBlocked ? 6.5 : 5;
                return (
                  <g key={`nv-site-${idx}`}>
                    {!isBlocked ? (
                      <line
                        x1={cx}
                        y1={191}
                        x2={cx}
                        y2={176}
                        stroke="var(--spot-1)"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                      />
                    ) : (
                      <line
                        x1={cx - 4.5}
                        y1={189}
                        x2={cx + 4.5}
                        y2={189}
                        stroke="var(--caution)"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={isBlocked ? 'var(--spot-4)' : 'var(--spot-1)'}
                      stroke="var(--atom-rim)"
                      strokeWidth={0.9}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="url(#rml-sphere-shading)"
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                );
              })}

              {/* Clean inline summary caption below mini-vessel */}
              <text
                x={484}
                y={316}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="var(--caution)"
                fontFamily="var(--font-mono)"
              >
                {10 - soluteSiteCount}/10 sites escape
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className={styles.readout}>
        {mode === 'volatile' ? (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Liquid x<sub>1</sub> (<HtmlFormula formula={preset.formula1} />)
                </span>
                <span className={`${styles.metricValue} ${styles.metricSpot1}`}>
                  {binary.x1.toFixed(2)}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Liquid x<sub>2</sub> (<HtmlFormula formula={preset.formula2} />)
                </span>
                <span className={`${styles.metricValue} ${styles.metricSpot2}`}>
                  {binary.x2.toFixed(2)}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Partial p<sub>1</sub>
                </span>
                <span className={styles.metricValue}>
                  {binary.p1.toFixed(1)} {preset.unit}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Partial p<sub>2</sub>
                </span>
                <span className={styles.metricValue}>
                  {binary.p2.toFixed(1)} {preset.unit}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Total p<sub>total</sub>
                </span>
                <span className={`${styles.metricValue} ${styles.metricAccent}`}>
                  {binary.pTotal.toFixed(1)} {preset.unit}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Vapour y<sub>1</sub> / y<sub>2</sub>
                </span>
                <span className={styles.metricValue}>
                  {binary.y1.toFixed(2)} / {binary.y2.toFixed(2)}
                </span>
              </div>
            </div>

            <p className={styles.insight}>
              {x2 === 0 || x2 === 1 ? (
                <>
                  <strong>Pure liquid endpoint:</strong> With only one component
                  present, the equilibrium vapour matches the liquid composition
                  and exerts its pure vapour pressure (
                  {x2 === 0
                    ? `${preset.p1Zero} ${preset.unit}`
                    : `${preset.p2Zero} ${preset.unit}`}
                  ).
                </>
              ) : moreVol === 2 ? (
                <>
                  <strong>Vapour enrichment:</strong> {preset.name2} is more
                  volatile (p<sub>2</sub><sup>0</sup> = {preset.p2Zero} {preset.unit} &gt; p
                  <sub>1</sub><sup>0</sup> = {preset.p1Zero} {preset.unit}), so its vapour
                  fraction y<sub>2</sub> = {binary.y2.toFixed(2)} is always greater than its
                  liquid fraction x<sub>2</sub> = {binary.x2.toFixed(2)}.
                </>
              ) : (
                <>
                  <strong>Vapour enrichment:</strong> {preset.name1} is more
                  volatile (p<sub>1</sub><sup>0</sup> = {preset.p1Zero} {preset.unit} &gt; p
                  <sub>2</sub><sup>0</sup> = {preset.p2Zero} {preset.unit}), so its vapour
                  fraction y<sub>1</sub> = {binary.y1.toFixed(2)} is always greater than its
                  liquid fraction x<sub>1</sub> = {binary.x1.toFixed(2)}.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Solvent x<sub>1</sub> (H<sub>2</sub>O)
                </span>
                <span className={`${styles.metricValue} ${styles.metricSpot1}`}>
                  {nonVol.xSolvent.toFixed(2)}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Solute x<sub>2</sub>
                </span>
                <span className={styles.metricValue}>{x2.toFixed(2)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Pure solvent p<sub>1</sub><sup>0</sup>
                </span>
                <span className={styles.metricValue}>
                  {NON_VOLATILE_WATER_PRESET.p1Zero.toFixed(1)} mmHg
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Solution p<sub>1</sub>
                </span>
                <span className={`${styles.metricValue} ${styles.metricAccent}`}>
                  {nonVol.pSolution.toFixed(2)} mmHg
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Lowering Δp<sub>1</sub>
                </span>
                <span className={`${styles.metricValue} ${styles.metricCaution}`}>
                  {nonVol.lowering.toFixed(2)} mmHg
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Relative Δp<sub>1</sub> / p<sub>1</sub><sup>0</sup>
                </span>
                <span className={styles.metricValue}>
                  {nonVol.relativeLowering.toFixed(2)}
                </span>
              </div>
            </div>

            <p className={styles.insight}>
              <strong>Surface-blocking effect:</strong> Non-volatile solute
              particles occupy {(x2 * 100).toFixed(0)}% of the surface sites
              without escaping, cutting the solvent vapour pressure by the exact
              same fraction ({nonVol.lowering.toFixed(2)} mmHg drop).
            </p>
          </>
        )}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
