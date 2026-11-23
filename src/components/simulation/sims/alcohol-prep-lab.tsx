'use client'

import { useState } from 'react'
import { Segmented } from '@/components/controls'
import { SkeletalFormula, skeletalBounds } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  FAMILIES,
  GRIGNARD_OPTIONS,
  SUBSTRATES,
  computeWorkbenchOutcome,
  reagentsForFamily,
  substratesForFamily,
  type GrignardAlkylId,
  type ReagentSpec,
  type SubstrateFamilyId,
  type SubstrateId,
  type WorkbenchOutcome,
  type WorkbenchReagentId,
} from '@/lib/chem/c12-u7-s4-alcohol-prep'
import styles from './alcohol-prep-lab.module.css'

const VB_W = 740
const VB_H = 296
const CARD_Y = 16
const CARD_H = 264
const SUB_X = 10
const SUB_W = 178
const INT_X = 280
const INT_W = 180
const PROD_X = 552
const PROD_W = 178
const MOL_Y = 132

const GRAPH_CACHE: ReadonlyMap<string, MolGraph> = (() => {
  const map = new Map<string, MolGraph>()
  const add = (smiles: string | undefined) => {
    if (smiles && !map.has(smiles)) map.set(smiles, parseSmiles(smiles))
  }
  for (const s of SUBSTRATES) {
    add(s.smiles)
    for (const r of reagentsForFamily(s.family)) {
      for (const g of GRIGNARD_OPTIONS) {
        const out = computeWorkbenchOutcome(s.id, r.id, g.id)
        add(out.intermediate.smiles)
        add(out.product?.smiles)
      }
    }
  }
  return map
})()

function getGraph(smiles: string): MolGraph {
  return GRAPH_CACHE.get(smiles) ?? parseSmiles(smiles)
}

/** Scales a skeletal drawing cleanly inside a 148 x 110 box within a card. */
export function fitMoleculeScale(graph: MolGraph): number {
  const unit = skeletalBounds(graph, 1)
  const wScale = 148 / Math.max(unit.width, 0.8)
  const hScale = 110 / Math.max(unit.height, 0.8)
  return Math.max(30, Math.min(44, wScale, hScale))
}

function splitLongText(text: string, maxChars = 17): string[] {
  if (text.length <= maxChars) return [text]
  const sepIdx = text.indexOf('–', Math.floor(text.length * 0.3))
  if (sepIdx > 0 && sepIdx < text.length - 1) {
    return [text.slice(0, sepIdx + 1), text.slice(sepIdx + 1)]
  }
  const spaceIdx = text.lastIndexOf(' ', maxChars)
  if (spaceIdx > 0) {
    return [text.slice(0, spaceIdx), text.slice(spaceIdx + 1)]
  }
  const mid = Math.ceil(text.length / 2)
  return [text.slice(0, mid), text.slice(mid)]
}

function stepArrowLabels(outcome: WorkbenchOutcome): {
  a1Above: string[]
  a1Below: string[]
  a2Above: string[]
  a2Below: string[]
} {
  const { reagent, grignard, status } = outcome
  if (reagent.id === 'acid-hydration') {
    return {
      a1Above: ['H₃O⁺'],
      a1Below: ['Step 1'],
      a2Above: ['H₂O'],
      a2Below: ['Steps 2–3'],
    }
  }
  if (reagent.id === 'hydroboration-oxidation') {
    return {
      a1Above: ['(i) (BH₃)₂'],
      a1Below: ['syn-add'],
      a2Above: ['(ii) H₂O₂'],
      a2Below: ['OH⁻, H₂O'],
    }
  }
  if (reagent.id === 'lialh4') {
    return {
      a1Above: ['(i) LiAlH₄'],
      a1Below: ['hydride'],
      a2Above: ['(ii) H₂O'],
      a2Below: ['workup'],
    }
  }
  if (reagent.id === 'ester-h2') {
    return {
      a1Above: ["(i) R'OH"],
      a1Below: ['H⁺'],
      a2Above: ['(ii) H₂'],
      a2Below: ['Catalyst'],
    }
  }
  if (reagent.id === 'h2-pd') {
    return {
      a1Above: ['H₂'],
      a1Below: ['Pd'],
      a2Above: ['2 H'],
      a2Below: ['across C=O'],
    }
  }
  if (reagent.id === 'nabh4') {
    return {
      a1Above: ['NaBH₄'],
      a1Below: [status === 'no-reaction' ? 'too mild' : 'H⁻ donor'],
      a2Above: ['H₂O'],
      a2Below: ['workup'],
    }
  }
  const gFormula = grignard?.formulaUnicode ?? 'RMgBr'
  if (reagent.id === 'adduct') {
    return {
      a1Above: [gFormula],
      a1Below: ['dry ether'],
      a2Above: ['Step (ii)'],
      a2Below: ['add H₂O'],
    }
  }
  return {
    a1Above: ['(i) ' + gFormula],
    a1Below: ['dry ether'],
    a2Above: ['(ii) H₂O'],
    a2Below: ['hydrolysis'],
  }
}

function SchemeArrow({
  x1,
  x2,
  y,
  above,
  below,
  dashed = false,
  blocked = false,
}: {
  x1: number
  x2: number
  y: number
  above: string[]
  below: string[]
  dashed?: boolean
  blocked?: boolean
}) {
  const mid = (x1 + x2) / 2
  return (
    <g>
      <line
        x1={x1}
        y1={y}
        x2={x2 - 10}
        y2={y}
        className={dashed ? styles.arrowDashed : styles.arrowLine}
      />
      <polygon points={`${x2},${y} ${x2 - 11},${y - 6} ${x2 - 11},${y + 6}`} className={styles.arrowHead} />
      {blocked ? (
        <g stroke="var(--caution)" strokeWidth={3} strokeLinecap="round">
          <line x1={mid - 9} y1={y - 9} x2={mid + 9} y2={y + 9} />
          <line x1={mid + 9} y1={y - 9} x2={mid - 9} y2={y + 9} />
        </g>
      ) : null}
      {above.map((line, i) => (
        <text
          key={`ab-${i}`}
          x={mid}
          y={y - 16 - (above.length - 1 - i) * 16}
          textAnchor="middle"
          className={styles.arrowText}
        >
          {line}
        </text>
      ))}
      {below.map((line, i) => (
        <text key={`bl-${i}`} x={mid} y={y + 22 + i * 16} textAnchor="middle" className={styles.arrowSubText}>
          {line}
        </text>
      ))}
    </g>
  )
}

function degreeBadgeClass(degree: WorkbenchOutcome['degree']): string {
  if (degree === 'No reaction') return `${styles.degreeBadge} ${styles.badgeCaution}`
  if (degree.includes('1°')) return `${styles.degreeBadge} ${styles.badgeSuccess}`
  if (degree.includes('3°')) return `${styles.degreeBadge} ${styles.badgeCaution}`
  return `${styles.degreeBadge} ${styles.badgeAccent}`
}

export function AlcoholPrepLab() {
  const [family, setFamily] = useState<SubstrateFamilyId>('alkenes')
  const [substrateId, setSubstrateId] = useState<SubstrateId>('propene')
  const [reagentId, setReagentId] = useState<WorkbenchReagentId>('acid-hydration')
  const [grignardId, setGrignardId] = useState<GrignardAlkylId>('ch3mgbr')

  const familySubstrates = substratesForFamily(family)
  const familyReagents = reagentsForFamily(family)

  const activeSubstrate = familySubstrates.some((s) => s.id === substrateId)
    ? substrateId
    : familySubstrates[0].id
  const activeReagent = familyReagents.some((r) => r.id === reagentId)
    ? reagentId
    : familyReagents[0].id

  const handleFamilyChange = (nextFamily: SubstrateFamilyId) => {
    setFamily(nextFamily)
    setSubstrateId(substratesForFamily(nextFamily)[0].id)
    setReagentId(reagentsForFamily(nextFamily)[0].id)
  }

  const outcome = computeWorkbenchOutcome(activeSubstrate, activeReagent, grignardId)

  const subGraph = getGraph(outcome.substrate.smiles)
  const subScale = fitMoleculeScale(subGraph)
  const intGraph = outcome.intermediate.smiles ? getGraph(outcome.intermediate.smiles) : null
  const intScale = intGraph ? fitMoleculeScale(intGraph) : 38
  const prodGraph = outcome.product ? getGraph(outcome.product.smiles) : null
  const prodScale = prodGraph ? fitMoleculeScale(prodGraph) : 38

  const arrows = stepArrowLabels(outcome)
  const intFormulaLines = splitLongText(outcome.intermediate.formulaUnicode, 17)
  const intTitleLines = splitLongText(outcome.intermediate.title, 20)

  const prodCardClass =
    outcome.status === 'no-reaction'
      ? styles.cardCaution
      : outcome.status === 'reaction'
        ? styles.cardReaction
        : styles.cardIntermediate

  const intCardClass = outcome.status === 'no-reaction' ? styles.card : styles.cardIntermediate

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Substrate family</span>
          <Segmented
            label="Substrate family"
            options={FAMILIES.map((f) => ({ value: f.id, label: f.label }))}
            value={family}
            onChange={handleFamilyChange}
            className={styles.segmentedLarge}
          />
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Substrate</span>
          <div className={styles.buttonRow} role="radiogroup" aria-label="Substrate">
            {familySubstrates.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={s.id === activeSubstrate}
                className={styles.choiceBtn}
                onClick={() => setSubstrateId(s.id)}
                data-testid={`sub-${s.id}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {family === 'grignard' ? (
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Grignard alkyl reagent</span>
            <Segmented
              label="Grignard reagent"
              options={GRIGNARD_OPTIONS.map((g) => ({ value: g.id, label: g.formulaUnicode }))}
              value={grignardId}
              onChange={setGrignardId}
              className={styles.segmentedLarge}
            />
          </div>
        ) : null}

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>
            {family === 'grignard' ? 'Reaction stage' : 'Reagent conditions'}
          </span>
          <div
            className={styles.buttonRow}
            role="radiogroup"
            aria-label={family === 'grignard' ? 'Reaction stage' : 'Reagent conditions'}
          >
            {familyReagents.map((r: ReagentSpec) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={r.id === activeReagent}
                className={styles.choiceBtn}
                onClick={() => setReagentId(r.id)}
                data-testid={`reag-${r.id}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={outcome.summaryText}
        >
          {/* Card 1: Substrate */}
          <rect x={SUB_X} y={CARD_Y} width={SUB_W} height={CARD_H} rx={12} className={styles.card} />
          <text x={SUB_X + SUB_W / 2} y={38} textAnchor="middle" className={styles.cardEyebrow}>
            Substrate
          </text>
          <SkeletalFormula graph={subGraph} scale={subScale} x={SUB_X + SUB_W / 2} y={MOL_Y} />
          <text x={SUB_X + SUB_W / 2} y={226} textAnchor="middle" className={styles.cardTitle}>
            {outcome.substrate.shortName}
          </text>
          <text x={SUB_X + SUB_W / 2} y={250} textAnchor="middle" className={styles.cardSub}>
            {outcome.substrate.formulaUnicode}
          </text>

          {/* Arrow 1 */}
          <SchemeArrow
            x1={SUB_X + SUB_W + 8}
            x2={INT_X - 8}
            y={MOL_Y}
            above={arrows.a1Above}
            below={arrows.a1Below}
            blocked={outcome.status === 'no-reaction'}
          />

          {/* Card 2: Key Intermediate */}
          <rect x={INT_X} y={CARD_Y} width={INT_W} height={CARD_H} rx={12} className={intCardClass} />
          <text x={INT_X + INT_W / 2} y={38} textAnchor="middle" className={styles.cardEyebrow}>
            Key intermediate
          </text>
          {intGraph ? (
            <SkeletalFormula
              graph={intGraph}
              scale={intScale}
              x={INT_X + INT_W / 2}
              y={MOL_Y}
              highlightAtoms={outcome.intermediate.highlightAtoms ?? []}
            />
          ) : (
            <g>
              <rect
                x={INT_X + 12}
                y={96}
                width={INT_W - 24}
                height={70}
                rx={8}
                fill={outcome.status === 'no-reaction' ? 'var(--caution-soft)' : 'var(--accent-soft)'}
              />
              {intFormulaLines.map((line, i) => (
                <text
                  key={`if-${i}`}
                  x={INT_X + INT_W / 2}
                  y={intFormulaLines.length === 1 ? 136 : 122 + i * 24}
                  textAnchor="middle"
                  className={styles.cardTitle}
                >
                  {line}
                </text>
              ))}
            </g>
          )}
          {intTitleLines.map((line, i) => (
            <text
              key={`it-${i}`}
              x={INT_X + INT_W / 2}
              y={intTitleLines.length === 1 ? 226 : 216 + i * 20}
              textAnchor="middle"
              className={styles.cardTitle}
            >
              {line}
            </text>
          ))}
          <text x={INT_X + INT_W / 2} y={258} textAnchor="middle" className={styles.cardSub}>
            {outcome.status === 'no-reaction'
              ? 'Barrier not crossed'
              : outcome.grignard
                ? `ΔC = +${outcome.deltaC} carbon${outcome.deltaC === 1 ? '' : 's'}`
                : 'Intermediate stage'}
          </text>

          {/* Arrow 2 */}
          <SchemeArrow
            x1={INT_X + INT_W + 8}
            x2={PROD_X - 8}
            y={MOL_Y}
            above={arrows.a2Above}
            below={arrows.a2Below}
            dashed={outcome.status !== 'reaction'}
          />

          {/* Card 3: Alcohol Product */}
          <rect x={PROD_X} y={CARD_Y} width={PROD_W} height={CARD_H} rx={12} className={prodCardClass} />
          <text x={PROD_X + PROD_W / 2} y={38} textAnchor="middle" className={styles.cardEyebrow}>
            {outcome.status === 'reaction'
              ? 'Major product'
              : outcome.status === 'intermediate-only'
                ? 'Next step'
                : 'Outcome'}
          </text>

          {outcome.product && prodGraph ? (
            <g>
              <SkeletalFormula
                graph={prodGraph}
                scale={prodScale}
                x={PROD_X + PROD_W / 2}
                y={MOL_Y}
                highlightAtoms={outcome.product.highlightAtoms}
                highlightBonds={outcome.product.highlightBonds}
              />
              <text x={PROD_X + PROD_W / 2} y={214} textAnchor="middle" className={styles.cardTitle}>
                {outcome.product.iupacName}
              </text>
              <text x={PROD_X + PROD_W / 2} y={236} textAnchor="middle" className={styles.cardSub}>
                {`${outcome.product.formulaUnicode} · ${outcome.degree} alcohol`}
              </text>
              <text x={PROD_X + PROD_W / 2} y={260} textAnchor="middle" className={styles.cardHighlightTag}>
                {outcome.product.newBondLabel}
              </text>
            </g>
          ) : outcome.status === 'intermediate-only' ? (
            <g>
              <rect x={PROD_X + 14} y={96} width={PROD_W - 28} height={70} rx={8} fill="var(--accent-soft)" />
              <text x={PROD_X + PROD_W / 2} y={124} textAnchor="middle" className={styles.cardTitle}>
                Add H₂O in
              </text>
              <text x={PROD_X + PROD_W / 2} y={148} textAnchor="middle" className={styles.cardTitle}>
                Step (ii)
              </text>
              <text x={PROD_X + PROD_W / 2} y={222} textAnchor="middle" className={styles.cardTitle}>
                Hydrolysis pending
              </text>
              <text x={PROD_X + PROD_W / 2} y={248} textAnchor="middle" className={styles.cardSub}>
                {outcome.degree}
              </text>
            </g>
          ) : (
            <g>
              <rect x={PROD_X + 14} y={96} width={PROD_W - 28} height={70} rx={8} fill="var(--caution-soft)" />
              <text x={PROD_X + PROD_W / 2} y={136} textAnchor="middle" className={styles.cardCautionTag}>
                No alcohol formed
              </text>
              <text x={PROD_X + PROD_W / 2} y={222} textAnchor="middle" className={styles.cardTitle}>
                No reaction
              </text>
              <text x={PROD_X + PROD_W / 2} y={248} textAnchor="middle" className={styles.cardSub}>
                Choose stronger route
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className={styles.readoutGrid}>
        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Product IUPAC &amp; formula</span>
          <span className={styles.readoutValue} data-testid="readout-product">
            {outcome.product
              ? `${outcome.product.iupacName} (${outcome.product.formulaUnicode})`
              : outcome.status === 'intermediate-only'
                ? outcome.intermediate.formulaUnicode
                : 'No reaction'}
          </span>
        </div>

        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Alcohol class</span>
          <span className={degreeBadgeClass(outcome.degree)} data-testid="readout-degree">
            {outcome.degree}
          </span>
        </div>

        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Key intermediate</span>
          <span className={styles.readoutValue} data-testid="readout-intermediate">
            {outcome.intermediate.title}
          </span>
        </div>

        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>By-products</span>
          <span className={styles.readoutValue} data-testid="readout-byproducts">
            {outcome.byProducts}
          </span>
        </div>

        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Carbon change (ΔC)</span>
          <span className={styles.readoutValue} data-testid="readout-deltac">
            {outcome.deltaC > 0 ? `+${outcome.deltaC}` : '0'}
          </span>
        </div>
      </div>

      <div className={styles.noteBanner}>
        <span className={`${styles.degreeBadge} ${outcome.status === 'no-reaction' ? styles.badgeCaution : styles.badgeAccent}`}>
          {outcome.regioselectivityTag}
        </span>
        <p className={styles.noteText} data-testid="readout-mechanism">
          {outcome.mechanismNote}
        </p>
        <p className={styles.srOnly} aria-live="polite">
          {outcome.summaryText}
        </p>
      </div>
    </div>
  )
}
