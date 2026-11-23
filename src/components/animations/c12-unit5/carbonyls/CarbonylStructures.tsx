'use client'

import { CarbonylDiagram } from './CarbonylDiagram'
import {
  CO_CARBONYL,
  MN_CARBONYL,
  SINGLE_METAL_CARBONYLS,
  bridgeCountCaption,
  structuresStepVisual,
} from './structures-steps'

export interface CarbonylStructuresProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 440

function SingleMetalScene() {
  const centers = [94, 280, 466]
  return (
    <g>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Single-metal homoleptic carbonyls (oxidation state 0)
      </text>

      {SINGLE_METAL_CARBONYLS.map((c, idx) => {
        const cx = centers[idx]
        const isTbp = c.geometry === 'trigonal bipyramidal'
        return (
          <g key={c.formula}>
            <CarbonylDiagram
              formula={c.formula}
              cx={cx}
              cy={192}
              scale={0.62}
              fontSize={16}
              showGuides
              markerPrefix={`struct-s1-${idx}`}
            />
            <text x={cx} y={306} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
              {c.displayFormula}
            </text>
            {isTbp ? (
              <>
                <text x={cx} y={330} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
                  Trigonal
                </text>
                <text x={cx} y={350} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
                  bipyramidal
                </text>
              </>
            ) : (
              <text x={cx} y={330} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
                {c.geometry.charAt(0).toUpperCase() + c.geometry.slice(1)}
              </text>
            )}
          </g>
        )
      })}

      <text x={W / 2} y={406} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Every CO ligand attaches to the metal through its carbon atom.
      </text>
    </g>
  )
}

function MnDimerScene() {
  return (
    <g>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        {`${MN_CARBONYL.displayFormula}: ${MN_CARBONYL.name}`}
      </text>

      <CarbonylDiagram
        formula={MN_CARBONYL.formula}
        cx={W / 2}
        cy={206}
        scale={1}
        fontSize={16}
        highlightMetalBond
        muteTerminalCO
        markerPrefix="struct-s2"
      />

      <text x={W / 2} y={368} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Two square pyramidal Mn(CO)₅ units joined by a Mn-Mn bond
      </text>
      <text x={W / 2} y={394} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        All 10 CO ligands are terminal (0 bridging CO).
      </text>
    </g>
  )
}

function CoBridgedScene() {
  return (
    <g>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        {`${CO_CARBONYL.displayFormula}: ${CO_CARBONYL.name}`}
      </text>

      <CarbonylDiagram
        formula={CO_CARBONYL.formula}
        cx={W / 2}
        cy={204}
        scale={0.94}
        fontSize={16}
        highlightBridges
        markerPrefix="struct-s3"
      />

      {/* Callout pointing to the top bridging CO */}
      <line x1={312} y1={116} x2={360} y2={92} stroke="var(--db-3d)" strokeWidth={1.6} />
      <text x={366} y={96} fontSize={15} fontWeight={600} fill="var(--db-3d)">
        bridging CO
      </text>

      <text x={W / 2} y={372} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
        {bridgeCountCaption(CO_CARBONYL)}
      </text>
      <text x={W / 2} y={398} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Two CO groups bridge across the Co-Co bond; six CO groups are terminal.
      </text>
    </g>
  )
}

function ariaLabelFor(visual: ReturnType<typeof structuresStepVisual>): string {
  switch (visual) {
    case 'single-metal':
      return 'Single-metal homoleptic carbonyls: tetrahedral Ni(CO)4, trigonal bipyramidal Fe(CO)5, and octahedral Cr(CO)6.'
    case 'mn-dimer':
      return 'Decacarbonyldimanganese(0), [Mn2(CO)10]: two square pyramidal Mn(CO)5 units joined by a highlighted Mn-Mn bond.'
    case 'co-bridged':
      return 'Octacarbonyldicobalt(0), [Co2(CO)8]: Co-Co bond bridged by two CO groups plus six terminal CO groups, 8 CO total.'
  }
}

export function CarbonylStructures({ step, reducedMotion }: CarbonylStructuresProps) {
  const visual = structuresStepVisual(step)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={ariaLabelFor(visual)}
      style={{
        display: 'block',
        transition: reducedMotion ? 'none' : 'opacity 220ms ease',
      }}
    >
      {visual === 'single-metal' && <SingleMetalScene />}
      {visual === 'mn-dimer' && <MnDimerScene />}
      {visual === 'co-bridged' && <CoBridgedScene />}
    </svg>
  )
}
