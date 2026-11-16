'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, drawingFrame, subscriptDigits } from '@/components/organic'
import { groupLabel } from '@/components/animations/unit9/directing/directing-steps'
import { attackOutcome, atomsAt, densitySign, directingEntry, PREDICTOR_GROUPS, ringOf, substrateOf, type AttackOutcome, type RingPosition } from '@/lib/chem/directing'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import styles from './orientation-predictor.module.css'

type Kind = 'nitration' | 'bromination' | 'chlorination'

const KINDS: { value: Kind; label: string }[] = [
  { value: 'nitration', label: 'Nitration' },
  { value: 'bromination', label: 'Bromination' },
  { value: 'chlorination', label: 'Chlorination' },
]

/** The electrophile of each kind, as the lib names it (Unit 9 NCERT 9.5.5): its formula with the charge. */
const ELECTROPHILE: Record<Kind, string> = { nitration: 'NO₂⁺', bromination: 'Br⁺', chlorination: 'Cl⁺' }

const SVG_W = 560
const SVG_H = 340
const CX = SVG_W / 2
const CY = SVG_H / 2

/**
 * The largest bond length (up to `maxScale`) at which the drawing, with its label room, fits `maxW` × `maxH`.
 * The partial-charge labels sit outside the ring, so the fit keeps a margin for them.
 */
function fitBounds(g: MolGraph, maxW: number, maxH: number, maxScale: number): number {
  for (let s = maxScale; s >= 30; s -= 4) {
    const b = drawingFrame(g, s).bounds
    if (b.width <= maxW && b.height <= maxH) return s
  }
  return 30
}

/** A formula with its digits as subscripts, C7H7NO2 to C₇H₇NO₂, for text (not for SVG attributes). */
const sub = (formula: string) => formula.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

/** The lib gives a product's formula as its name when it cannot name the product; show the formula then. */
const isFormulaOnly = (name: string, formula: string) => name === formula

/** The unit vector of a point from a centre. */
function outward(p: { x: number; y: number }, c: { x: number; y: number }) {
  const d = Math.hypot(p.x - c.x, p.y - c.y) || 1
  return { x: (p.x - c.x) / d, y: (p.y - c.y) / d }
}

const FONT = 'var(--font-sans)'

const WORD: Record<RingPosition, string> = { ipso: 'the substituted carbon', ortho: 'ortho', meta: 'meta', para: 'para' }

/** A short list such as "ortho and para", from the positions the lib gives. */
function listOf(words: string[]): string {
  return words.length === 2 ? `${words[0]} and ${words[1]}` : words.join(', ')
}

/**
 * The orientation predictor (Section 9.5.6): a monosubstituted benzene, a choice of reaction, and a click on
 * the ring carbon where the electrophile goes. The lib (electrophilicSubstitution) gives the products and
 * their ortho, meta or para positions; the δ signs drawn on the ring follow from the group's NCERT direction.
 */
export function OrientationPredictor() {
  const [group, setGroup] = useState('-OH')
  const [kind, setKind] = useState<Kind>('nitration')
  const [clicked, setClicked] = useState<number | null>(null)

  const graph = useMemo(() => substrateOf(group), [group])
  const scale = useMemo(() => fitBounds(graph, 400, 230, 120), [graph])
  const frame = useMemo(() => drawingFrame(graph, scale), [graph, scale])
  const { ring, ipso } = useMemo(() => ringOf(graph), [graph])
  const entry = directingEntry(group)
  const label = groupLabel(group)
  const directsWord = entry.directs === 'meta' ? 'meta' : 'ortho and para'

  const outcome = useMemo<AttackOutcome | null>(() => {
    if (clicked === null) return null
    return attackOutcome(group, kind, clicked)
  }, [group, kind, clicked])

  // The electron density: a δ sign on each ortho and para carbon (the meta carbons are not labelled).
  const densityMarks = useMemo(
    () => [...atomsAt(graph, 'ortho'), ...atomsAt(graph, 'para')].map((atom) => ({ atom, label: densitySign(group) })),
    [graph, group]
  )

  const positionOfAtom = (atom: number): RingPosition => {
    if (atomsAt(graph, 'ortho').includes(atom)) return 'ortho'
    if (atomsAt(graph, 'meta').includes(atom)) return 'meta'
    return 'para'
  }

  const products = outcome?.reaction.products ?? []
  const productWords = [...new Set(products.map((p) => p.position).filter((p): p is 'ortho' | 'meta' | 'para' => !!p && p !== 'only'))]

  let verdict = `Click a ring carbon, or Tab to one and press Enter, to put ${ELECTROPHILE[kind]} there.`
  if (outcome) {
    const where = WORD[outcome.position ?? 'ipso']
    if (outcome.reachable && outcome.product) {
      const name = isFormulaOnly(outcome.product.name, outcome.product.formula) ? sub(outcome.product.formula) : outcome.product.name
      verdict = `Right: ${label} sends ${ELECTROPHILE[kind]} to the ${where} position. The product is ${name}. ${outcome.why}`
    } else {
      verdict = `Not quite: ${label} sends the attack to the ${listOf(productWords.map((w) => WORD[w]))} positions, not the ${where} position. ${outcome.why}`
    }
  }

  return (
    <div className={styles.predictor} data-testid="orientation-predictor" data-group={group} data-kind={kind}>
      <div className={styles.layout}>
        <figure className={styles.stage} style={{ margin: 0 }}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label={`${label} on benzene, with the ring carbons to choose from`} className={styles.drawing} data-testid="predictor-drawing">
            <SkeletalFormula graph={graph} scale={scale} x={CX} y={CY} />
            {densityMarks.map((m) => {
              const p = frame.points[m.atom]
              const u = outward(p, frame.ringCentres[0] ?? { x: 0, y: 0 })
              const lx = CX + p.x + u.x * 0.62 * scale
              const ly = CY + p.y + u.y * 0.62 * scale
              return (
                <text key={m.atom} x={lx} y={ly + 6} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={FONT} fill="var(--fg)" className={styles.delta} data-testid="density-label">
                  <tspan className="sym">δ</tspan>
                  {m.label === 'δ−' ? '−' : '+'}
                </text>
              )
            })}
            {ring
              .filter((a) => a !== ipso)
              .map((atom) => {
                const p = frame.points[atom]
                const chosen = clicked === atom
                const pos = positionOfAtom(atom)
                return (
                  <g
                    key={atom}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ring carbon ${WORD[pos]} to ${label}`}
                    aria-pressed={chosen}
                    className={styles.hit}
                    onClick={() => setClicked(atom)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setClicked(atom)
                      }
                    }}
                  >
                    <circle cx={CX + p.x} cy={CY + p.y} r={30} className={chosen ? styles.hitChosen : styles.hitOpen} />
                  </g>
                )
              })}
          </svg>
        </figure>

        <section className={styles.panel} aria-label="Choose the group and the reaction">
          <h2 className={styles.title}>
            {label} on benzene <span className={styles.formula}>({sub(molecularFormula(graph))})</span>
          </h2>
          <p className={styles.kindLine}>
            {entry.effect === 'activating' ? 'Activating' : 'Deactivating'}, directs to the {directsWord} carbons
          </p>
          <p className={styles.heading} id="substituent-label">
            Substituent
          </p>
          <div className={styles.groups} role="group" aria-labelledby="substituent-label">
            {PREDICTOR_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                className={styles.groupBtn}
                aria-pressed={group === g}
                onClick={() => {
                  setGroup(g)
                  setClicked(null)
                }}
              >
                {groupLabel(g)}
              </button>
            ))}
          </div>
          <p className={styles.heading} id="kind-label">
            Reaction
          </p>
          <Segmented
            label="Reaction"
            options={KINDS}
            value={kind}
            onChange={(k) => {
              setKind(k)
              setClicked(null)
            }}
          />
          <p className={styles.readout} role="status" data-testid="predictor-readout">
            {verdict}
          </p>
          {outcome && products.length > 0 && (
            <ul className={styles.products} data-testid="predictor-products">
              {products.map((p) => (
                <li key={`${p.position}-${p.name}`}>
                  <span className={styles.posTag}>{p.position}</span>
                  {isFormulaOnly(p.name, p.formula) ? sub(p.formula) : p.name}
                </li>
              ))}
            </ul>
          )}
          <Button type="button" onClick={() => setClicked(null)} disabled={clicked === null}>
            Clear the choice
          </Button>
        </section>
      </div>
      <p className={styles.srOnly} aria-live="polite">
        {verdict}
      </p>
      <SimulationControls>
        <p className={styles.footer}>
          {label} · {ELECTROPHILE[kind]} · NCERT 9.5.6: {directsWord} positions
        </p>
      </SimulationControls>
    </div>
  )
}
