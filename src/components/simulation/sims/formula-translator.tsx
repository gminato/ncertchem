'use client'

import { useId, useMemo, useState } from 'react'
import { Button, NumberField } from '@/components/controls'
import {
  SkeletalFormula,
  StructuralFormula,
  condensedAtoms,
  elementColour,
  skeletalBounds,
  subscriptDigits,
} from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  TRANSLATOR_PRESETS,
  carbonHydrogenCounts,
  groupMembership,
  hasRing,
  parseTranslatorInput,
} from '@/lib/chem/formula-translator'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { iupacName } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { orthogonalComplete, type OrthogonalLayout } from './formula-translator-layout'
import styles from './formula-translator.module.css'

/** Pixels per bond in the bond-line panel. */
const SKELETAL_SCALE = 44
/** Padding around the drawings, in pixels. */
const PAD = 14

/** A formula with real subscripts, e.g. C₆H₁₄O. */
const sub = (text: string) => text.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

/** The lib's IUPAC name, or a plain phrase when the naming scope does not cover the molecule. */
function nameOf(g: MolGraph): string {
  try {
    return iupacName(g)
  } catch {
    return 'name not in the naming scope'
  }
}

/** Pixels per grid unit of the orthogonal complete formula. */
const UNIT = 46
/** Gap kept between a bond's end and an atom's letter, in grid units. */
const LABEL_GAP = 0.3

/**
 * The complete structural formula of an open chain, drawn on the orthogonal grid from
 * formula-translator-layout: every hydrogen and every bond is a line, and the highlighted atoms get
 * a disc behind them.
 */
function OrthogonalComplete({ layout, highlighted, label }: { layout: OrthogonalLayout; highlighted: Set<number>; label: (a: number) => string }) {
  const pt = (x: number, y: number) => ({ x: x * UNIT, y: y * UNIT })
  const posOf = new Map<number, { x: number; y: number }>()
  layout.heavy.forEach((h) => posOf.set(h.atom, { x: h.x, y: h.y }))
  const hPos = layout.hydrogens.map((h) => ({ parent: h.parent, x: h.x, y: h.y }))
  const segment = (p: { x: number; y: number }, q: { x: number; y: number }, offset: number) => {
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    const nx = -uy * offset
    const ny = ux * offset
    const gap = LABEL_GAP * UNIT
    return {
      x1: p.x * UNIT + ux * gap + nx,
      y1: p.y * UNIT + uy * gap + ny,
      x2: q.x * UNIT - ux * gap + nx,
      y2: q.y * UNIT - uy * gap + ny,
    }
  }
  const lines: { key: string; seg: ReturnType<typeof segment> }[] = []
  for (const b of layout.bonds) {
    const p = posOf.get(b.a)!
    const q = posOf.get(b.b)!
    const spread = b.order === 2 ? 0.1 : b.order === 3 ? 0.14 : 0
    const offsets = b.order === 1 ? [0] : b.order === 2 ? [-spread, spread] : [-spread, 0, spread]
    offsets.forEach((o, i) => lines.push({ key: `b${b.a}-${b.b}-${i}`, seg: segment(p, q, o) }))
  }
  for (const h of hPos) {
    lines.push({ key: `h${h.parent}-${h.x}-${h.y}`, seg: segment(posOf.get(h.parent)!, { x: h.x, y: h.y }, 0) })
  }
  const pad = 0.9 * UNIT
  const x0 = layout.minX * UNIT - pad
  const y0 = layout.minY * UNIT - pad
  const w = (layout.maxX - layout.minX) * UNIT + 2 * pad
  const h = (layout.maxY - layout.minY) * UNIT + 2 * pad
  return (
    <svg viewBox={`${x0} ${y0} ${w} ${h}`} role="img" aria-label="Complete structural formula" className={styles.drawing}>
        {[...highlighted].map((a) => {
          const p = posOf.get(a)
          return p ? <circle key={`hl-${a}`} cx={p.x * UNIT} cy={p.y * UNIT} r={0.42 * UNIT} fill="var(--highlight)" /> : null
        })}
        {hPos.map((hh, k) =>
          highlighted.has(hh.parent) ? <circle key={`hh-${k}`} cx={hh.x * UNIT} cy={hh.y * UNIT} r={0.36 * UNIT} fill="var(--highlight)" /> : null
        )}
        {lines.map((l) => (
          <line key={l.key} x1={l.seg.x1} y1={l.seg.y1} x2={l.seg.x2} y2={l.seg.y2} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
        ))}
        {layout.heavy.map((hv) => (
          <text
            key={`t${hv.atom}`}
            x={hv.x * UNIT}
            y={hv.y * UNIT}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={20}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill={label(hv.atom) === 'C' ? 'var(--fg)' : elementColour(label(hv.atom))}
            style={{ userSelect: 'none' }}
          >
            {label(hv.atom)}
          </text>
        ))}
        {hPos.map((hh, k) => (
          <text
            key={`ht${k}`}
            x={hh.x * UNIT}
            y={hh.y * UNIT}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={18}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            H
          </text>
        ))}
      </svg>
  )
}

/** The condensed line as text: each chain atom's label with its single-carbon branches in brackets. */
function condensedSegments(g: MolGraph) {
  return condensedAtoms(g).map((c) => ({
    text: [c.text, ...c.above.map((s) => `(${s})`), ...c.below.map((s) => `(${s})`)].join(''),
    atom: c.atom,
  }))
}

/**
 * Formula translator (Section 8.3): one molecule in its complete, condensed and bond-line forms,
 * side by side. Picking a group (a chain carbon with the atoms hanging from it) highlights the same
 * atoms in all three forms. A quiz mode shows a bond-line drawing and checks the carbon and
 * hydrogen counts against the graph.
 */
export function FormulaTranslator(_props: SimulationProps) {
  const [smiles, setSmiles] = useState(TRANSLATOR_PRESETS[0].smiles)
  const [draft, setDraft] = useState(TRANSLATOR_PRESETS[0].smiles)
  const [inputError, setInputError] = useState<string | null>(null)
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore')
  const [picked, setPicked] = useState<number[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizC, setQuizC] = useState(0)
  const [quizH, setQuizH] = useState(0)
  const [quizChecked, setQuizChecked] = useState<null | { c: boolean; h: boolean }>(null)
  const uid = useId()

  const graph = useMemo(() => parseSmiles(smiles), [smiles])
  const ring = hasRing(graph)
  const segments = useMemo(() => (ring ? [] : condensedSegments(graph)), [graph, ring])
  const groups = useMemo(
    () => (ring ? [] : groupMembership(graph, segments.map((s) => s.atom))),
    [graph, ring, segments]
  )
  const highlighted = useMemo(() => new Set(picked.flatMap((k) => groups[k] ?? [])), [picked, groups])
  const name = useMemo(() => nameOf(graph), [graph])
  const formula = useMemo(() => molecularFormula(graph), [graph])
  const orthogonal = useMemo(
    () => (ring ? null : orthogonalComplete(graph, segments.map((x) => x.atom))),
    [graph, ring, segments]
  )
  const bounds = useMemo(() => skeletalBounds(graph, SKELETAL_SCALE), [graph])

  const quizPreset = TRANSLATOR_PRESETS[quizIndex % TRANSLATOR_PRESETS.length]
  const quizGraph = useMemo(() => parseSmiles(quizPreset.smiles), [quizPreset])
  const quizCounts = useMemo(() => carbonHydrogenCounts(quizGraph), [quizGraph])
  const quizBounds = useMemo(() => skeletalBounds(quizGraph, SKELETAL_SCALE), [quizGraph])

  const apply = (text: string) => {
    const parsed = parseTranslatorInput(text)
    if (!parsed.ok) {
      setInputError(parsed.message)
      return
    }
    setInputError(null)
    setSmiles(text.trim())
    setPicked([])
  }

  const toggle = (k: number) => setPicked((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))

  // What the readout says about the picked groups. Counts come from the graph.
  const counts = (() => {
    const atoms = [...highlighted]
    const carbons = atoms.filter((i) => graph.atoms[i].element === 'C').length
    const others = atoms.filter((i) => graph.atoms[i].element !== 'C')
    const hydrogens = atoms.reduce((s, i) => s + (graph.atoms[i].hCount ?? 0), 0)
    return { carbons, others: others.length, hydrogens }
  })()
  const readout = ring
    ? `${sub(formula)}: a ring. The complete and bond-line forms are drawn; a condensed line is not written for rings.`
    : picked.length === 0
      ? `${sub(formula)}: pick one or more groups to see the same atoms in all three forms.`
      : `${picked.length} group${picked.length === 1 ? '' : 's'} highlighted: ${counts.carbons} carbon${counts.carbons === 1 ? '' : 's'}, ${counts.others} other heavy atom${counts.others === 1 ? '' : 's'} and ${counts.hydrogens} hydrogen${counts.hydrogens === 1 ? '' : 's'}.`

  const quizCorrect = quizChecked ? quizChecked.c && quizChecked.h : false
  const quizMessage = quizChecked === null
    ? 'Count the carbon and hydrogen atoms in the drawing, then check.'
    : quizCorrect
      ? `Correct: ${sub(molecularFormula(quizGraph))}. ${quizCounts.carbons} carbons and ${quizCounts.hydrogens} hydrogens.`
      : `${quizChecked.c ? 'Carbons: right.' : `Carbons: ${quizC} is not the count. Count each corner and line end again.`} ${quizChecked.h ? 'Hydrogens: right.' : `Hydrogens: ${quizH} is not the count. Each carbon needs four bonds in total, so count the hydrogens it needs.`}`

  return (
    <div className={styles.sim} data-testid="formula-translator" data-mode={mode}>
      <SimulationControls>
        <div role="group" aria-label="Mode" className={styles.row}>
          <Button variant={mode === 'explore' ? 'primary' : 'secondary'} aria-pressed={mode === 'explore'} onClick={() => setMode('explore')}>
            Explore
          </Button>
          <Button variant={mode === 'quiz' ? 'primary' : 'secondary'} aria-pressed={mode === 'quiz'} onClick={() => setMode('quiz')}>
            Quiz
          </Button>
        </div>
      </SimulationControls>

      {mode === 'explore' ? (
        <>
          <div className={styles.presets} role="group" aria-label="Presets">
            {TRANSLATOR_PRESETS.map((p) => {
              const g = parseSmiles(p.smiles)
              const on = p.smiles === smiles
              return (
                <Button
                  key={p.id}
                  variant={on ? 'primary' : 'secondary'}
                  aria-pressed={on}
                  onClick={() => {
                    setDraft(p.smiles)
                    apply(p.smiles)
                  }}
                >
                  {nameOf(g)}
                </Button>
              )
            })}
          </div>

          <form
            className={styles.typed}
            onSubmit={(e) => {
              e.preventDefault()
              apply(draft)
            }}
          >
            <label htmlFor={`${uid}-smiles`} className={styles.label}>
              Or type a SMILES string
            </label>
            <div className={styles.typedRow}>
              <input
                id={`${uid}-smiles`}
                className={styles.input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={inputError ? true : undefined}
                aria-describedby={inputError ? `${uid}-error` : undefined}
              />
              <Button type="submit" variant="secondary">
                Draw
              </Button>
            </div>
            {inputError ? (
              <p id={`${uid}-error`} className={styles.error} role="alert">
                {inputError}
              </p>
            ) : null}
          </form>

          <p className={styles.readout} aria-live="polite" data-testid="translator-readout">
            <strong>{name}</strong>. {readout}
          </p>

          {!ring ? (
            <div className={styles.groups} role="group" aria-label="Atom groups">
              {segments.map((s, k) => (
                <Button
                  key={`${s.atom}-${k}`}
                  variant={picked.includes(k) ? 'primary' : 'secondary'}
                  aria-pressed={picked.includes(k)}
                  aria-label={`Group ${k + 1}, ${s.text}`}
                  onClick={() => toggle(k)}
                >
                  {`${k + 1}: ${s.text}`}
                </Button>
              ))}
              <Button variant="secondary" onClick={() => setPicked([])} disabled={picked.length === 0}>
                Clear
              </Button>
            </div>
          ) : null}

          <div className={styles.panels}>
            <section className={styles.panel} aria-label="Complete structural formula">
              <h4 className={styles.panelTitle}>Complete</h4>
              {orthogonal ? (
                <OrthogonalComplete layout={orthogonal} highlighted={highlighted} label={(a) => graph.atoms[a].element} />
              ) : (
                <svg viewBox="-200 -120 400 240" role="img" aria-label={`Complete structural formula of ${name}`} className={styles.drawing}>
                  <StructuralFormula graph={graph} mode="complete" />
                </svg>
              )}
            </section>

            <section className={styles.panel} aria-label="Condensed structural formula">
              <h4 className={styles.panelTitle}>Condensed</h4>
              <div className={styles.condensed} data-testid="translator-condensed">
                {ring ? (
                  <p className={styles.note}>A ring has no condensed line here. Its bond-line form is drawn beside it.</p>
                ) : (
                  <p className={styles.line}>
                    {segments.map((s, k) => (
                      <span key={`seg-${k}`}>
                        {k > 0 ? ' ' : null}
                        <span className={picked.includes(k) ? styles.segOn : styles.seg} data-group={k + 1}>
                          {sub(s.text)}
                        </span>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </section>

            <section className={styles.panel} aria-label="Bond-line structural formula">
              <h4 className={styles.panelTitle}>Bond-line</h4>
              <svg
                viewBox={`${bounds.x - PAD} ${bounds.y - PAD} ${bounds.width + 2 * PAD} ${bounds.height + 2 * PAD}`}
                role="img"
                aria-label={`Bond-line formula of ${name}`}
                className={styles.drawing}
              >
                <SkeletalFormula graph={graph} scale={SKELETAL_SCALE} highlightAtoms={[...highlighted]} />
              </svg>
            </section>
          </div>
        </>
      ) : (
        <div className={styles.quiz}>
          <div className={styles.quizDrawing}>
            <svg
              viewBox={`${quizBounds.x - PAD} ${quizBounds.y - PAD} ${quizBounds.width + 2 * PAD} ${quizBounds.height + 2 * PAD}`}
              role="img"
              aria-label="Bond-line drawing of the quiz molecule"
              className={styles.drawing}
              data-testid="quiz-drawing"
            >
              <SkeletalFormula graph={quizGraph} scale={SKELETAL_SCALE} />
            </svg>
          </div>
          <div className={styles.quizForm}>
            <p className={styles.quizPrompt}>
              How many carbon and hydrogen atoms does this bond-line drawing contain? Remember that each carbon needs four bonds in total.
            </p>
            <div className={styles.numbers}>
              <NumberField label="Carbon atoms" value={quizC} onChange={(v) => setQuizC(v)} min={0} max={40} step={1} precision={0} />
              <NumberField label="Hydrogen atoms" value={quizH} onChange={(v) => setQuizH(v)} min={0} max={80} step={1} precision={0} />
            </div>
            <div className={styles.row}>
              <Button
                variant="primary"
                onClick={() => setQuizChecked({ c: quizC === quizCounts.carbons, h: quizH === quizCounts.hydrogens })}
              >
                Check
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuizIndex((i) => i + 1)
                  setQuizChecked(null)
                  setQuizC(0)
                  setQuizH(0)
                }}
              >
                Next molecule
              </Button>
            </div>
            <p className={styles.readout} aria-live="polite" data-testid="quiz-feedback">
              {quizMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
