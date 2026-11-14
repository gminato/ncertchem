'use client'

import { Label, ParticleBox, VocabDefs } from '@/components/vocab'
import { useTweenedValues } from './useTweenedValues'
import {
  MATTER_BOX,
  MATTER_SCENES,
  MATTER_STEP_FOCUS,
  MATTER_TREE,
  ancestorsOf,
  clampMatterStep,
} from './matter-scenes'
import styles from './unit1.module.css'

export interface MatterClassificationProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 640
const VIEW_H = 540
const DEFS = 'matter'

const BOX = { x: 20, y: 60 }
const CAPTION_TITLE_Y = 452
const CAPTION_SUB_Y = 480

const TREE_HEAD = { x: 404, y: 58 }
const TREE_ROW0_Y = 96
const TREE_ROW_GAP = 50
const TREE_X0 = 404
const TREE_INDENT = 24
const PILL_H = 30
const CHAR_W = 9
const PILL_PAD = 28

const rowY = (index: number) => TREE_ROW0_Y + index * TREE_ROW_GAP
const nodeX = (depth: number) => TREE_X0 + depth * TREE_INDENT
const pillWidth = (label: string) => label.length * CHAR_W + PILL_PAD

/**
 * Six Steps of the classification of matter. A particle box in the middle-left
 * holds each kind of sample, and a tree on the right grows one branch per Step.
 * The scenes cross-fade; the tree nodes fade in as they are revealed.
 */
export function MatterClassification({ step, reducedMotion }: MatterClassificationProps) {
  const active = clampMatterStep(step)
  const sceneOpacity = useTweenedValues(
    MATTER_SCENES.map((_, i) => (i === active ? 1 : 0)),
    reducedMotion
  )
  const nodeOpacity = useTweenedValues(
    MATTER_TREE.map((node) => (active >= node.reveal ? 1 : 0)),
    reducedMotion
  )

  const focus = MATTER_STEP_FOCUS[active]
  const ancestors = new Set(ancestorsOf(focus))
  const scene = MATTER_SCENES[active]

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role="img"
        aria-label={`${scene.title}. ${scene.description}`}
        data-testid="matter-classification"
        data-step={active}
      >
        <VocabDefs idPrefix={DEFS} />
        <rect
          x={14}
          y={14}
          width={VIEW_W - 28}
          height={VIEW_H - 28}
          rx={18}
          style={{ fill: 'var(--surface-raised)', stroke: 'var(--border)' }}
        />

        {/* Particle boxes: one per Step, cross-faded */}
        {MATTER_SCENES.map((item, i) => (
          <g key={`scene-${i}`} opacity={sceneOpacity[i]}>
            <ParticleBox
              items={item.items}
              x={BOX.x}
              y={BOX.y}
              width={MATTER_BOX.width}
              height={MATTER_BOX.height}
              radius={16}
              defsPrefix={DEFS}
            />
            <Label x={BOX.x + MATTER_BOX.width / 2} y={CAPTION_TITLE_Y} fontSize={20} fill="var(--fg)">
              {item.title}
            </Label>
            <Label x={BOX.x + MATTER_BOX.width / 2} y={CAPTION_SUB_Y} fontSize={15} halo>
              {item.caption}
            </Label>
          </g>
        ))}

        {/* Classification tree */}
        <Label x={TREE_HEAD.x} y={TREE_HEAD.y} textAnchor="start" fontSize={15} fill="var(--fg-subtle)">
          Classification
        </Label>
        {MATTER_TREE.map((node, i) => {
          const y = rowY(i)
          const x = nodeX(node.depth)
          const isFocus = i === focus
          const isAncestor = ancestors.has(i)
          const width = pillWidth(node.label)
          const parent = node.parent >= 0 ? MATTER_TREE[node.parent] : null
          const parentIndex = node.parent
          return (
            <g key={node.id} opacity={nodeOpacity[i]} data-node={node.id}>
              {parent && (
                <path
                  d={`M${nodeX(parent.depth) + 10},${rowY(parentIndex) + PILL_H / 2} V${y} H${x - 2}`}
                  fill="none"
                  strokeWidth={1.4}
                  style={{ stroke: 'var(--fg-subtle)' }}
                />
              )}
              <rect
                x={x}
                y={y - PILL_H / 2}
                width={width}
                height={PILL_H}
                rx={PILL_H / 2}
                strokeWidth={isFocus ? 1.6 : 1}
                style={{
                  fill: isFocus ? 'var(--accent-soft)' : 'var(--surface)',
                  stroke: isFocus ? 'var(--accent)' : isAncestor ? 'var(--fg-subtle)' : 'var(--border)',
                }}
              />
              <Label
                x={x + 12}
                y={y}
                textAnchor="start"
                fontSize={15}
                fontWeight={isFocus ? 600 : 400}
                fill={isFocus ? 'var(--accent)' : isAncestor ? 'var(--fg)' : 'var(--fg-muted)'}
              >
                {node.label}
              </Label>
            </g>
          )
        })}
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {scene.description}
      </p>
    </div>
  )
}
