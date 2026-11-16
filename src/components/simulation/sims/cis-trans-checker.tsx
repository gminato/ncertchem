'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { IsomerDrawing } from '@/components/animations/unit9/alkene-structure/alkene-draw'
import {
  GROUPS,
  GROUP_LABEL,
  arrange,
  geometricIsomers,
  netDipole,
  type Group,
} from '@/lib/chem/alkene-geometry'
import styles from './cis-trans-checker.module.css'

type Pair = [Group, Group]
type Guess = 'two' | 'one'

interface Preset {
  label: string
  left: Pair
  right: Pair
}

/** Starting points: the Learner can change any group, these only save the first clicks. */
const PRESETS: readonly Preset[] = [
  { label: 'But-2-ene', left: ['CH3', 'H'], right: ['CH3', 'H'] },
  { label: '1,2-Dichloroethene', left: ['Cl', 'H'], right: ['Cl', 'H'] },
  { label: '2-Methylpropene', left: ['CH3', 'CH3'], right: ['H', 'H'] },
  { label: '1-Chloroprop-1-ene', left: ['CH3', 'H'], right: ['Cl', 'H'] },
]

const GROUP_NAMES: Record<Group, string> = {
  H: 'hydrogen',
  CH3: 'methyl',
  C2H5: 'ethyl',
  Cl: 'chlorine',
  Br: 'bromine',
  COOH: 'carboxyl',
}

const GROUP_VIEW = 290

/** One select for a group on one carbon of the double bond. */
function GroupSelect({ id, label, value, onChange }: { id: string; label: string; value: Group; onChange: (g: Group) => void }) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.fieldLabel}>{label}</span>
      <select id={id} className={styles.select} value={value} onChange={(e) => onChange(e.target.value as Group)}>
        {GROUPS.map((g) => (
          <option key={g} value={g}>
            {GROUP_LABEL[g]} ({GROUP_NAMES[g]})
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Cis-trans checker: the Learner chooses the two groups on each carbon of a C=C, predicts whether
 * geometrical isomers exist, and then the lib decides, names each isomer, and draws its net dipole.
 */
export function CisTransChecker({ reducedMotion }: SimulationProps) {
  void reducedMotion
  const uid = useId().replace(/:/g, '')
  const tip = `${uid}-tip`
  const [left, setLeft] = useState<Pair>(['CH3', 'H'])
  const [right, setRight] = useState<Pair>(['CH3', 'H'])
  const [guess, setGuess] = useState<Guess | null>(null)

  const verdict = geometricIsomers(left, right)
  const pairText = (pair: Pair) => pair.map((g) => GROUP_LABEL[g]).join(' and ')

  const setLeftAt = (k: 0 | 1, g: Group) => {
    setLeft((p) => (k === 0 ? [g, p[1]] : [p[0], g]))
    setGuess(null)
  }
  const setRightAt = (k: 0 | 1, g: Group) => {
    setRight((p) => (k === 0 ? [g, p[1]] : [p[0], g]))
    setGuess(null)
  }
  const applyPreset = (p: Preset) => {
    setLeft(p.left)
    setRight(p.right)
    setGuess(null)
  }

  const revealed = guess !== null
  const correct = guess !== null && (guess === 'two') === verdict.exists
  const summary = revealed
    ? verdict.exists
      ? `Left carbon ${pairText(left)}; right carbon ${pairText(right)}. Two geometrical isomers: ${verdict.isomers
          .map((i) => i.name)
          .join(' and ')}. ${verdict.isomers.map((i) => (i.polar ? `${i.name} is polar` : `${i.name} is non-polar`)).join('; ')}.`
      : `Left carbon ${pairText(left)}; right carbon ${pairText(right)}. One arrangement only. ${verdict.reason}`
    : `Left carbon ${pairText(left)}; right carbon ${pairText(right)}. Predict how many isomers there are.`

  // The single arrangement drawn when the groups do not allow geometrical isomers.
  const single = arrange(left, right, left[0], right[0])
  const singleDipole = netDipole(single)

  return (
    <div className={styles.checker}>
      <div className={styles.layout}>
        <div className={styles.main}>
        <figure className={styles.stage}>
          <svg viewBox="0 0 580 330" role="img" aria-label={summary} data-testid="cis-trans-drawing">
            <defs>
              <marker id={tip} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dipole)" />
              </marker>
            </defs>
            {!revealed && (
              <text x={GROUP_VIEW} y={165} textAnchor="middle" fontSize={18} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                Choose the groups, then predict.
              </text>
            )}
            {revealed && verdict.exists && (
              <>
                <IsomerDrawing
                  placed={verdict.isomers[0].placed}
                  dipole={verdict.isomers[0].dipole}
                  polar={verdict.isomers[0].polar}
                  title={verdict.isomers[0].name}
                  note={verdict.isomers[0].polar ? 'net dipole: arrow from δ+ to δ−' : 'no net dipole: the bond dipoles cancel'}
                  cx={160}
                  cy={118}
                  tipId={tip}
                />
                <IsomerDrawing
                  placed={verdict.isomers[1].placed}
                  dipole={verdict.isomers[1].dipole}
                  polar={verdict.isomers[1].polar}
                  title={verdict.isomers[1].name}
                  note={verdict.isomers[1].polar ? 'net dipole: arrow from δ+ to δ−' : 'no net dipole: the bond dipoles cancel'}
                  cx={420}
                  cy={118}
                  tipId={tip}
                />
              </>
            )}
            {revealed && !verdict.exists && (
              <IsomerDrawing
                placed={single}
                dipole={singleDipole}
                polar={Math.hypot(singleDipole.x, singleDipole.y) > 0.05}
                title="One arrangement only"
                note={left[0] === left[1] ? `left carbon: two ${GROUP_LABEL[left[0]]}` : `right carbon: two ${GROUP_LABEL[right[0]]}`}
                cx={GROUP_VIEW}
                cy={118}
                tipId={tip}
              />
            )}
          </svg>
          <figcaption className={styles.caption}>
            {revealed && verdict.exists ? 'Both arrangements are shown with their net dipoles (qualitative).' : 'Turn the groups over: the drawing shows the arrangements only after you predict.'}
          </figcaption>
        </figure>

                  <div className={styles.predict} role="group" aria-label="Predict the number of geometrical isomers">
          <p className={styles.question}>How many geometrical isomers does this alkene have?</p>
          <div className={styles.predictButtons}>
            <Button variant={guess === 'two' ? 'primary' : 'secondary'} onClick={() => setGuess('two')} aria-pressed={guess === 'two'}>
              Two
            </Button>
            <Button variant={guess === 'one' ? 'primary' : 'secondary'} onClick={() => setGuess('one')} aria-pressed={guess === 'one'}>
              Only one
            </Button>
          </div>
          {revealed && (
            <p className={styles.verdict} data-testid="cis-trans-verdict" data-correct={correct ? 'yes' : 'no'}>
              {correct ? 'Your prediction matches. ' : 'Not this time. '}
              {verdict.reason}
            </p>
          )}
        </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.presets} role="group" aria-label="Presets">
            {PRESETS.map((p) => (
              <Button key={p.label} variant="secondary" onClick={() => applyPreset(p)}>
                {p.label}
              </Button>
            ))}
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Left carbon of the C=C</legend>
            <GroupSelect id={`${uid}-l0`} label="Group 1" value={left[0]} onChange={(g) => setLeftAt(0, g)} />
            <GroupSelect id={`${uid}-l1`} label="Group 2" value={left[1]} onChange={(g) => setLeftAt(1, g)} />
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Right carbon of the C=C</legend>
            <GroupSelect id={`${uid}-r0`} label="Group 1" value={right[0]} onChange={(g) => setRightAt(0, g)} />
            <GroupSelect id={`${uid}-r1`} label="Group 2" value={right[1]} onChange={(g) => setRightAt(1, g)} />
          </fieldset>

        </div>
      </div>
      <p className={styles.srOnly} aria-live="polite" data-testid="cis-trans-live">
        {summary}
      </p>
    </div>
  )
}
