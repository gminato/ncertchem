'use client';

import { useMemo, useState } from 'react';
import { Sub, Sup } from '@/components/animations/c12-unit1/ChemSvg';
import { Segmented, Slider } from '@/components/controls';
import type { SimulationProps } from '@/components/simulation/registry';
import {
  MIXTURE_PRESETS,
  findAzeotrope,
  nonIdealVapourPressure,
  sampleVapourCurve,
} from '@/lib/chem/ideal-nonideal';
import styles from './azeotrope-explorer.module.css';

type ExplorerPresetId =
  | 'hexane-heptane'
  | 'ethanol-acetone'
  | 'chloroform-acetone';

const PRESET_OPTIONS: readonly { value: ExplorerPresetId; label: string }[] = [
  { value: 'hexane-heptane', label: 'Ideal: Hexane + Heptane' },
  { value: 'ethanol-acetone', label: 'Positive: Ethanol + Acetone' },
  { value: 'chloroform-acetone', label: 'Negative: CHCl₃ + Acetone' },
];

const PLOT = {
  left: 76,
  right: 520,
  top: 32,
  bottom: 266,
} as const;

const PLOT_W = PLOT.right - PLOT.left;
const PLOT_H = PLOT.bottom - PLOT.top;

function polylinePath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
}

function formatSigned(val: number, decimals = 1): string {
  if (Math.abs(val) < 1e-6) return (0).toFixed(decimals);
  return `${val > 0 ? '+' : '−'}${Math.abs(val).toFixed(decimals)}`;
}

export function AzeotropeExplorer({ reducedMotion }: SimulationProps) {
  const [presetId, setPresetId] = useState<ExplorerPresetId>('ethanol-acetone');
  const [interactionW, setInteractionW] = useState<number>(
    MIXTURE_PRESETS['ethanol-acetone'].interactionW,
  );
  const [x2, setX2] = useState<number>(0.5);

  const preset = MIXTURE_PRESETS[presetId];

  const handlePresetChange = (nextId: ExplorerPresetId) => {
    setPresetId(nextId);
    setInteractionW(MIXTURE_PRESETS[nextId].interactionW);
  };

  const current = useMemo(
    () =>
      nonIdealVapourPressure({
        p1Zero: preset.p1Zero,
        p2Zero: preset.p2Zero,
        x2,
        interactionW,
      }),
    [preset.p1Zero, preset.p2Zero, x2, interactionW],
  );

  const azeotrope = useMemo(
    () =>
      findAzeotrope({
        p1Zero: preset.p1Zero,
        p2Zero: preset.p2Zero,
        interactionW,
      }),
    [preset.p1Zero, preset.p2Zero, interactionW],
  );

  const thresholdW = Math.abs(Math.log(preset.p2Zero / preset.p1Zero));

  const {
    yMax,
    yTicks,
    p1Path,
    p2Path,
    pTotalPath,
    ribbonPath,
  } = useMemo(() => {
    const samples = sampleVapourCurve(
      preset.p1Zero,
      preset.p2Zero,
      interactionW,
      60,
    );
    const peakP = samples.reduce(
      (max, pt) => Math.max(max, pt.pTotal, pt.pTotalIdeal),
      Math.max(preset.p1Zero, preset.p2Zero),
    );
    const computedYMax = Math.max(100, Math.ceil((peakP * 1.24) / 20) * 20);

    const toX = (frac: number) => PLOT.left + frac * PLOT_W;
    const toY = (p: number) =>
      PLOT.bottom - (Math.max(0, Math.min(computedYMax, p)) / computedYMax) * PLOT_H;

    const p1Pts = samples.map((s) => ({ x: toX(s.x2), y: toY(s.p1) }));
    const p2Pts = samples.map((s) => ({ x: toX(s.x2), y: toY(s.p2) }));
    const pTotPts = samples.map((s) => ({ x: toX(s.x2), y: toY(s.pTotal) }));
    const pIdealPts = samples.map((s) => ({
      x: toX(s.x2),
      y: toY(s.pTotalIdeal),
    }));

    const ribbon =
      polylinePath(pTotPts) +
      ' ' +
      pIdealPts
        .slice()
        .reverse()
        .map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
        .join(' ') +
      ' Z';

    const stepTick = computedYMax / 4;
    const ticks = [0, stepTick, stepTick * 2, stepTick * 3, computedYMax];

    return {
      yMax: computedYMax,
      yTicks: ticks,
      p1Path: polylinePath(p1Pts),
      p2Path: polylinePath(p2Pts),
      pTotalPath: polylinePath(pTotPts),
      ribbonPath: ribbon,
    };
  }, [preset.p1Zero, preset.p2Zero, interactionW]);

  const xPx = (frac: number) => PLOT.left + frac * PLOT_W;
  const yPx = (p: number) =>
    PLOT.bottom - (Math.max(0, Math.min(yMax, p)) / yMax) * PLOT_H;

  const isPositive = current.deviationSign === 'positive';
  const isNegative = current.deviationSign === 'negative';
  const devColor = isPositive
    ? 'var(--heat)'
    : isNegative
      ? 'var(--coolant)'
      : 'var(--accent)';

  const deltaP = current.pTotal - current.pTotalIdeal;

  const deviationLabel = isPositive
    ? 'Positive deviation'
    : isNegative
      ? 'Negative deviation'
      : 'Ideal (Raoult’s law)';

  const thermoSign = isPositive ? '>' : isNegative ? '<' : '=';

  const thermoSub = isPositive
    ? 'Endothermic mixing, slight volume expansion'
    : isNegative
      ? 'Exothermic mixing, slight volume contraction'
      : 'No heat absorbed/evolved; volumes strictly additive';

  const isDefaultW = Math.abs(interactionW - preset.interactionW) < 0.05;
  const molecularReason = isDefaultW
    ? preset.forceReason
    : isPositive
      ? `Tuned to w = ${formatSigned(interactionW)} (A–B weaker than A–A and B–B): molecules escape more readily than in pure ${preset.component1} or ${preset.component2}, bowing vapour-pressure curves above Raoult’s line.`
      : isNegative
        ? `Tuned to w = ${formatSigned(interactionW)} (A–B stronger than A–A and B–B): stronger unlike-molecule attraction traps molecules in the liquid, bowing vapour-pressure curves below Raoult’s line.`
        : `Tuned to w = 0.0: A–B attractions exactly match A–A and B–B, restoring ideal Raoult’s-law straight lines across all compositions.`;

  const azeotropeTitle = azeotrope
    ? azeotrope.type === 'minimum-boiling'
      ? 'Minimum-boiling'
      : 'Maximum-boiling'
    : 'None';

  // Azeotrope callout coordinates
  const azX = azeotrope ? xPx(azeotrope.x2) : PLOT.left;
  const azY = azeotrope ? yPx(azeotrope.pTotal) : PLOT.top;
  const azPillX = Math.max(PLOT.left + 98, Math.min(PLOT.right - 98, azX));
  const azPillY =
    azeotrope?.type === 'minimum-boiling'
      ? Math.max(PLOT.top + 18, azY - 26)
      : PLOT.top + 18;

  const yP1Zero = yPx(preset.p1Zero);

  const summary = `${preset.label} with interaction parameter w = ${formatSigned(interactionW)} at x₂ = ${x2.toFixed(2)}: ${deviationLabel}, real total vapour pressure ${current.pTotal.toFixed(1)} kPa versus ideal ${current.pTotalIdeal.toFixed(1)} kPa, azeotrope status: ${azeotropeTitle}.`;

  const transitionStyle = reducedMotion
    ? undefined
    : { transition: 'cx 120ms ease, cy 120ms ease' };

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented
          label="Mixture preset"
          options={PRESET_OPTIONS}
          value={presetId}
          onChange={handlePresetChange}
        />
        <div className={styles.sliders}>
          <Slider
            label="Interaction parameter w (A–B vs A–A/B–B)"
            value={interactionW}
            min={-1.8}
            max={1.8}
            step={0.1}
            onChange={setInteractionW}
            format={(v) => formatSigned(v, 1)}
          />
          <Slider
            label={`Mole fraction of ${preset.component2} (x₂)`}
            value={x2}
            min={0}
            max={1}
            step={0.02}
            onChange={setX2}
            format={(v) => v.toFixed(2)}
          />
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          viewBox="0 0 580 360"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`Vapour pressure versus mole fraction plot for ${preset.label} at w = ${formatSigned(interactionW)}`}
        >
          {/* Horizontal grid & y-axis tick labels */}
          {yTicks.map((tick) => {
            const y = yPx(tick);
            const hideTickLabel = Math.abs(y - yP1Zero) < 16;
            return (
              <g key={tick}>
                {tick > 0 && (
                  <line
                    x1={PLOT.left}
                    y1={y}
                    x2={PLOT.right}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth={1}
                    strokeDasharray="2 5"
                    opacity={0.75}
                  />
                )}
                {!hideTickLabel && (
                  <text
                    x={PLOT.left - 10}
                    y={y + 4.5}
                    textAnchor="end"
                    fontSize={13.5}
                    fontFamily="var(--font-mono)"
                    fill="var(--fg-muted)"
                  >
                    {Math.round(tick)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Deviation shading between real and ideal p_total */}
          {(isPositive || isNegative) && (
            <path d={ribbonPath} fill={devColor} fillOpacity={0.13} />
          )}

          {/* Dashed ideal Raoult lines */}
          <line
            x1={xPx(0)}
            y1={yPx(preset.p1Zero)}
            x2={xPx(1)}
            y2={yPx(0)}
            stroke="var(--fg-subtle)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <line
            x1={xPx(0)}
            y1={yPx(0)}
            x2={xPx(1)}
            y2={yPx(preset.p2Zero)}
            stroke="var(--fg-subtle)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <line
            x1={xPx(0)}
            y1={yPx(preset.p1Zero)}
            x2={xPx(1)}
            y2={yPx(preset.p2Zero)}
            stroke="var(--fg-muted)"
            strokeWidth={1.8}
            strokeDasharray="6 4"
          />

          {/* Solid real vapour pressure curves */}
          <path
            d={p1Path}
            fill="none"
            stroke="var(--spot-2)"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <path
            d={p2Path}
            fill="none"
            stroke="var(--spot-3)"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <path
            d={pTotalPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={3.2}
            strokeLinecap="round"
          />

          {/* Azeotrope peak/valley marker */}
          {azeotrope && (
            <g>
              <line
                x1={azX}
                y1={azY}
                x2={azX}
                y2={PLOT.bottom}
                stroke={devColor}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              {azeotrope.type === 'maximum-boiling' && (
                <line
                  x1={azX}
                  y1={azPillY + 13}
                  x2={azX}
                  y2={azY - 8}
                  stroke={devColor}
                  strokeWidth={1.3}
                />
              )}
              <circle
                cx={azX}
                cy={azY}
                r={10}
                fill={devColor}
                fillOpacity={0.22}
              />
              <circle
                cx={azX}
                cy={azY}
                r={5}
                fill={devColor}
                stroke="var(--surface)"
                strokeWidth={1.6}
              />
              <rect
                x={azPillX - 96}
                y={azPillY - 12}
                width={192}
                height={24}
                rx={12}
                fill="var(--surface)"
                stroke={devColor}
                strokeWidth={1.4}
              />
              <text
                x={azPillX}
                y={azPillY + 4.5}
                textAnchor="middle"
                fontSize={13.5}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill={devColor}
              >
                {azeotrope.type === 'minimum-boiling' ? 'Min-boiling' : 'Max-boiling'} (x
                <Sub>2</Sub> = {azeotrope.x2.toFixed(2)})
              </text>
            </g>
          )}

          {/* Live x2 cursor */}
          <line
            x1={xPx(x2)}
            y1={PLOT.top}
            x2={xPx(x2)}
            y2={PLOT.bottom}
            stroke="var(--fg-subtle)"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
          {Math.abs(deltaP) > 0.2 && (
            <line
              x1={xPx(x2)}
              y1={yPx(current.pTotalIdeal)}
              x2={xPx(x2)}
              y2={yPx(current.pTotal)}
              stroke={devColor}
              strokeWidth={3}
            />
          )}
          <circle
            cx={xPx(x2)}
            cy={yPx(current.pTotalIdeal)}
            r={4.5}
            fill="var(--surface)"
            stroke="var(--fg-muted)"
            strokeWidth={2}
            style={transitionStyle}
          />
          <circle
            cx={xPx(x2)}
            cy={yPx(current.pTotal)}
            r={5.5}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={1.8}
            style={transitionStyle}
          />

          {/* Pure endpoint dots */}
          <circle
            cx={xPx(0)}
            cy={yP1Zero}
            r={4}
            fill="var(--spot-2)"
            stroke="var(--surface)"
            strokeWidth={1.4}
          />
          <circle
            cx={xPx(1)}
            cy={yPx(preset.p2Zero)}
            r={4}
            fill="var(--spot-3)"
            stroke="var(--surface)"
            strokeWidth={1.4}
          />

          {/* Open plot axes */}
          <line
            x1={PLOT.left}
            y1={PLOT.top}
            x2={PLOT.left}
            y2={PLOT.bottom}
            stroke="var(--fg)"
            strokeWidth={1.5}
          />
          <line
            x1={PLOT.right}
            y1={PLOT.top}
            x2={PLOT.right}
            y2={PLOT.bottom}
            stroke="var(--fg)"
            strokeWidth={1.5}
          />
          <line
            x1={PLOT.left}
            y1={PLOT.bottom}
            x2={PLOT.right}
            y2={PLOT.bottom}
            stroke="var(--fg)"
            strokeWidth={1.5}
          />

          {/* Pure vapour pressure tags cleanly outside left & right axes */}
          <text
            x={PLOT.left - 10}
            y={yP1Zero + 5}
            textAnchor="end"
            fontSize={14}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--spot-2)"
          >
            p<Sub>1</Sub>
            <Sup>0</Sup>
          </text>
          <text
            x={PLOT.right + 10}
            y={yPx(preset.p2Zero) + 5}
            textAnchor="start"
            fontSize={14}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--spot-3)"
          >
            p<Sub>2</Sub>
            <Sup>0</Sup>
          </text>

          {/* Y-axis title */}
          <text
            x={18}
            y={(PLOT.top + PLOT.bottom) / 2}
            textAnchor="middle"
            fontSize={13.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            transform={`rotate(-90 18 ${(PLOT.top + PLOT.bottom) / 2})`}
          >
            Vapour pressure (kPa)
          </text>

          {/* X-axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <text
              key={tick}
              x={xPx(tick)}
              y={PLOT.bottom + 19}
              textAnchor="middle"
              fontSize={13.5}
              fontFamily="var(--font-mono)"
              fill="var(--fg-muted)"
            >
              {tick === 0 || tick === 1 ? tick : tick.toFixed(2)}
            </text>
          ))}
          <text
            x={(PLOT.left + PLOT.right) / 2}
            y={PLOT.bottom + 40}
            textAnchor="middle"
            fontSize={14}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
          >
            Mole fraction of {preset.component2}, x<Sub>2</Sub>
          </text>

          {/* Clean unboxed bottom legend */}
          <g transform="translate(0, 338)">
            <line
              x1={26}
              y1={0}
              x2={52}
              y2={0}
              stroke="var(--fg-muted)"
              strokeWidth={1.8}
              strokeDasharray="6 4"
            />
            <text
              x={60}
              y={4.5}
              fontSize={13.5}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              Ideal Raoult
            </text>

            <line
              x1={158}
              y1={0}
              x2={184}
              y2={0}
              stroke="var(--accent)"
              strokeWidth={3.2}
              strokeLinecap="round"
            />
            <text
              x={192}
              y={4.5}
              fontSize={13.5}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              p<Sub>total</Sub>
            </text>

            <line
              x1={256}
              y1={0}
              x2={278}
              y2={0}
              stroke="var(--spot-2)"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <text
              x={286}
              y={4.5}
              fontSize={13.5}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              p<Sub>1</Sub> ({preset.component1})
            </text>

            <line
              x1={422}
              y1={0}
              x2={444}
              y2={0}
              stroke="var(--spot-3)"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <text
              x={452}
              y={4.5}
              fontSize={13.5}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              p<Sub>2</Sub> ({preset.component2})
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.grid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Deviation type</span>
            <span
              className={`${styles.statValue} ${
                isPositive
                  ? styles.statValuePositive
                  : isNegative
                    ? styles.statValueNegative
                    : styles.statValueIdeal
              }`}
            >
              {deviationLabel}
            </span>
            <span className={styles.statSub}>
              w = {formatSigned(interactionW)} at {preset.temperatureK} K
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statLabel}>Mixing signs</span>
            <span className={styles.statValue}>
              Δ<sub>mix</sub>H {thermoSign} 0, Δ<sub>mix</sub>V {thermoSign} 0
            </span>
            <span className={styles.statSub}>{thermoSub}</span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statLabel}>
              Real vs ideal{' '}
              <span className={styles.mathSymbol}>
                p<sub>total</sub>
              </span>
            </span>
            <span className={styles.statValue}>
              {current.pTotal.toFixed(1)} vs {current.pTotalIdeal.toFixed(1)} kPa
            </span>
            <span className={styles.statSub}>
              Δp = {formatSigned(deltaP, 1)} kPa · vapour y<sub>2</sub> = {current.y2.toFixed(2)}
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statLabel}>Azeotrope status</span>
            <span
              className={`${styles.statValue} ${
                azeotrope
                  ? azeotrope.type === 'minimum-boiling'
                    ? styles.statValuePositive
                    : styles.statValueNegative
                  : ''
              }`}
            >
              {azeotropeTitle}
            </span>
            <span className={styles.statSub}>
              {azeotrope ? (
                <>
                  At x<sub>2</sub> = {azeotrope.x2.toFixed(2)} (y<sub>2</sub> = x<sub>2</sub>), p
                  <sub>total</sub> = {azeotrope.pTotal.toFixed(1)} kPa
                </>
              ) : (
                <>Set |w| &gt; {thresholdW.toFixed(2)} to form an azeotrope</>
              )}
            </span>
          </div>
        </div>

        <p
          className={`${styles.reason} ${
            isPositive
              ? styles.reasonPositive
              : isNegative
                ? styles.reasonNegative
                : ''
          }`}
        >
          <span className={styles.reasonLabel}>Molecular forces:</span>
          {molecularReason}
        </p>

        <p className={styles.srOnly} aria-live="polite">
          {summary}
        </p>
      </div>
    </div>
  );
}
