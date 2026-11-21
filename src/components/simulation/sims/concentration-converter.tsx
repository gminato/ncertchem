'use client';

import { Fragment, useId, useMemo, useState, type ReactNode } from 'react';
import { Segmented, Slider } from '@/components/controls';
import { Vessel, VocabDefs } from '@/components/vocab';
import { Thermometer } from '@/components/vocab/Thermometer';
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg';
import type { SimulationProps } from '@/components/simulation/registry';
import {
  CONVERTER_PRESET_IDS,
  REFERENCE_TEMP_C,
  SOLUTE_PRESETS,
  type SolutePresetId,
  convertAllMeasures,
  estimateAqueousDensity25,
} from '@/lib/chem/concentration-units';
import styles from './concentration-converter.module.css';

const FONT = 'var(--font-sans)';
const MONO = 'var(--font-mono)';

const PRESET_OPTIONS = CONVERTER_PRESET_IDS.map((id) => ({
  value: id,
  label: id === 'naoh' ? 'NaOH' : SOLUTE_PRESETS[id].name,
}));

const SUB_MAP: Record<string, string> = {
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

function renderFormulaSvg(formula: string): ReactNode {
  const parts = formula.split(/([₀-₉]+|\d+)/g);
  if (parts.length === 1) return formula;
  return parts.map((part, idx) => {
    if (/^[₀-₉]+$/.test(part)) {
      return (
        <Sub key={idx}>
          {part
            .split('')
            .map((c) => SUB_MAP[c] ?? c)
            .join('')}
        </Sub>
      );
    }
    if (/^\d+$/.test(part)) {
      return <Sub key={idx}>{part}</Sub>;
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

// Relative offsets inside the conical bulb of Vessel(variant="flask", width=128, height=182)
const FLASK_SOLUTE_REL: readonly [number, number][] = [
  [0, 34],
  [-20, 44],
  [20, 44],
  [-10, 22],
  [12, 22],
  [-30, 60],
  [30, 60],
  [0, 58],
  [-16, 36],
  [16, 36],
  [-38, 72],
  [38, 72],
  [-12, 74],
  [12, 74],
  [0, 12],
  [-24, 76],
  [24, 76],
  [-18, 56],
  [18, 56],
  [0, 46],
];

function formatPpm(ppm: number): string {
  if (ppm >= 1000) {
    return `${Math.round(ppm).toLocaleString('en-US')} ppm`;
  }
  return `${ppm.toFixed(1)} ppm`;
}

function LockGlyph({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M -3 -1.8 L -3 -4.4 A 3 3 0 0 1 3 -4.4 L 3 -1.8"
        fill="none"
        stroke="var(--success)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <rect
        x={-4.8}
        y={-1.8}
        width={9.6}
        height={7.4}
        rx={1.8}
        fill="var(--success-soft)"
        stroke="var(--success)"
        strokeWidth={1.4}
      />
    </g>
  );
}

export function ConcentrationConverter({ reducedMotion }: SimulationProps) {
  const [presetId, setPresetId] = useState<SolutePresetId>('urea');
  const [soluteMassG, setSoluteMassG] = useState<number>(
    SOLUTE_PRESETS.urea.defaultSoluteMassG,
  );
  const [solventMassG, setSolventMassG] = useState<number>(
    SOLUTE_PRESETS.urea.defaultSolventMassG,
  );
  const [tempC, setTempC] = useState<number>(REFERENCE_TEMP_C);

  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const shadeUrl = `url(#${uid}-sphere-shading)`;
  const t = useAmbientTime(reducedMotion);

  const preset = SOLUTE_PRESETS[presetId];

  const handlePresetChange = (nextId: SolutePresetId) => {
    setPresetId(nextId);
    const next = SOLUTE_PRESETS[nextId];
    setSoluteMassG(next.defaultSoluteMassG);
    setSolventMassG(next.defaultSolventMassG);
  };

  const measures = useMemo(() => {
    const density25 = estimateAqueousDensity25(
      soluteMassG,
      solventMassG,
      preset.apparentDensityGPerMl,
    );
    return convertAllMeasures({
      soluteMassG,
      solventMassG,
      soluteMolarMass: preset.molarMassGPerMol,
      densityGPerMl: density25,
      tempC,
    });
  }, [preset, soluteMassG, solventMassG, tempC]);

  // Flask geometry (centered at x=140, y=174, width=128, height=182)
  const flaskX = 140;
  const flaskY = 174;
  const flaskW = 128;
  const flaskH = 182;
  const refLevel = 0.68;
  const flaskLevel = Math.min(
    0.9,
    Math.max(0.54, refLevel + ((tempC - REFERENCE_TEMP_C) / 60) * 0.14),
  );
  const refTickY = flaskY + flaskH / 2 - refLevel * flaskH;
  const liveMeniscusY = flaskY + flaskH / 2 - flaskLevel * flaskH;
  const thermLevel = 0.14 + ((tempC - 5) / 80) * 0.78;

  const visibleDotCount = Math.max(
    2,
    Math.min(FLASK_SOLUTE_REL.length, Math.round((measures.massPercent / 40) * 20)),
  );

  // Bar scaling (molality & molarity share a temperature-invariant upper bound so dragging T moves ONLY Molarity)
  const barX = 250;
  const trackWidth = 310;
  const massPctBar = Math.max(4, Math.min(1, measures.massPercent / 50) * trackWidth);
  const moleFracBar = Math.max(
    4,
    Math.min(1, measures.moleFractionSolute / 0.35) * trackWidth,
  );
  const sharedMScale = Math.max(
    4,
    Math.ceil(Math.max(measures.molality, measures.molarityAt25) * 1.18),
  );
  const molalityBar = Math.max(
    4,
    Math.min(1, measures.molality / sharedMScale) * trackWidth,
  );
  const molarityRefBar = Math.max(
    4,
    Math.min(1, measures.molarityAt25 / sharedMScale) * trackWidth,
  );
  // Amplify visual delta slightly around the reference tick while displaying exact numerical M(T)
  const rawDeltaRatio = (measures.molarity - measures.molarityAt25) / sharedMScale;
  const molarityBar = Math.max(
    4,
    Math.min(trackWidth, molarityRefBar + rawDeltaRatio * trackWidth * 4),
  );

  const deltaM = measures.molarity - measures.molarityAt25;
  const deltaVPct = (measures.expansionFactor - 1) * 100;
  const deltaVLabel =
    Math.abs(deltaVPct) < 0.005
      ? 'At 25 °C reference'
      : `${deltaVPct > 0 ? '+' : ''}${deltaVPct.toFixed(2)}% vs 25 °C`;

  const deltaMLabel =
    Math.abs(deltaM) < 0.0005
      ? '0.000 vs 25 °C'
      : `${deltaM > 0 ? '+' : ''}${deltaM.toFixed(3)} vs 25 °C`;

  const transitionStyle = reducedMotion
    ? undefined
    : { transition: 'all 180ms ease-out' };

  const tempColor =
    tempC > REFERENCE_TEMP_C
      ? 'var(--flame)'
      : tempC < REFERENCE_TEMP_C
        ? 'var(--accent)'
        : 'var(--fg-muted)';

  const thermalSentence =
    tempC === REFERENCE_TEMP_C
      ? `At the 25 °C reference temperature, this solution occupies ${measures.volumeAt25Ml.toFixed(1)} mL. Drag the Temperature slider above or below 25 °C to watch thermal expansion or contraction shift its volume without adding or removing a single molecule.`
      : tempC > REFERENCE_TEMP_C
        ? `Warming the solution from 25 °C to ${tempC} °C expands its volume from ${measures.volumeAt25Ml.toFixed(1)} mL to ${measures.volumeAtTempMl.toFixed(1)} mL without adding or removing a single molecule.`
        : `Cooling the solution from 25 °C to ${tempC} °C contracts its volume from ${measures.volumeAt25Ml.toFixed(1)} mL to ${measures.volumeAtTempMl.toFixed(1)} mL without adding or removing a single molecule.`;

  const liveSummary = `${preset.name} solution: ${soluteMassG} g solute in ${solventMassG} g water at ${tempC} degrees Celsius. Mass percent ${measures.massPercent.toFixed(2)} percent, mole fraction ${measures.moleFractionSolute.toFixed(4)}, molality ${measures.molality.toFixed(3)} moles per kilogram (temperature independent), molarity ${measures.molarity.toFixed(3)} moles per litre (temperature dependent).`;

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Solute</span>
          <Segmented<SolutePresetId>
            label="Solute"
            options={PRESET_OPTIONS}
            value={presetId}
            onChange={handlePresetChange}
          />
        </div>
        <div className={styles.sliderGrid}>
          <Slider
            label="Solute mass"
            value={soluteMassG}
            min={1}
            max={100}
            step={1}
            unit="g"
            onChange={setSoluteMassG}
          />
          <Slider
            label="Water mass"
            value={solventMassG}
            min={100}
            max={500}
            step={10}
            unit="g"
            onChange={setSolventMassG}
          />
          <Slider
            label="Temperature"
            value={tempC}
            min={5}
            max={85}
            step={1}
            unit="°C"
            onChange={setTempC}
          />
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          viewBox="0 0 580 356"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`Interactive flask of aqueous ${preset.name} at ${tempC} degrees Celsius alongside live concentration bars for mass percent, mole fraction, molality, and molarity.`}
        >
          <VocabDefs idPrefix={uid} />

          {/* Left apparatus (borderless): Solute header + Thermometer + Volumetric Flask */}
          <text
            x={116}
            y={26}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14.5}
            fontWeight={700}
            fill="var(--fg)"
          >
            {preset.name} ({renderFormulaSvg(preset.formula)})
          </text>

          <text
            x={36}
            y={64}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={13.5}
            fontWeight={700}
            fill={tempColor}
          >
            {tempC} °C
          </text>
          <Thermometer
            x={36}
            y={244}
            height={162}
            bulbRadius={12}
            stemWidth={8}
            level={thermLevel}
            ticks={[0.25, 0.5, 0.75]}
          />

          <Vessel
            variant="flask"
            x={flaskX}
            y={flaskY}
            width={flaskW}
            height={flaskH}
            level={flaskLevel}
            liquid
          />

          {/* 25 °C calibration tick on flask neck */}
          <line
            x1={flaskX - 26}
            y1={refTickY}
            x2={flaskX + 26}
            y2={refTickY}
            stroke="var(--fg-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <text
            x={flaskX + 32}
            y={refTickY + 4}
            fontFamily={MONO}
            fontSize={13}
            fill="var(--fg-muted)"
          >
            25 °C
          </text>

          {/* Live meniscus highlight */}
          <line
            x1={flaskX - 18}
            y1={liveMeniscusY}
            x2={flaskX + 18}
            y2={liveMeniscusY}
            stroke={tempC === REFERENCE_TEMP_C ? 'var(--liquid-edge)' : tempColor}
            strokeWidth={2.4}
            style={transitionStyle}
          />

          {/* 3D-shaded solute particles drifting inside flask bulb */}
          {FLASK_SOLUTE_REL.slice(0, visibleDotCount).map(([rx, ry], i) => {
            const speed = 1.0 + ((tempC - 5) / 80) * 1.8;
            const dx = Math.sin(t * speed + i * 1.3) * 2.2;
            const dy = Math.cos(t * speed * 0.9 + i * 1.6) * 1.8;
            return (
              <g key={i}>
                <circle
                  cx={flaskX + rx + dx}
                  cy={flaskY + ry + dy}
                  r={4.4}
                  fill="var(--spot-1)"
                  stroke="var(--atom-rim)"
                  strokeWidth={0.8}
                />
                <circle
                  cx={flaskX + rx + dx}
                  cy={flaskY + ry + dy}
                  r={4.4}
                  fill={shadeUrl}
                />
              </g>
            );
          })}

          {/* Volume & density summary directly below flask */}
          <text
            x={116}
            y={294}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--fg)"
          >
            V = {measures.volumeAtTempMl.toFixed(1)} mL
          </text>
          <text
            x={116}
            y={316}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={13}
            fill="var(--fg-muted)"
          >
            ρ = {measures.densityAtTempGPerMl.toFixed(4)} g mL<Sup>−1</Sup>
          </text>
          <text
            x={116}
            y={338}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={13}
            fontWeight={600}
            fill={tempColor}
          >
            {deltaVLabel}
          </text>

          {/* Subtle vertical divider between apparatus and live scales */}
          <line
            x1={232}
            y1={16}
            x2={232}
            y2={342}
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Right side: clean stacked header (zero overlap) + borderless horizontal bars */}
          <text
            x={barX}
            y={26}
            fontFamily={FONT}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            Live Concentration Scales
          </text>
          <text
            x={barX}
            y={46}
            fontFamily={FONT}
            fontSize={13}
            fill="var(--fg-muted)"
          >
            Drag Temperature to test invariance
          </text>

          {/* Bar 1: Mass % (w/w) */}
          <LockGlyph x={barX + 5} y={73} />
          <text
            x={barX + 18}
            y={77}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--fg)"
          >
            Mass % (w/w)
          </text>
          <text
            x={barX + trackWidth}
            y={77}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--success)"
          >
            {measures.massPercent.toFixed(2)}%
          </text>
          <rect x={barX} y={89} width={trackWidth} height={13} rx={6.5} fill="var(--success-soft)" />
          <rect
            x={barX}
            y={89}
            width={massPctBar}
            height={13}
            rx={6.5}
            fill="var(--success)"
            style={transitionStyle}
          />

          <line x1={barX} y1={118} x2={barX + trackWidth} y2={118} stroke="var(--border)" strokeWidth={1} />

          {/* Bar 2: Mole Fraction (x2) */}
          <LockGlyph x={barX + 5} y={138} />
          <text
            x={barX + 18}
            y={142}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--fg)"
          >
            Mole fraction (x<Sub>2</Sub>)
          </text>
          <text
            x={barX + trackWidth}
            y={142}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--success)"
          >
            {measures.moleFractionSolute.toFixed(4)}
          </text>
          <rect x={barX} y={154} width={trackWidth} height={13} rx={6.5} fill="var(--success-soft)" />
          <rect
            x={barX}
            y={154}
            width={moleFracBar}
            height={13}
            rx={6.5}
            fill="var(--success)"
            style={transitionStyle}
          />

          <line x1={barX} y1={183} x2={barX + trackWidth} y2={183} stroke="var(--border)" strokeWidth={1} />

          {/* Bar 3: Molality (m) */}
          <LockGlyph x={barX + 5} y={203} />
          <text
            x={barX + 18}
            y={207}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--fg)"
          >
            Molality (m) · T-invariant
          </text>
          <text
            x={barX + trackWidth}
            y={207}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--success)"
          >
            {measures.molality.toFixed(3)} m
          </text>
          <rect x={barX} y={219} width={trackWidth} height={13} rx={6.5} fill="var(--success-soft)" />
          <rect
            x={barX}
            y={219}
            width={molalityBar}
            height={13}
            rx={6.5}
            fill="var(--success)"
            style={transitionStyle}
          />

          <line x1={barX} y1={248} x2={barX + trackWidth} y2={248} stroke="var(--border)" strokeWidth={1} />

          {/* Bar 4: Molarity (M) — Temperature-dependent */}
          <text
            x={barX}
            y={273}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--fg)"
          >
            Molarity (M) · depends on V(T)
          </text>
          <text
            x={barX + trackWidth}
            y={273}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--caution)"
          >
            {measures.molarity.toFixed(3)} M
          </text>
          <rect x={barX} y={286} width={trackWidth} height={14} rx={7} fill="var(--caution-soft)" />
          <rect
            x={barX}
            y={286}
            width={molarityBar}
            height={14}
            rx={7}
            fill="var(--caution)"
            style={transitionStyle}
          />
          {/* Reference 25 °C notch on Molarity bar */}
          <line
            x1={barX + molarityRefBar}
            y1={282}
            x2={barX + molarityRefBar}
            y2={304}
            stroke="var(--fg)"
            strokeWidth={2}
          />
          <text
            x={barX}
            y={324}
            fontFamily={FONT}
            fontSize={13}
            fill="var(--fg-muted)"
          >
            Notch = 25 °C value
          </text>
          <text
            x={barX + trackWidth}
            y={324}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={13}
            fontWeight={600}
            fill="var(--caution)"
          >
            {deltaMLabel}
          </text>
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.metricGrid}>
          <div className={`${styles.metricCard} ${styles.metricInvariant}`}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Mass % (w/w)</span>
              <span className={styles.badgeInvariant}>T-fixed</span>
            </div>
            <span className={styles.metricValue}>
              {measures.massPercent.toFixed(2)}%
            </span>
            <span className={styles.metricSub}>
              {soluteMassG} g / {measures.solutionMassG} g soln
            </span>
          </div>

          <div className={`${styles.metricCard} ${styles.metricTempDependent}`}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Mass / Vol (w/V)</span>
              <span className={styles.badgeTemp}>V(T)</span>
            </div>
            <span className={styles.metricValue}>
              {measures.massByVolumePercent.toFixed(2)}%
            </span>
            <span className={styles.metricSub}>
              g solute per 100 mL at {tempC} °C
            </span>
          </div>

          <div className={`${styles.metricCard} ${styles.metricInvariant}`}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Parts per million</span>
              <span className={styles.badgeInvariant}>T-fixed</span>
            </div>
            <span className={styles.metricValue}>{formatPpm(measures.ppm)}</span>
            <span className={styles.metricSub}>
              Mass-based (× 10<sup>6</sup>)
            </span>
          </div>

          <div className={`${styles.metricCard} ${styles.metricInvariant}`}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>
                Mole fraction (x<sub>2</sub>)
              </span>
              <span className={styles.badgeInvariant}>T-fixed</span>
            </div>
            <span className={styles.metricValue}>
              {measures.moleFractionSolute.toFixed(4)}
            </span>
            <span className={styles.metricSub}>
              x<sub>1</sub> (water) = {measures.moleFractionSolvent.toFixed(4)}
            </span>
          </div>

          <div className={`${styles.metricCard} ${styles.metricInvariant}`}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Molality (m)</span>
              <span className={styles.badgeInvariant}>T-fixed</span>
            </div>
            <span className={styles.metricValue}>
              {measures.molality.toFixed(3)} mol kg<sup>−1</sup>
            </span>
            <span className={styles.metricSub}>
              {measures.soluteMoles.toFixed(3)} mol / {(solventMassG / 1000).toFixed(2)} kg water
            </span>
          </div>

          <div className={`${styles.metricCard} ${styles.metricTempDependent}`}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Molarity (M)</span>
              <span className={styles.badgeTemp}>V(T)</span>
            </div>
            <span className={styles.metricValue}>
              {measures.molarity.toFixed(3)} mol L<sup>−1</sup>
            </span>
            <span className={styles.metricSub}>
              Ref 25 °C: {measures.molarityAt25.toFixed(3)} M ({deltaMLabel})
            </span>
          </div>
        </div>

        <p className={styles.explanation}>
          <strong>Why does molarity drift with temperature?</strong> {thermalSentence}{' '}
          Because <strong>molarity</strong> and <strong>w/V %</strong> divide by
          solution volume, they shift whenever temperature changes. By contrast,{' '}
          <strong>mass %</strong>, <strong>ppm</strong>,{' '}
          <strong>mole fraction</strong>, and <strong>molality</strong> rely purely
          on masses and mole counts, so they remain completely unaffected by
          temperature.
        </p>

        <p className={styles.srOnly} aria-live="polite">
          {liveSummary}
        </p>
      </div>
    </div>
  );
}
