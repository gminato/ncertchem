'use client'

import { useState } from 'react'
import {
  ALL_DISSECTED_OPTIONS,
  DEFAULT_ENTITY_FORMULA,
  dissectComplex,
  formatChargeSup,
  formatSigned,
  type DissectedComplex,
} from './coordination-dissector-logic'
import styles from './coordination-dissector.module.css'

type TermKey = 'metal' | 'ligands' | 'sphere' | 'cn' | 'ox' | 'leptic' | 'polyhedron'

const INITIAL_REVEALED: Record<TermKey, boolean> = {
  metal: true,
  ligands: true,
  sphere: true,
  cn: false,
  ox: false,
  leptic: false,
  polyhedron: false,
}

const ALL_REVEALED: Record<TermKey, boolean> = {
  metal: true,
  ligands: true,
  sphere: true,
  cn: true,
  ox: true,
  leptic: true,
  polyhedron: true,
}

const ALL_HIDDEN: Record<TermKey, boolean> = {
  metal: false,
  ligands: false,
  sphere: false,
  cn: false,
  ox: false,
  leptic: false,
  polyhedron: false,
}

const SVG_W = 400
const SVG_H = 310
const ARROW_A = 's52-sim-arrow-a'
const ARROW_B = 's52-sim-arrow-b'

function DonorSchematic({ data }: { data: DissectedComplex }) {
  const cx = SVG_W / 2
  const cy = 156
  const metalR = 29

  // Flatten individual ligand units to place around the metal
  const units: Array<{
    key: string
    display: string
    donorSymbol: string
    donorAtoms: number
    groupIndex: number
  }> = []

  data.ligands.forEach((lig, groupIndex) => {
    for (let i = 0; i < lig.count; i++) {
      units.push({
        key: `${lig.code}-${i}`,
        display: lig.display,
        donorSymbol: lig.donorSymbol,
        donorAtoms: lig.donorAtoms,
        groupIndex,
      })
    }
  })

  const totalUnits = units.length
  const radius = totalUnits <= 3 ? 102 : 108

  return (
    <svg
      className={styles.scene}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      role="img"
      aria-label={`Donor arrow schematic for ${data.displayFormula}: ${data.cn} donor arrows pointing to ${data.entity.metal}`}
    >
      <defs>
        <marker id={ARROW_A} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 1 L9 5 L0 9 z" fill="var(--el-N)" />
        </marker>
        <marker id={ARROW_B} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 1 L9 5 L0 9 z" fill="var(--el-Cl)" />
        </marker>
      </defs>

      {/* Draw each ligand and its donor arrow(s) */}
      {units.map((u, idx) => {
        const theta = -Math.PI / 2 + (idx * 2 * Math.PI) / totalUnits
        const color = u.groupIndex === 0 ? 'var(--el-N)' : 'var(--el-Cl)'
        const markerId = u.groupIndex === 0 ? ARROW_A : ARROW_B

        if (u.donorAtoms === 2) {
          // Didentate: two donor circles linked by a curved chelate backbone, sending 2 arrows to M
          const spread = 0.34
          const a1 = theta - spread
          const a2 = theta + spread
          const rDonor = 90
          const rOuter = 124

          const d1x = cx + rDonor * Math.cos(a1)
          const d1y = cy + rDonor * Math.sin(a1)
          const d2x = cx + rDonor * Math.cos(a2)
          const d2y = cy + rDonor * Math.sin(a2)

          const midX = cx + rOuter * Math.cos(theta)
          const midY = cy + rOuter * Math.sin(theta)

          const end1x = cx + (metalR + 5) * Math.cos(a1)
          const end1y = cy + (metalR + 5) * Math.sin(a1)
          const end2x = cx + (metalR + 5) * Math.cos(a2)
          const end2y = cy + (metalR + 5) * Math.sin(a2)

          const start1x = cx + (rDonor - 16) * Math.cos(a1)
          const start1y = cy + (rDonor - 16) * Math.sin(a1)
          const start2x = cx + (rDonor - 16) * Math.cos(a2)
          const start2y = cy + (rDonor - 16) * Math.sin(a2)

          return (
            <g key={u.key}>
              {/* Curved chelate ligand bridge */}
              <path
                d={`M ${d1x.toFixed(1)} ${d1y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${d2x.toFixed(1)} ${d2y.toFixed(1)}`}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeOpacity={0.7}
              />
              {/* Two donor arrows */}
              <line
                x1={start1x}
                y1={start1y}
                x2={end1x}
                y2={end1y}
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                markerEnd={`url(#${markerId})`}
              />
              <line
                x1={start2x}
                y1={start2y}
                x2={end2x}
                y2={end2y}
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                markerEnd={`url(#${markerId})`}
              />
              <circle cx={d1x} cy={d1y} r={14} fill="var(--surface)" stroke={color} strokeWidth={2} />
              <text x={d1x} y={d1y + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--fg)">
                {u.donorSymbol}
              </text>
              <circle cx={d2x} cy={d2y} r={14} fill="var(--surface)" stroke={color} strokeWidth={2} />
              <text x={d2x} y={d2y + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--fg)">
                {u.donorSymbol}
              </text>
              <text
                x={midX}
                y={midY + (Math.sin(theta) > 0.3 ? 18 : Math.sin(theta) < -0.3 ? -10 : 5)}
                textAnchor="middle"
                fontSize={15}
                fontWeight={600}
                fill="var(--fg-muted)"
              >
                {u.display}
              </text>
            </g>
          )
        }

        // Unidentate: 1 ligand node + 1 donor arrow
        const lx = cx + radius * Math.cos(theta)
        const ly = cy + radius * Math.sin(theta)
        const sx = cx + (radius - 24) * Math.cos(theta)
        const sy = cy + (radius - 24) * Math.sin(theta)
        const ex = cx + (metalR + 5) * Math.cos(theta)
        const ey = cy + (metalR + 5) * Math.sin(theta)

        return (
          <g key={u.key}>
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke={color}
              strokeWidth={2.6}
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
            />
            <circle cx={lx} cy={ly} r={22} fill="var(--surface)" stroke={color} strokeWidth={2.2} />
            <text x={lx} y={ly + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--fg)">
              {u.display}
            </text>
          </g>
        )
      })}

      {/* Central metal ion */}
      <circle cx={cx} cy={cy} r={metalR} fill="var(--surface)" stroke="var(--db-3d)" strokeWidth={2.8} />
      <circle cx={cx} cy={cy} r={metalR} fill="var(--db-3d)" fillOpacity={0.22} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--fg)">
        {data.entity.metal}
      </text>
    </svg>
  )
}

export function CoordinationDissector() {
  const [selected, setSelected] = useState<string>(DEFAULT_ENTITY_FORMULA)
  const [revealed, setRevealed] = useState<Record<TermKey, boolean>>(INITIAL_REVEALED)

  const data = dissectComplex(selected)

  const toggle = (key: TermKey) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSelect = (formula: string) => {
    setSelected(formula)
    setRevealed(INITIAL_REVEALED)
  }

  const terms: Array<{ key: TermKey; label: string; value: string; hint: string }> = [
    {
      key: 'metal',
      label: 'Central atom or ion',
      value: `${data.metalIonDisplay} (Lewis acid)`,
      hint: 'Predict the central metal ion',
    },
    {
      key: 'ligands',
      label: 'Ligands (count, charge, denticity)',
      value: data.ligands
        .map(
          (l) =>
            `${l.count} x ${l.display} (${l.name}, charge ${formatSigned(l.charge)}, ${l.kind}, ${l.donorAtoms} ${l.donorAtoms === 1 ? 'donor' : 'donors'})`
        )
        .join('; '),
      hint: 'Predict the ligands and denticity',
    },
    {
      key: 'sphere',
      label: 'Coordination sphere & counter ions',
      value: `Sphere: ${data.sphereDisplay} · Counter ions: ${data.counterIonLabel}`,
      hint: 'Identify inside vs outside the brackets',
    },
    {
      key: 'cn',
      label: 'Coordination number (CN)',
      value: `${data.cn} (${data.cnExpression})`,
      hint: 'Count the donor arrows first, then reveal',
    },
    {
      key: 'ox',
      label: 'Oxidation number',
      value: `${formatSigned(data.oxNumber)}, written ${data.romanLabel} (${data.oxExpression})`,
      hint: 'Compute entity charge minus ligand charges',
    },
    {
      key: 'leptic',
      label: 'Homoleptic or heteroleptic',
      value: data.homoleptic
        ? 'Homoleptic (only one kind of donor group)'
        : `Heteroleptic (${data.ligands.length} kinds of donor group)`,
      hint: 'One ligand kind or more than one?',
    },
    {
      key: 'polyhedron',
      label: 'Coordination polyhedron',
      value: data.polyhedronLabel,
      hint: 'Shape named in NCERT Section 5.2',
    },
  ]

  const liveSummary =
    `Selected ${data.displayFormula}. Central ion ${data.metalIonDisplay}, ` +
    `coordination number ${revealed.cn ? data.cn : 'hidden'}, ` +
    `oxidation number ${revealed.ox ? data.romanLabel : 'hidden'}.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Choose a Section 5.2 complex</span>
          <select
            className={styles.select}
            value={selected}
            onChange={(e) => handleSelect(e.target.value)}
          >
            {ALL_DISSECTED_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.bulkActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setRevealed(ALL_REVEALED)}
          >
            Reveal all
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setRevealed(ALL_HIDDEN)}
          >
            Hide all
          </button>
        </div>
      </div>

      {/* Colour-banded formula */}
      <div className={styles.formulaCard}>
        <div className={styles.formulaLine} aria-label={`Colour-banded formula ${data.displayFormula}`}>
          {data.counterIonPrefix && (
            <span className={styles.bandCounter}>{data.counterIonPrefix}</span>
          )}
          <span className={styles.bandBracket}>[</span>
          <span className={styles.bandMetal}>{data.entity.metal}</span>
          {data.ligands.map((l, idx) => (
            <span
              key={l.code}
              className={idx === 0 ? styles.bandLigandA : styles.bandLigandB}
            >
              {l.formulaToken}
            </span>
          ))}
          <span className={styles.bandBracket}>]</span>
          {!data.counterIonPrefix && data.entity.entityCharge !== 0 && (
            <span className={styles.bandCharge}>{formatChargeSup(data.entity.entityCharge)}</span>
          )}
        </div>

        <div className={styles.legend}>
          {data.counterIonPrefix && (
            <span className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: 'var(--ion-cation)' }} />
              Counter ion
            </span>
          )}
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: 'var(--accent)' }} />
            Coordination sphere [ ]
          </span>
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: 'var(--db-3d)' }} />
            Central metal
          </span>
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: 'var(--el-N)' }} />
            {data.ligands.length > 1 ? `Ligand 1 (${data.ligands[0].display})` : `Ligand (${data.ligands[0].display})`}
          </span>
          {data.ligands.length > 1 && (
            <span className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: 'var(--el-Cl)' }} />
              {`Ligand 2 (${data.ligands[1].display})`}
            </span>
          )}
        </div>
      </div>

      {/* Schematic + Term breakdown */}
      <div className={styles.workspace}>
        <div className={styles.schematicCard}>
          <div className={styles.schematicHeader}>
            <h4 className={styles.cardHeading}>Donor-atom arrangement</h4>
            <span className={styles.arrowBadge}>
              {revealed.cn ? `Donor arrows: ${data.cn} (CN = ${data.cn})` : 'Count the donor arrows'}
            </span>
          </div>
          <DonorSchematic data={data} />
        </div>

        <div className={styles.termsCard}>
          <h4 className={styles.cardHeading}>Term breakdown</h4>
          <ul className={styles.termList}>
            {terms.map((t) => {
              const isOpen = revealed[t.key]
              return (
                <li key={t.key} className={styles.termRow}>
                  <div className={styles.termBody}>
                    <span className={styles.termLabel}>{t.label}</span>
                    {isOpen ? (
                      <span className={styles.termValue}>{t.value}</span>
                    ) : (
                      <span className={styles.termHidden}>{t.hint}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.revealBtn}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Hide' : 'Reveal'} ${t.label}`}
                    onClick={() => toggle(t.key)}
                  >
                    {isOpen ? 'Hide' : 'Reveal'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
