'use client'

import { useState } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { MagnetBalance } from '@/components/vocab/dblock'
import { CoordinationGeometry } from '@/components/animations/c12-unit5/vbt/CoordinationGeometry'
import { VbtOrbitalDiagram, computeBoxPositions } from '@/components/animations/c12-unit5/vbt/VbtOrbitalDiagram'
import {
  DEFAULT_PRESET_ID,
  VBT_PRESETS,
  computeVbtState,
  toSuperscript,
  vbtLiveSummary,
  type CoordinationNumber,
  type SpinChoice,
} from './vbt-orbital-lab-model'
import styles from './vbt-orbital-lab.module.css'

const PRESET_MAP = new Map(VBT_PRESETS.map((p) => [p.id, p]))
const ORB_W = 600
const ORB_H = 196
const BOX_SIZE = 34
const GEO_W = 600
const GEO_H = 278

export function VbtOrbitalLab() {
  const initialPreset = PRESET_MAP.get(DEFAULT_PRESET_ID) ?? VBT_PRESETS[0]
  const [presetId, setPresetId] = useState<string>(initialPreset.id)
  const [dCount, setDCount] = useState<number>(initialPreset.d)
  const [cn, setCn] = useState<CoordinationNumber>(initialPreset.cn)
  const [spin, setSpin] = useState<SpinChoice>(initialPreset.spin)

  const activePreset = presetId === 'custom' ? null : (PRESET_MAP.get(presetId) ?? null)
  const state = computeVbtState({ d: dCount, cn, spin, preset: activePreset })

  const handlePresetChange = (id: string) => {
    setPresetId(id)
    const picked = PRESET_MAP.get(id)
    if (picked) {
      setDCount(picked.d)
      setCn(picked.cn)
      setSpin(picked.spin)
    }
  }

  const handleDChange = (nextD: number) => {
    setPresetId('custom')
    setDCount(nextD)
  }

  const handleCnChange = (nextCnStr: string) => {
    setPresetId('custom')
    setCn(nextCnStr === '4' ? 4 : 6)
  }

  const handleSpinChange = (nextSpin: SpinChoice) => {
    if (state.spinLocked) return
    setPresetId('custom')
    setSpin(nextSpin)
  }

  const { totalWidth } = computeBoxPositions(true, BOX_SIZE)
  const orbX = Math.round((ORB_W - totalWidth) / 2)

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>NCERT complex preset</span>
          <select
            className={styles.select}
            value={presetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            aria-label="NCERT complex preset"
          >
            {VBT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {`${p.formula} (${p.metalIon}, 3d${toSuperscript(p.d)})`}
              </option>
            ))}
            <option value="custom">Custom metal ion</option>
          </select>
        </label>

        <div className={styles.field}>
          <Slider
            label="Metal d electrons"
            value={dCount}
            min={1}
            max={10}
            step={1}
            onChange={handleDChange}
            format={(v) => `3d${toSuperscript(v)}`}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Coordination number</span>
          <Segmented
            label="Coordination number"
            value={String(cn)}
            onChange={handleCnChange}
            options={[
              { value: '6', label: 'CN 6 (Octahedral)' },
              { value: '4', label: 'CN 4 (4-coord)' },
            ]}
          />
        </div>

        <div
          className={styles.field}
          aria-disabled={state.spinLocked}
        >
          <span className={styles.fieldLabel}>
            {cn === 6 ? 'Orbital / spin path' : 'Hybridisation path'}
            {state.spinLocked ? ' (locked)' : ''}
          </span>
          <div className={state.spinLocked ? styles.segmentedLocked : undefined}>
            <Segmented
              label="Orbital and spin path"
              value={state.effectiveSpin}
              onChange={handleSpinChange}
              options={
                cn === 6
                  ? [
                      { value: 'low', label: 'Inner / Low spin' },
                      { value: 'high', label: 'Outer / High spin' },
                    ]
                  : [
                      { value: 'low', label: 'dsp² (Sq. planar)' },
                      { value: 'high', label: 'sp³ (Tetrahedral)' },
                    ]
              }
            />
          </div>
        </div>
      </div>

      {state.lockReason && <p className={styles.lockedNote}>{state.lockReason}</p>}

      <div className={styles.stage}>
        {/* Top SVG: Live 3d / 4s / 4p / 4d orbital box diagram */}
        <svg
          viewBox={`0 0 ${ORB_W} ${ORB_H}`}
          className={styles.scene}
          role="img"
          aria-label={`Valence orbital boxes for ${state.formula}: ${state.hybridisation} hybridisation with ${state.unpaired} unpaired electrons`}
        >
          <text
            x={16}
            y={24}
            style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 19, fontWeight: 700 }}
          >
            {activePreset ? `${state.formula}  (${state.metalLabel})` : `${state.formula}  (3d${toSuperscript(state.d)})`}
          </text>
          <text
            x={ORB_W - 16}
            y={24}
            textAnchor="end"
            style={{ fill: 'var(--orbital-pos)', fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600 }}
          >
            {state.hybridisation}
          </text>

          <VbtOrbitalDiagram
            boxes={state.boxes}
            show4d={true}
            bracket={state.bracket}
            x={orbX}
            y={74}
            boxSize={BOX_SIZE}
            fontSize={16}
          />

          {/* Compact legend at bottom */}
          <line x1={18} x2={18} y1={170} y2={184} style={{ stroke: 'var(--electron)', strokeWidth: 2.2, strokeLinecap: 'round' }} />
          <path d="M14,174 L18,170 L22,174" fill="none" style={{ stroke: 'var(--electron)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
          <text x={30} y={182} style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 15 }}>
            Metal 3d electrons
          </text>

          <line x1={214} x2={214} y1={170} y2={184} style={{ stroke: 'var(--orbital-pos)', strokeWidth: 2.2, strokeLinecap: 'round' }} />
          <path d="M210,174 L214,170 L218,174" fill="none" style={{ stroke: 'var(--orbital-pos)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
          <line x1={223} x2={223} y1={170} y2={184} style={{ stroke: 'var(--orbital-pos)', strokeWidth: 2.2, strokeLinecap: 'round' }} />
          <path d="M219,180 L223,184 L227,180" fill="none" style={{ stroke: 'var(--orbital-pos)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
          <text x={236} y={182} style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 15 }}>
            Donated ligand pairs
          </text>
        </svg>

        {/* Bottom SVG: Geometry sketch on left + Schematic magnetic balance on right */}
        <svg
          viewBox={`0 0 ${GEO_W} ${GEO_H}`}
          className={styles.scene}
          role="img"
          aria-label={`${state.geometryLabel} geometry and schematic magnetic balance showing ${state.magnetism.toLowerCase()} response for ${state.formula}`}
        >
          <text
            x={152}
            y={24}
            textAnchor="middle"
            style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600 }}
          >
            {`${state.geometryLabel} geometry`}
          </text>
          <CoordinationGeometry
            geometry={state.geometry}
            metalLabel={state.metalLabel}
            ligandLabel={state.ligandLabel}
            cx={152}
            cy={142}
            radius={78}
            fontSize={16}
          />
          <text
            x={152}
            y={258}
            textAnchor="middle"
            style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)', fontSize: 15 }}
          >
            {state.orbitalTypeLabel}
          </text>

          <line x1={304} x2={304} y1={16} y2={264} style={{ stroke: 'var(--border)', strokeWidth: 1.5 }} />

          <g transform="translate(312, 6)">
            <MagnetBalance pull={state.balancePull} schematic />
          </g>
        </svg>
      </div>

      <div className={styles.results}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Hybridisation</span>
          <span className={styles.statValue}>{state.hybridisation}</span>
          <span className={styles.statSub}>{state.geometryLabel}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Orbital type</span>
          <span className={styles.statValue}>
            {cn === 6 ? (state.effectiveSpin === 'low' ? 'Inner orbital' : 'Outer orbital') : state.geometryLabel}
          </span>
          <span className={styles.statSub}>{state.orbitalTypeLabel}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Unpaired electrons (n)</span>
          <span className={styles.statValue}>{state.unpaired}</span>
          <span className={styles.statSub}>{`3d${toSuperscript(state.d)} metal centre`}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Spin-only magnetic moment</span>
          <span className={styles.statValue}>{`${state.muText} BM`}</span>
          <span className={styles.statSub}>{state.magnetism}</span>
        </div>
      </div>

      <p className={styles.note}>{state.note}</p>

      <p className={styles.srOnly} aria-live="polite">
        {vbtLiveSummary(state)}
      </p>
    </div>
  )
}
