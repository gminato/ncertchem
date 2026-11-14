'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Segmented, Slider } from '@/components/controls'
import { AtomSizeRow } from '@/components/periodic/AtomSizeRow'
import { radiusToPx } from '@/components/periodic/atom-size'
import { Electron, Label } from '@/components/vocab'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { ELECTRON_COUNTS, protonRange, protonToElectronRatio, speciesFor, type ElectronCount, type IsoSpecies } from './isoelectronic-model'
import styles from './isoelectronic.module.css'

const ROW_WIDTH = 600
const ROW_MAX_PX = 56
const FOCUS_WIDTH = 600
const FOCUS_HEIGHT = 256
const FOCUS = { cx: 300, cy: 112 }
const FOCUS_MAX_PX = 84
/** Cloud size for a series with no tabulated radius. It is not to scale, and the readout says so. */
const FOCUS_UNSCALED_PX = 52
const MORPH_SECONDS = 0.9

const COUNT_OPTIONS = ELECTRON_COUNTS.map((n) => ({ value: String(n), label: String(n) }))

/** Golden-angle packing so the protons fill the nucleus evenly, from the centre outwards. */
function protonPositions(Z: number, nucleusPx: number): { x: number; y: number }[] {
  const GOLDEN = 2.399963
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < Z; i++) {
    const r = (nucleusPx * 0.72 * Math.sqrt((i + 0.5) / Z))
    pts.push({ x: FOCUS.cx + r * Math.cos(i * GOLDEN), y: FOCUS.cy + r * Math.sin(i * GOLDEN) })
  }
  return pts
}

/** Electron positions on the cloud, spread on one ring with a deterministic wobble. */
function electronPositions(count: number, cloudPx: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const wobble = 0.82 + 0.18 * (((i * 7) % 5) / 4)
    const r = cloudPx * wobble
    return { x: FOCUS.cx + r * Math.cos(angle), y: FOCUS.cy + r * Math.sin(angle) }
  })
}

function readoutLine(s: IsoSpecies, ratio: number): string {
  let radius: string
  if (s.radius.pm !== null) {
    radius = `radius ${s.radius.pm} pm, ${s.radius.citation}`
  } else if (s.radius.source === 'noble-gas') {
    radius = s.drawnPm === null
      ? 'a noble gas with no ionic radius here, so no size is drawn'
      : 'a noble gas with no ionic radius here, drawn between its neighbours (not a measured radius)'
  } else {
    radius = s.drawnPm === null
      ? 'no radius tabulated here, so no size is drawn'
      : 'no tabulated radius, drawn between its neighbours (not a measured radius)'
  }
  return `${s.label}: Z = ${s.Z} protons, ${s.electrons} electrons, ${radius}. Z over electrons = ${ratio.toFixed(2)}.`
}

/**
 * The isoelectronic Simulation. Pick an electron count and one species is drawn at Z protons,
 * with its electrons as a cloud. Adding a proton moves to the next species, and the radius
 * tweens from the old size to the new one.
 */
export function Isoelectronic({ reducedMotion }: SimulationProps) {
  const [electrons, setElectrons] = useState<ElectronCount>(10)
  const [Z, setZ] = useState(9)
  const list = useMemo(() => speciesFor(electrons), [electrons])
  const range = protonRange(electrons)
  const safeZ = Math.min(range.max, Math.max(range.min, Z))
  const current = list.find((s) => s.Z === safeZ) ?? list[0]
  const drawable = list.filter((s): s is IsoSpecies & { drawnPm: number } => s.drawnPm !== null)
  const maxPm = drawable.length > 0 ? Math.max(...drawable.map((s) => s.drawnPm)) : 1
  // Species with no drawn size keep the last tweened size, so the cloud does not jump.
  const target = current.drawnPm

  // The radius tweens from its last value to the new target. Reduced motion cuts straight to it.
  const [tweenedPm, setDrawnPm] = useState(target ?? maxPm)
  const drawnPm: number | null = target === null ? null : reducedMotion ? target : tweenedPm
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  useEffect(() => {
    tweenRef.current?.kill()
    if (reducedMotion || target === null) return
    const obj = { v: tweenedPm }
    tweenRef.current = gsap.to(obj, {
      v: target,
      duration: MORPH_SECONDS,
      ease: 'power2.out',
      onUpdate: () => setDrawnPm(obj.v),
    })
    return () => {
      tweenRef.current?.kill()
    }
    // tweenedPm is read once at the start of each tween; the tween owns it from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reducedMotion])

  const focusCloudPx = drawnPm === null ? FOCUS_UNSCALED_PX : radiusToPx(drawnPm, maxPm, FOCUS_MAX_PX)
  const nucleusPx = 22
  const protons = protonPositions(current.Z, nucleusPx)
  const electronsXY = electronPositions(current.electrons, focusCloudPx)
  const ratio = protonToElectronRatio(current.Z, current.electrons)

  const changeCount = (value: string) => {
    const next = Number(value) as ElectronCount
    setElectrons(next)
    const r = protonRange(next)
    setZ(Math.min(r.max, Math.max(r.min, Math.round((r.min + r.max) / 2))))
  }

  return (
    <div className={styles.sim} data-testid="isoelectronic" data-electrons={electrons} data-z={current.Z}>
      {drawable.length > 0 ? (
        <div className={styles.rowWrap}>
          <AtomSizeRow
            items={drawable.map((s) => ({
              label: s.symbol,
              radiusPm: s.drawnPm,
              charge: s.charge === 0 ? undefined : `${Math.abs(s.charge) > 1 ? Math.abs(s.charge) : ''}${s.charge > 0 ? '+' : '−'}`,
            }))}
            title={`Isoelectronic species with ${electrons} electrons, sized by radius`}
            width={ROW_WIDTH}
            maxRadiusPx={ROW_MAX_PX}
            labelPlacement="beneath"
          />
          <div className={styles.columns} aria-hidden="true" style={{ gridTemplateColumns: `repeat(${drawable.length}, 1fr)` }}>
            {drawable.map((s) => (
              <span key={s.Z} className={s.Z === current.Z ? styles.colOn : styles.colOff}>
                {s.Z === current.Z ? '▲' : ''}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.note}>
          No radius is tabulated here for the {electrons}-electron series yet. The protons, electrons and Z over electrons still apply.
        </p>
      )}

      <svg
        viewBox={`0 0 ${FOCUS_WIDTH} ${FOCUS_HEIGHT}`}
        className={styles.focus}
        role="img"
        aria-label={`${current.label}: ${current.Z} protons in the nucleus and ${current.electrons} electrons in the cloud`}
      >
        <circle cx={FOCUS.cx} cy={FOCUS.cy} r={focusCloudPx} className={styles.cloud} />
        <circle cx={FOCUS.cx} cy={FOCUS.cy} r={nucleusPx} className={styles.nucleus} />
        {protons.map((p, i) => (
          <circle key={`p-${i}`} cx={p.x} cy={p.y} r={3.2} className={styles.proton} />
        ))}
        {electronsXY.map((p, i) => (
          <Electron key={`e-${i}`} x={p.x} y={p.y} size={8} defsPrefix="iso" />
        ))}
        <Label x={FOCUS.cx} y={FOCUS_HEIGHT - 36} fontSize={18} halo fill="var(--fg)">
          {current.label}
        </Label>
        <Label x={FOCUS.cx} y={FOCUS_HEIGHT - 14} fontSize={15} halo fill="var(--fg-muted)">
          <tspan className="sym">Z</tspan> = {current.Z} protons, {current.electrons} electrons
        </Label>
      </svg>

      <p className={styles.readout} role="status" aria-live="polite">
        {readoutLine(current, ratio)}
      </p>
      <p className={styles.source}>
        Radii: NCERT Table 3.6 and 3.7.1(b) text, the NCERT radii table, and Shannon (1976, CN 6) for O²⁻.
      </p>

      <SimulationControls>
        <Segmented
          label="Electron count"
          value={String(electrons)}
          options={COUNT_OPTIONS}
          onChange={changeCount}
        />
        <Slider
          label="Add a proton: nuclear charge Z"
          value={safeZ}
          min={range.min}
          max={range.max}
          step={1}
          onChange={(v) => setZ(v)}
          format={(v) => {
            const s = list.find((x) => x.Z === v)
            return s ? `${s.label}, Z = ${v}` : `Z = ${v}`
          }}
        />
      </SimulationControls>
    </div>
  )
}
