'use client';

import { useMemo, type ReactNode } from 'react';
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg';
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber';
import { VocabDefs } from '@/components/vocab';
import {
  findAzeotrope,
  sampleVapourCurve,
} from '@/lib/chem/ideal-nonideal';
import {
  clampDeviationStep,
  getDeviationStep,
} from './deviations-steps';

export interface RaoultDeviationsProps {
  step: number;
  reducedMotion: boolean;
}

const VIEW_W = 580;
const VIEW_H = 540;

const PLOT = {
  left: 68,
  right: 522,
  top: 52,
  bottom: 304,
  pMax: 132,
} as const;

const PLOT_W = PLOT.right - PLOT.left;
const PLOT_H = PLOT.bottom - PLOT.top;

function xPx(x2: number): number {
  return PLOT.left + x2 * PLOT_W;
}

function yPx(p: number): number {
  const clamped = Math.max(0, Math.min(PLOT.pMax, p));
  return PLOT.bottom - (clamped / PLOT.pMax) * PLOT_H;
}

function polylinePath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
}

function renderMixtureLabel(id: string): ReactNode {
  switch (id) {
    case 'ideal':
      return 'n-Hexane + n-Heptane';
    case 'positive':
      return 'Ethanol + Acetone';
    case 'negative':
      return 'Chloroform + Acetone';
    case 'min-azeotrope':
      return '95% Ethanol + 5% Water';
    case 'max-azeotrope':
      return (
        <>
          68% HNO<Sub>3</Sub> + 32% Water
        </>
      );
    default:
      return '';
  }
}

function renderThermoLine(id: string): ReactNode {
  switch (id) {
    case 'ideal':
      return (
        <>
          Δ<Sub>mix</Sub>H = 0 · Δ<Sub>mix</Sub>V = 0
        </>
      );
    case 'positive':
      return (
        <>
          Δ<Sub>mix</Sub>H &gt; 0 · Δ<Sub>mix</Sub>V &gt; 0
        </>
      );
    case 'negative':
      return (
        <>
          Δ<Sub>mix</Sub>H &lt; 0 · Δ<Sub>mix</Sub>V &lt; 0
        </>
      );
    case 'min-azeotrope':
      return (
        <>
          x<Sub>2</Sub> = y<Sub>2</Sub> (vapour = liquid)
        </>
      );
    case 'max-azeotrope':
      return (
        <>
          x<Sub>2</Sub> = y<Sub>2</Sub> · boils at 393.5 K
        </>
      );
    default:
      return null;
  }
}

function renderMechanismCue(id: string): ReactNode {
  switch (id) {
    case 'ideal':
      return 'Balanced A–B pull · Raoult’s law';
    case 'positive':
      return 'Broken H-bonds → easier escape';
    case 'negative':
      return 'New H-bond → trapped in liquid';
    case 'min-azeotrope':
      return (
        <>
          Vapour-pressure peak · minimum T<Sub>b</Sub>
        </>
      );
    case 'max-azeotrope':
      return (
        <>
          Vapour-pressure dip · maximum T<Sub>b</Sub>
        </>
      );
    default:
      return null;
  }
}

function renderBottomEquation(id: string): ReactNode {
  switch (id) {
    case 'ideal':
      return (
        <>
          p<Sub>total</Sub> = p<Sub>1</Sub>
          <Sup>0</Sup>x<Sub>1</Sub> + p<Sub>2</Sub>
          <Sup>0</Sup>x<Sub>2</Sub> (ideal Raoult’s law)
        </>
      );
    case 'positive':
      return (
        <>
          p<Sub>total</Sub> &gt; p<Sub>1</Sub>
          <Sup>0</Sup>x<Sub>1</Sub> + p<Sub>2</Sub>
          <Sup>0</Sup>x<Sub>2</Sub> (positive deviation)
        </>
      );
    case 'negative':
      return (
        <>
          p<Sub>total</Sub> &lt; p<Sub>1</Sub>
          <Sup>0</Sup>x<Sub>1</Sub> + p<Sub>2</Sub>
          <Sup>0</Sup>x<Sub>2</Sub> (negative deviation)
        </>
      );
    case 'min-azeotrope':
      return (
        <>
          Peak p<Sub>total</Sub> → minimum-boiling azeotrope (x<Sub>2</Sub> = y<Sub>2</Sub>)
        </>
      );
    case 'max-azeotrope':
      return (
        <>
          Valley p<Sub>total</Sub> → maximum-boiling azeotrope at 393.5 K
        </>
      );
    default:
      return null;
  }
}

/** Build a smooth sinusoidal spring path between two points. */
function buildSpringPath(x1: number, x2: number, y: number, coils = 5, amp = 5): string {
  const len = Math.max(8, x2 - x1);
  const steps = coils * 8;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const x = x1 + f * len;
    const envelope = Math.sin(Math.PI * f);
    const dy = Math.sin(f * coils * 2 * Math.PI) * amp * envelope;
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(y + dy).toFixed(1)}`);
  }
  return parts.join(' ');
}

export function RaoultDeviations({
  step,
  reducedMotion,
}: RaoultDeviationsProps) {
  const index = clampDeviationStep(step);
  const current = getDeviationStep(index);

  const w = useTweenedNumber(current.interactionW, reducedMotion, 0.55);
  const p1Zero = useTweenedNumber(current.p1Zero, reducedMotion, 0.55);
  const p2Zero = useTweenedNumber(current.p2Zero, reducedMotion, 0.55);
  const azReveal = useTweenedNumber(current.highlightAzeotrope ? 1 : 0, reducedMotion, 0.45);
  const t = useAmbientTime(reducedMotion);

  const {
    p1Path,
    p2Path,
    pTotalPath,
    ribbonPath,
    azeotrope,
  } = useMemo(() => {
    const samples = sampleVapourCurve(p1Zero, p2Zero, w, 56);
    const p1Pts = samples.map((s) => ({ x: xPx(s.x2), y: yPx(s.p1) }));
    const p2Pts = samples.map((s) => ({ x: xPx(s.x2), y: yPx(s.p2) }));
    const pTotPts = samples.map((s) => ({ x: xPx(s.x2), y: yPx(s.pTotal) }));
    const pIdealPts = samples.map((s) => ({
      x: xPx(s.x2),
      y: yPx(s.pTotalIdeal),
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

    const az = findAzeotrope({ p1Zero, p2Zero, interactionW: w });

    return {
      p1Path: polylinePath(p1Pts),
      p2Path: polylinePath(p2Pts),
      pTotalPath: polylinePath(pTotPts),
      ribbonPath: ribbon,
      azeotrope: az,
    };
  }, [p1Zero, p2Zero, w]);

  const isPositive = w > 0.06;
  const isNegative = w < -0.06;
  const devColor = isPositive
    ? 'var(--heat)'
    : isNegative
      ? 'var(--coolant)'
      : 'var(--accent)';

  // Molecular forces strip geometry (borderless lower band, y: 392..490)
  const molCenterX = 166;
  const molY = 446;
  const baseSep = 48 + Math.max(-13, Math.min(24, w * 16));
  const vibAmp = isPositive ? 4.2 : isNegative ? 1.4 : 2.2;
  const vibFreq = isPositive ? 3.8 : isNegative ? 5.2 : 2.3;
  const osc = reducedMotion ? 0 : Math.sin(t * vibFreq) * vibAmp;
  const sep = baseSep + osc;
  const molAX = molCenterX - sep;
  const molBX = molCenterX + sep;

  // Escaping vapour indicator intensity for positive deviation (0..1)
  const escapeStrength = Math.max(0, Math.min(1, w / 1.1));
  // H-bond attraction glow intensity for negative deviation (0..1)
  const hbondStrength = Math.max(0, Math.min(1, -w / 1.1));

  // Azeotrope callout coordinates
  const showAz = azReveal > 0.04 && azeotrope !== null;
  const azX = azeotrope ? xPx(azeotrope.x2) : PLOT.left;
  const azY = azeotrope ? yPx(azeotrope.pTotal) : PLOT.top;
  const azPulseR = reducedMotion ? 12 : 11 + 4.5 * Math.sin(t * 3.1);
  const azPulseOpacity = reducedMotion ? 0.24 : 0.2 + 0.14 * Math.cos(t * 3.1);
  const isMinBoiling = azeotrope?.type === 'minimum-boiling';

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={current.ariaDescription}
      data-testid="raoult-deviations"
      data-step={index}
    >
      <VocabDefs idPrefix="raoult-dev" />

      {/* Top scientific header line — clean, borderless */}
      <text
        x={PLOT.left}
        y={28}
        fontSize={15}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={devColor}
      >
        {renderMixtureLabel(current.id)}
      </text>
      <text
        x={PLOT.right}
        y={28}
        textAnchor="end"
        fontSize={14}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        {isPositive
          ? 'Positive deviation'
          : isNegative
            ? 'Negative deviation'
            : 'Ideal solution'}
      </text>

      {/* Subtle horizontal grid hairlines */}
      {[30, 60, 90, 120].map((pTick) => (
        <line
          key={pTick}
          x1={PLOT.left}
          y1={yPx(pTick)}
          x2={PLOT.right}
          y2={yPx(pTick)}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="2 5"
          opacity={0.75}
        />
      ))}

      {/* Shaded deviation region between ideal and real p_total */}
      {(isPositive || isNegative) && (
        <path
          d={ribbonPath}
          fill={devColor}
          fillOpacity={0.14}
          stroke="none"
        />
      )}

      {/* Dashed ideal Raoult reference lines */}
      <line
        x1={xPx(0)}
        y1={yPx(p1Zero)}
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
        y2={yPx(p2Zero)}
        stroke="var(--fg-subtle)"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      <line
        x1={xPx(0)}
        y1={yPx(p1Zero)}
        x2={xPx(1)}
        y2={yPx(p2Zero)}
        stroke="var(--fg-muted)"
        strokeWidth={1.8}
        strokeDasharray="6 4"
      />

      {/* Real vapour-pressure curves */}
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

      {/* Pure component endpoints */}
      <circle
        cx={xPx(0)}
        cy={yPx(p1Zero)}
        r={4.5}
        fill="var(--spot-2)"
        stroke="var(--surface)"
        strokeWidth={1.6}
      />
      <circle
        cx={xPx(1)}
        cy={yPx(p2Zero)}
        r={4.5}
        fill="var(--spot-3)"
        stroke="var(--surface)"
        strokeWidth={1.6}
      />

      {/* Azeotrope pulsing highlight ring & clean callout (Steps 3 & 4) */}
      {showAz && azeotrope && (
        <g opacity={azReveal}>
          <line
            x1={azX}
            y1={azY}
            x2={azX}
            y2={PLOT.bottom}
            stroke={devColor}
            strokeWidth={1.6}
            strokeDasharray="4 3"
          />
          <circle
            cx={azX}
            cy={azY}
            r={azPulseR}
            fill={devColor}
            fillOpacity={azPulseOpacity}
          />
          <circle
            cx={azX}
            cy={azY}
            r={azPulseR + 4}
            fill="none"
            stroke={devColor}
            strokeWidth={1.2}
            strokeOpacity={azPulseOpacity * 0.9}
          />
          <circle
            cx={azX}
            cy={azY}
            r={5}
            fill={devColor}
            stroke="var(--surface)"
            strokeWidth={1.8}
          />

          {isMinBoiling ? (
            <>
              <line
                x1={azX - 10}
                y1={azY - 4}
                x2={azX - 42}
                y2={Math.max(PLOT.top + 16, azY - 14)}
                stroke={devColor}
                strokeWidth={1.4}
              />
              <text
                x={azX - 48}
                y={Math.max(PLOT.top + 20, azY - 10)}
                textAnchor="end"
                fontSize={14}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill={devColor}
              >
                Min-boiling peak (x<Sub>2</Sub> = y<Sub>2</Sub>)
              </text>
            </>
          ) : (
            <>
              <line
                x1={azX}
                y1={PLOT.top + 26}
                x2={azX}
                y2={azY - 12}
                stroke={devColor}
                strokeWidth={1.4}
                strokeDasharray="3 3"
              />
              <text
                x={azX}
                y={PLOT.top + 18}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill={devColor}
              >
                Max-boiling valley (x<Sub>2</Sub> = y<Sub>2</Sub>)
              </text>
            </>
          )}
        </g>
      )}

      {/* Clean open axes */}
      <line
        x1={PLOT.left}
        y1={PLOT.top}
        x2={PLOT.left}
        y2={PLOT.bottom}
        stroke="var(--fg)"
        strokeWidth={1.6}
      />
      <line
        x1={PLOT.right}
        y1={PLOT.top}
        x2={PLOT.right}
        y2={PLOT.bottom}
        stroke="var(--fg)"
        strokeWidth={1.6}
      />
      <line
        x1={PLOT.left}
        y1={PLOT.bottom}
        x2={PLOT.right}
        y2={PLOT.bottom}
        stroke="var(--fg)"
        strokeWidth={1.6}
      />

      {/* Pure vapour pressure endpoint labels outside axes */}
      <text
        x={PLOT.left - 10}
        y={yPx(p1Zero) + 5}
        textAnchor="end"
        fontSize={14.5}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--spot-2)"
      >
        p<Sub>1</Sub>
        <Sup>0</Sup>
      </text>
      <text
        x={PLOT.right + 10}
        y={yPx(p2Zero) + 5}
        textAnchor="start"
        fontSize={14.5}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--spot-3)"
      >
        p<Sub>2</Sub>
        <Sup>0</Sup>
      </text>

      {/* Rotated Y-axis label */}
      <text
        x={20}
        y={(PLOT.top + PLOT.bottom) / 2}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
        transform={`rotate(-90 20 ${(PLOT.top + PLOT.bottom) / 2})`}
      >
        Vapour pressure
      </text>

      {/* X-axis ticks */}
      {[0, 0.5, 1].map((tick) => (
        <g key={tick}>
          <line
            x1={xPx(tick)}
            y1={PLOT.bottom}
            x2={xPx(tick)}
            y2={PLOT.bottom + 5}
            stroke="var(--fg)"
            strokeWidth={1.4}
          />
          <text
            x={xPx(tick)}
            y={PLOT.bottom + 21}
            textAnchor="middle"
            fontSize={14}
            fontFamily="var(--font-mono)"
            fill="var(--fg-muted)"
          >
            {tick}
          </text>
        </g>
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
        Mole fraction x<Sub>2</Sub>
      </text>

      {/* Airy unboxed inline legend */}
      <g transform="translate(0, 366)">
        <line
          x1={76}
          y1={0}
          x2={104}
          y2={0}
          stroke="var(--fg-muted)"
          strokeWidth={1.8}
          strokeDasharray="6 4"
        />
        <text
          x={112}
          y={5}
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          Ideal Raoult
        </text>

        <line
          x1={224}
          y1={0}
          x2={252}
          y2={0}
          stroke="var(--accent)"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <text
          x={260}
          y={5}
          fontSize={14}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          p<Sub>total</Sub>
        </text>

        <line
          x1={336}
          y1={0}
          x2={360}
          y2={0}
          stroke="var(--spot-2)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <text
          x={368}
          y={5}
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          p<Sub>1</Sub>
        </text>

        <line
          x1={418}
          y1={0}
          x2={442}
          y2={0}
          stroke="var(--spot-3)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <text
          x={450}
          y={5}
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          p<Sub>2</Sub>
        </text>
      </g>

      {/* Subtle hairline separator before intermolecular-forces strip */}
      <line
        x1={48}
        y1={390}
        x2={532}
        y2={390}
        stroke="var(--border)"
        strokeWidth={1}
        opacity={0.7}
      />

      {/* Living Intermolecular Forces Strip (borderless) */}
      <g>
        {/* Escaping vapour trails & arrows when positive deviation */}
        {escapeStrength > 0.04 && (
          <g opacity={escapeStrength}>
            {[-1, 1].map((side, idx) => {
              const cx = side < 0 ? molAX : molBX;
              const arrowLen = 16 + escapeStrength * 14;
              const phase = reducedMotion ? 0.45 : (t * 0.75 + idx * 0.5) % 1;
              const riseY = molY - 26 - phase * 26;
              const riseOpacity = Math.sin(phase * Math.PI) * 0.75;
              return (
                <g key={side}>
                  <line
                    x1={cx}
                    y1={molY - 24}
                    x2={cx}
                    y2={molY - 24 - arrowLen}
                    stroke="var(--heat)"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`${cx},${molY - 30 - arrowLen} ${cx - 5},${molY - 21 - arrowLen} ${cx + 5},${molY - 21 - arrowLen}`}
                    fill="var(--heat)"
                  />
                  <circle
                    cx={cx + (side < 0 ? -12 : 12)}
                    cy={riseY}
                    r={3.5}
                    fill={side < 0 ? 'var(--spot-2)' : 'var(--spot-3)'}
                    opacity={riseOpacity}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Negative deviation H-bond glow & pull indicator */}
        {hbondStrength > 0.04 && (
          <g opacity={hbondStrength}>
            <line
              x1={molAX + 20}
              y1={molY}
              x2={molBX - 20}
              y2={molY}
              stroke="var(--coolant)"
              strokeWidth={8}
              strokeOpacity={0.22 + (reducedMotion ? 0 : 0.1 * Math.sin(t * 3.5))}
              strokeLinecap="round"
            />
            <line
              x1={molAX + 20}
              y1={molY}
              x2={molBX - 20}
              y2={molY}
              stroke="var(--coolant)"
              strokeWidth={3.2}
              strokeDasharray="5 4"
            />
            <text
              x={molCenterX}
              y={molY - 27}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--coolant)"
            >
              H-bond pull
            </text>
          </g>
        )}

        {/* Ideal symmetric spring / weakened stretched link */}
        {hbondStrength <= 0.04 && (
          <path
            d={buildSpringPath(
              molAX + 21,
              molBX - 21,
              molY,
              isPositive ? 4 : 5,
              isPositive ? 3.2 : 5.5,
            )}
            fill="none"
            stroke={isPositive ? 'var(--heat)' : 'var(--accent)'}
            strokeWidth={isPositive ? 1.5 : 2.2}
            strokeDasharray={isPositive ? '3 4' : 'none'}
            opacity={isPositive ? 0.72 : 0.9}
          />
        )}

        {/* 3D Shaded Molecule A */}
        <circle cx={molAX} cy={molY} r={21} fill="var(--spot-2)" />
        <circle
          cx={molAX}
          cy={molY}
          r={21}
          fill="url(#raoult-dev-sphere-shading)"
          stroke="var(--atom-rim)"
          strokeWidth={1.3}
        />
        <text
          x={molAX}
          y={molY + 5}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill="var(--accent-fg)"
        >
          A
        </text>

        {/* 3D Shaded Molecule B */}
        <circle cx={molBX} cy={molY} r={21} fill="var(--spot-3)" />
        <circle
          cx={molBX}
          cy={molY}
          r={21}
          fill="url(#raoult-dev-sphere-shading)"
          stroke="var(--atom-rim)"
          strokeWidth={1.3}
        />
        <text
          x={molBX}
          y={molY + 5}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill="var(--accent-fg)"
        >
          B
        </text>

        {/* Right editorial readout next to molecules (no box!) */}
        <text
          x={292}
          y={426}
          fontSize={15}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill={devColor}
        >
          {current.forceRelation}
        </text>
        <text
          x={292}
          y={452}
          fontSize={14.5}
          fontWeight={600}
          fontFamily="var(--font-mono)"
          fill="var(--fg)"
        >
          {renderThermoLine(current.id)}
        </text>
        <text
          x={292}
          y={476}
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {renderMechanismCue(current.id)}
        </text>
      </g>

      {/* Understated single-line working equation at bottom */}
      <text
        x={VIEW_W / 2}
        y={518}
        textAnchor="middle"
        fontSize={14.5}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        {renderBottomEquation(current.id)}
      </text>
    </svg>
  );
}
