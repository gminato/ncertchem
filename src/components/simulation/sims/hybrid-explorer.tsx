'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Button, Segmented } from '@/components/controls'
import { HybridOrbitals, Molecule3DFallback, Molecule3D, OverlapDiagram, cameraForMolecule, type HybridKind, type Molecule3DData } from '@/components/molecule'
import { OrbitalBox, VocabDefs, Label } from '@/components/vocab'
import { Stage3DLazy } from '@/components/stage3d'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  HYBRID_CENTRES,
  atomicNumberOf,
  centreHybridisation,
  groundStateRows,
  hybridCentre,
  hybridLabel,
  hybridState,
  moleculeGeometry,
  promotedRows,
  promotionNeeded,
  sigmaPiCounts,
  unpairedIn,
  type BoxFill,
  type HybridCentre,
  type SubshellBoxes,
} from '@/lib/chem/hybrid-explorer'
import { electronConfiguration } from '@/lib/chem/quantum'
import { hybridisedOrbitals, sCharacter } from '@/lib/chem/hybridisation'
import styles from './hybrid-explorer.module.css'

type Stage = 'ground' | 'promotion' | 'hybrid' | 'bonds'

const STAGES: { value: Stage; label: string }[] = [
  { value: 'ground', label: 'Ground state' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'hybrid', label: 'Hybridisation' },
  { value: 'bonds', label: 'Bonds' },
]

const STAGE_INDEX: Record<Stage, number> = { ground: 0, promotion: 1, hybrid: 2, bonds: 3 }

/** Auto-play pace between stages, in milliseconds. */
const PLAY_MS = 2600

/** Layout of the orbital ladder, in SVG units. */
const BOX = 34
const GAP = 6
const GROUP_GAP = 24
const ROW_X = 96
const ROW_TOPS = [52, 150, 248] as const
const ROW_NAMES = ['Ground', 'Promoted', 'Hybrid'] as const

/** Subshell label in the maths style, with its orbital name. */
const SubLabel = ({ children }: { children: ReactNode }) => <tspan className="sym">{children}</tspan>

/** A configuration such as 1s² 2p⁶, with each orbital letter set in the maths style. */
function configurationNodes(text: string): ReactNode[] {
  return text.split(/([spdf])/).map((part, i) =>
    /^[spdf]$/.test(part) ? (
      <tspan key={i} className="sym">
        {part}
      </tspan>
    ) : (
      part
    )
  )
}

/** A fraction as a percentage, with thirds written as 33⅓% and 66⅔% rather than rounded. */
function percentText(fraction: number): string {
  const value = fraction * 100
  if (Math.abs(value - 100 / 3) < 0.01) return '33⅓%'
  if (Math.abs(value - 200 / 3) < 0.01) return '66⅔%'
  return `${Math.round(value)}%`
}

/** Width of a group of boxes, without any label. */
const groupWidth = (count: number) => count * BOX + Math.max(0, count - 1) * GAP

/**
 * Draws one row of boxes: each group is a subshell (or a set of hybrids), with its name above.
 * Groups that have not been reached yet are dimmed rather than hidden, so the ladder keeps
 * its layout from one Step to the next.
 */
function BoxRow({
  top,
  groups,
  dim,
}: {
  top: number
  groups: { label: ReactNode; boxes: BoxFill[]; piNote?: boolean }[]
  dim: boolean
}) {
  const starts: number[] = []
  groups.reduce((x, group) => {
    starts.push(x)
    return x + groupWidth(group.boxes.length) + GROUP_GAP
  }, ROW_X)
  return (
    <g opacity={dim ? 0.3 : 1} data-testid="box-row">
      {groups.map((group, gi) => {
        const width = groupWidth(group.boxes.length)
        const groupX = starts[gi]
        return (
          <g key={`g-${gi}`}>
            <Label x={groupX + width / 2} y={top - 14} fontSize={14} fill="var(--fg)">
              {group.label}
            </Label>
            <OrbitalBox
              x={groupX}
              y={top}
              size={BOX}
              gap={GAP}
              orbitals={group.boxes.map((b) => ({ up: b >= 1, down: b === 2 }))}
              fontSize={14}
            />
          </g>
        )
      })}
    </g>
  )
}

/** Orbital ladder: ground state, promotion and the hybrid set, for the chosen centre. */
function OrbitalLadder({ centre, stage }: { centre: HybridCentre; stage: number }) {
  const ground = groundStateRows(centre)
  const promoted = promotedRows(centre)
  const hybrid = hybridState(centre)
  const needs = promotionNeeded(centre)
  const hybridGroups: { label: ReactNode; boxes: BoxFill[] }[] = [
    { label: <SubLabel>{hybrid.label}</SubLabel>, boxes: hybrid.hybrids },
  ]
  if (hybrid.leftoverP.length > 0) {
    hybridGroups.push({
      label: (
        <>
          <SubLabel>p</SubLabel>
          {centre.piBonds > 0 ? (
            <>
              {' ('}
              <SubLabel>π</SubLabel>
              {')'}
            </>
          ) : null}
        </>
      ),
      boxes: hybrid.leftoverP,
    })
  }
  if (hybrid.leftoverD.length > 0) {
    hybridGroups.push({ label: <SubLabel>d</SubLabel>, boxes: hybrid.leftoverD })
  }
  const toGroups = (rows: SubshellBoxes[]) =>
    rows.map((r) => ({ label: <SubLabel>{r.label}</SubLabel>, boxes: r.boxes }))

  return (
    <svg viewBox="0 0 600 330" role="img" aria-label={`Orbital boxes for ${centre.centre} in ${centre.molecule}: ground state, promoted state and hybrid set`} className={styles.ladder}>
      <VocabDefs />
      <Label x={ROW_X - 8} y={ROW_TOPS[0] + BOX / 2} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
        {ROW_NAMES[0]}
      </Label>
      <BoxRow top={ROW_TOPS[0]} groups={toGroups(ground)} dim={false} />
      <Label x={ROW_X} y={ROW_TOPS[0] + BOX + 22} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
        {centre.centre}: {configurationNodes(electronConfiguration(atomicNumberOf(centre.centre)).text)}
      </Label>

      <Label x={ROW_X - 8} y={ROW_TOPS[1] + BOX / 2} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
        {ROW_NAMES[1]}
      </Label>
      <BoxRow top={ROW_TOPS[1]} groups={toGroups(promoted)} dim={stage < 1} />
      <Label x={ROW_X} y={ROW_TOPS[1] + BOX + 22} textAnchor="start" fontSize={14} fill="var(--fg-muted)" data-testid="promotion-note">
        {needs
          ? `${unpairedIn(groundStateRows(centre))} unpaired in the ground state, ${unpairedIn(promoted)} after promotion`
          : 'No promotion: the ground state already has the unpaired electrons'}
      </Label>

      <Label x={ROW_X - 8} y={ROW_TOPS[2] + BOX / 2} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
        {ROW_NAMES[2]}
      </Label>
      <BoxRow top={ROW_TOPS[2]} groups={hybridGroups} dim={stage < 2} />
      <Label x={ROW_X} y={ROW_TOPS[2] + BOX + 22} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
        {`${hybrid.hybrids.length} hybrid${hybrid.hybrids.length === 1 ? '' : 's'} with ${hybrid.electrons} electrons in all`}
      </Label>
    </svg>
  )
}

/** Right-hand panel, which changes with the Stage. */
function ShapePanel({ centre, stage }: { centre: HybridCentre; stage: Stage }) {
  const geometry = moleculeGeometry(centre.id)
  const data: Molecule3DData = {
    atoms: geometry.atoms.map((a) => ({ id: a.id, element: a.element, position: [a.position[0], a.position[1], a.position[2]] })),
    bonds: geometry.bonds.map((b) => ({ a: b.a, b: b.b, order: b.order })),
    lonePairs: geometry.lonePairs.map((lp) => ({ atom: lp.atom, direction: [lp.direction[0], lp.direction[1], lp.direction[2]] })),
  }
  const h = centreHybridisation(centre)
  const lobeKind = h === 'sp' || h === 'sp2' || h === 'sp3' ? (h as HybridKind) : null
  const hasLobes = lobeKind !== null

  if (stage === 'ground' || stage === 'promotion') {
    const config = electronConfiguration(atomicNumberOf(centre.centre)).text
    return (
      <div className={styles.card} data-testid="shape-card">
        <p className={styles.cardTitle}>Before hybridisation</p>
        <p className={styles.cardBody}>
          <span className="sym">{centre.centre}</span> has the ground-state configuration {config}. The valence electrons
          sit in the orbitals on the left. Hybridisation only mixes orbitals of the same atom, so it starts from this list.
        </p>
        {stage === 'promotion' && (
          <p className={styles.cardBody}>
            {promotionNeeded(centre)
              ? `Promotion moves electrons into empty orbitals of the same shell, to give ${unpairedIn(promotedRows(centre))} unpaired electrons that can form bonds.`
              : 'The ground state already has enough unpaired electrons, so no electron is promoted.'}
          </p>
        )}
      </div>
    )
  }

  if (stage === 'hybrid') {
    const used = hybridisedOrbitals(h)
    const s = sCharacter(h)
    return (
      <div className={styles.card} data-testid="shape-card">
        <p className={styles.cardTitle}>
          {hybridLabel(h)} hybrids: {hybridState(centre).hybrids.length}
        </p>
        <p className={styles.cardBody}>
          Mixing {used.length} atomic orbitals gives {used.length} equivalent hybrids
          {hasLobes ? (
            <>
              , each with {percentText(s)} <span className="sym">s</span> character
            </>
          ) : null}
          .
        </p>
        {centre.piBonds > 0 ? (
          <div className={styles.lobeRow}>
            {lobeKind && (
              <svg viewBox="0 0 340 180" role="img" aria-label={`${hybridLabel(h)} hybrid lobes`} className={styles.lobeSvg}>
                <VocabDefs />
                <HybridOrbitals kind={lobeKind} />
              </svg>
            )}
            <svg viewBox="0 0 300 200" role="img" aria-label="Edge-on view of the π bond: p orbitals overlap side on, above and below the molecular plane" className={styles.lobeSvg}>
              <VocabDefs />
              <g transform="translate(0, 0)">
                <OverlapDiagram kind="pp-pi" phase="positive" separation={0.45} />
              </g>
            </svg>
            <p className={styles.cardBody}>
              The unhybridised <span className="sym">p</span> orbitals sit at right angles to the plane of the σ framework. Side on,
              they overlap above and below that plane, which is the π bond.
            </p>
          </div>
        ) : lobeKind ? (
          <svg viewBox="0 0 340 180" role="img" aria-label={`${hybridLabel(h)} hybrid lobes`} className={styles.lobeSvg}>
            <VocabDefs />
            <HybridOrbitals kind={lobeKind} />
          </svg>
        ) : (
          <p className={styles.cardBody}>Geometry only: the lobes of <span className="sym">sp³d</span> and <span className="sym">sp³d²</span> hybrids are not drawn here. Step on to see the molecule.</p>
        )}
      </div>
    )
  }

  return (
    <Stage3DLazy
      label={`${centre.molecule} in 3D: ${centre.centre} with its bonds. Drag to rotate.`}
      cameraPosition={cameraForMolecule(data)}
      fallback={<Molecule3DFallback {...data} showSymbols />}
    >
      <Molecule3D {...data} showSymbols />
    </Stage3DLazy>
  )
}

/** The numbers of the current Stage, as a sentence for screen readers and the caption. */
function readoutFor(centre: HybridCentre, stage: Stage): string {
  const h = hybridState(centre)
  const { sigma, pi } = sigmaPiCounts(centre)
  const name = centre.molecule.replace(' (each C)', '')
  switch (stage) {
    case 'ground':
      return `${name}: the central ${centre.centre} starts with ${unpairedIn(groundStateRows(centre))} unpaired electron${unpairedIn(groundStateRows(centre)) === 1 ? '' : 's'} in its valence orbitals.`
    case 'promotion':
      return promotionNeeded(centre)
        ? `Promotion: ${unpairedIn(promotedRows(centre))} unpaired electrons are available for bonding.`
        : `Promotion: none needed. ${unpairedIn(groundStateRows(centre))} unpaired electrons are already there.`
    case 'hybrid':
      return `Hybridisation: ${h.hybrids.length} ${h.label} hybrid orbitals${h.leftoverP.length ? `, with ${h.leftoverP.length} unhybridised p orbital${h.leftoverP.length === 1 ? '' : 's'} left over` : ''}.`
    case 'bonds':
      return `Bonds: ${sigma} σ and ${pi} π in ${name}. The σ bonds come from the hybrids and the π bonds from the unhybridised p orbitals.`
  }
}

/**
 * HybridExplorer: choose a central atom and step through its orbitals. The ground state comes
 * first, then promotion, then the hybrid set, then the molecule with its σ and π bonds. The
 * hybridisation rules and bond counts come from the chemistry library, so the numbers agree
 * with the Section text.
 */
export function HybridExplorer(_props: SimulationProps) {
  const [id, setId] = useState('CH4')
  const [stage, setStage] = useState<Stage>('ground')
  const [playing, setPlaying] = useState(false)
  const centre = hybridCentre(id)
  const index = STAGE_INDEX[stage]

  useEffect(() => {
    if (!playing) return
    // At the last Stage, playing ends on the next tick: the timer, not the effect body, sets the state.
    const timer = window.setTimeout(
      () => (index >= 3 ? setPlaying(false) : setStage(STAGES[index + 1].value)),
      index >= 3 ? 0 : PLAY_MS
    )
    return () => window.clearTimeout(timer)
  }, [playing, index])

  const onMolecule = (next: string) => {
    setId(next)
    setPlaying(false)
  }

  return (
    <div className={styles.sim} data-testid="hybrid-explorer" data-centre={id} data-stage={stage}>
      <div className={styles.panels}>
        <div className={styles.panel}>
          <OrbitalLadder centre={centre} stage={index} />
        </div>
        <div className={styles.panel}>
          <ShapePanel centre={centre} stage={stage} />
        </div>
      </div>
      <p className={styles.readout} aria-live="polite" data-testid="hybrid-readout">
        {readoutFor(centre, stage)}
      </p>
      <p className={styles.note}>
        Hybridisation describes the bonding in a shape that VSEPR predicts. It does not cause the shape.
      </p>

      <SimulationControls>
        <div className={styles.controls}>
          <label className={styles.selectLabel}>
            Molecule
            <select
              className={styles.select}
              value={id}
              onChange={(e) => onMolecule(e.target.value)}
              data-testid="centre-select"
            >
              {HYBRID_CENTRES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.molecule}
                </option>
              ))}
            </select>
          </label>
          <Segmented
            label="Stage"
            options={STAGES.map((s) => ({ value: s.value, label: s.label }))}
            value={stage}
            onChange={(next) => {
              setPlaying(false)
              setStage(next)
            }}
          />
          <Button variant="secondary" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
            {playing ? 'Pause' : 'Play stages'}
          </Button>
        </div>
      </SimulationControls>
    </div>
  )
}
