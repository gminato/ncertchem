'use client'

import React, { useId } from 'react'
import { BondCleavage, CurvedArrow } from '@/components/organic'
import { Molecule3D, Molecule3DFallback, cameraForMolecule } from '@/components/molecule'
import { Stage3DLazy } from '@/components/stage3d'
import { radicalStep, TERMINATIONS } from './radical-chain-steps'
import { pentaneModels, type PentaneModel } from './pentane-shapes'
import styles from './RadicalChain.module.css'

export interface RadicalChainProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const FONT = 'var(--font-sans)'
const MODELS = pentaneModels()

/** The shared fade-in class, dropped under reduced motion so the Step is shown at once. */
const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={40} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ lines }: { lines: readonly string[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text key={i} x={VIEW_WIDTH / 2} y={392 + i * 26} textAnchor="middle" fontSize={17} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </g>
  )
}

/** Step 1: light splits Cl–Cl, and each chlorine atom leaves with one electron (two fishhooks). */
function InitiationDrawing() {
  return (
    <g>
      <g transform={`translate(${VIEW_WIDTH / 2} 200) scale(1.4)`}>
        <BondCleavage kind="homolytic" left="Cl" right="Cl" />
      </g>
      <text x={VIEW_WIDTH / 2} y={322} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        light (hν) breaks the bond
      </text>
    </g>
  )
}

/** Step 2: Cl• takes a hydrogen from CH₄ (a fishhook for each single electron), leaving •CH₃ and HCl. */
function PropagationDrawing({ marker }: { marker: string }) {
  const label = (x: number, y: number, text: React.ReactNode, anchor: 'start' | 'middle' | 'end' = 'middle') => (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={26} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {text}
    </text>
  )
  return (
    <g transform={`translate(${VIEW_WIDTH / 2} 178) scale(1.3)`}>
      {label(-150, -4, <>Cl<tspan baselineShift="super" fontSize={18}>•</tspan></>)}
      <CurvedArrow from={{ x: -126, y: -26 }} to={{ x: -50, y: -26 }} bend={-0.4} kind="radical" gap={4} />
      {label(-40, 0, 'H')}
      <line x1={-26} y1={0} x2={26} y2={0} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      {label(42, 0, 'CH₃', 'start')}
      <CurvedArrow from={{ x: 4, y: 18 }} to={{ x: 36, y: 18 }} bend={0.6} kind="radical" gap={3} />
      <line x1={0} y1={34} x2={0} y2={92} stroke="var(--fg-muted)" strokeWidth={2.2} markerEnd={`url(#${marker})`} />
      {label(-120, 128, 'H–Cl')}
      {label(118, 128, '•CH₃')}
    </g>
  )
}

/** Step 3: the two propagation steps as a loop: a Cl• at the top, •CH₃ at the bottom, two arcs between. */
function ChainDrawing({ marker }: { marker: string }) {
  const cx = VIEW_WIDTH / 2
  const cy = 218
  const R = 140
  /** A point on the loop at an angle in degrees (0 is right, 90 is down). */
  const at = (deg: number) => ({ x: cx + R * Math.cos((deg * Math.PI) / 180), y: cy + R * Math.sin((deg * Math.PI) / 180) })
  const OFF = 22 // the arcs stop this far round from each node, clear of the node boxes
  const r1 = at(-90 + OFF)
  const r2 = at(90 - OFF)
  const l1 = at(90 + OFF)
  const l2 = at(270 - OFF)
  const top = at(-90)
  const bottom = at(90)
  return (
    <g>
      <path d={`M ${r1.x} ${r1.y} A ${R} ${R} 0 0 1 ${r2.x} ${r2.y}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2.4} markerEnd={`url(#${marker})`} />
      <path d={`M ${l1.x} ${l1.y} A ${R} ${R} 0 0 1 ${l2.x} ${l2.y}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2.4} markerEnd={`url(#${marker})`} />
      <rect x={top.x - 34} y={top.y - 18} width={68} height={36} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <text x={top.x} y={top.y + 9} textAnchor="middle" fontSize={24} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Cl•
      </text>
      <rect x={bottom.x - 42} y={bottom.y - 18} width={84} height={36} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <text x={bottom.x} y={bottom.y + 9} textAnchor="middle" fontSize={24} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        •CH₃
      </text>
      <text x={cx + R + 14} y={cy - 10} textAnchor="start" fontSize={20} fontFamily={FONT} fill="var(--fg)">
        (a) + CH₄
      </text>
      <text x={cx + R + 14} y={cy + 16} textAnchor="start" fontSize={20} fontFamily={FONT} fill="var(--fg)">
        → HCl
      </text>
      <text x={cx - R - 14} y={cy - 10} textAnchor="end" fontSize={20} fontFamily={FONT} fill="var(--fg)">
        (b) + Cl₂
      </text>
      <text x={cx - R - 14} y={cy + 16} textAnchor="end" fontSize={20} fontFamily={FONT} fill="var(--fg)">
        → CH₃Cl
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        one Cl• in,
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        one Cl• out
      </text>
    </g>
  )
}

/** Step 4: three pairings of radicals, the ethane row highlighted. */
function TerminationDrawing({ reducedMotion, marker }: { reducedMotion: boolean; marker: string }) {
  return (
    <g>
      {TERMINATIONS.map((t, i) => {
        const y = 120 + i * 100
        return (
          <g key={t.product}>
            {t.highlight ? (
              <rect x={36} y={y - 42} width={508} height={84} rx={14} fill="none" stroke="var(--highlight)" strokeWidth={2.6} className={enter(reducedMotion)} />
            ) : null}
            <text x={60} y={y + 9} textAnchor="start" fontSize={26} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
              {t.left[0]} + {t.left[1]}
            </text>
            <line x1={250} y1={y} x2={300} y2={y} stroke="var(--fg-muted)" strokeWidth={2.2} markerEnd={`url(#${marker})`} />
            <text x={330} y={y + 9} textAnchor="start" fontSize={26} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
              {t.product}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function ModelCard({ model, reducedMotion }: { model: PentaneModel; reducedMotion: boolean }) {
  const camera = cameraForMolecule(model.data, 0.8)
  return (
    <figure className={styles.model} data-testid="radical-model" data-smiles={model.smiles} data-enter={enter(reducedMotion) ? 'on' : 'off'}>
      <div className={styles.modelStage}>
        <Stage3DLazy
          label={`${model.name} carbon skeleton in 3D, drag to turn it`}
          fallback={<Molecule3DFallback {...model.data} />}
          cameraPosition={camera}
          hint="Drag to turn"
        >
          <Molecule3D {...model.data} />
        </Stage3DLazy>
      </div>
      <figcaption className={styles.modelCaption}>
        <span className={styles.modelName}>{model.name}</span>
        <span className={styles.modelBp}>b.p. {model.boilingPointK.toFixed(1)} K</span>
      </figcaption>
    </figure>
  )
}

/**
 * The radical-chain Scrolly: the free-radical chlorination of methane in five Steps (initiation,
 * propagation, the chain loop, termination), then the boiling points of the three pentanes in 3D.
 * Every formula and boiling point comes from the lib; the Steps are in radical-chain-steps.ts.
 */
export function RadicalChain({ step, reducedMotion }: RadicalChainProps) {
  const current = radicalStep(step)
  const markerId = useId().replace(/:/g, '')
  const marker = `arrow-${markerId}`
  const shapes = current.kind === 'shape'

  return (
    <div className={styles.panel} data-testid="radical-chain" data-step={current.kind}>
      {shapes ? (
        <div key="shape" className={`${styles.models} ${enter(reducedMotion) ?? ''}`}>
          <h4 className={styles.heading}>{current.title}</h4>
          <div className={styles.cards}>
            {MODELS.map((m) => (
              <ModelCard key={m.smiles} model={m} reducedMotion={reducedMotion} />
            ))}
          </div>
          <p className={styles.note}>Carbon skeletons drawn for shape; hydrogens are left out. Drag each model to turn it.</p>
        </div>
      ) : (
        <svg
          key={current.kind}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          width="100%"
          role="img"
          aria-label={`${current.title}. ${current.caption[0]} ${current.caption[1]}`}
          className={styles.svg}
        >
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--fg-muted)" />
            </marker>
          </defs>
          <g className={enter(reducedMotion)} key={`d-${current.kind}`}>
            <Title>{current.title}</Title>
            {current.kind === 'initiation' ? <InitiationDrawing /> : null}
            {current.kind === 'propagation' ? <PropagationDrawing marker={marker} /> : null}
            {current.kind === 'chain' ? <ChainDrawing marker={marker} /> : null}
            {current.kind === 'termination' ? <TerminationDrawing reducedMotion={reducedMotion} marker={marker} /> : null}
            <Caption lines={current.caption} />
          </g>
        </svg>
      )}
    </div>
  )
}
