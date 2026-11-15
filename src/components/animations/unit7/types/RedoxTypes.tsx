'use client'

import React from 'react'
import { ONLadder } from '@/components/redox/ONLadder'
import { OxidationTag } from '@/components/redox/OxidationTag'
import { formatTrueMinus } from '@/components/redox/geometry'
import { getRedoxTypeStep } from './types-steps'
import styles from './types.module.css'

export interface RedoxTypesProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440

export function RedoxTypes({ step }: RedoxTypesProps) {
  const stepData = getRedoxTypeStep(step)
  const isStructure = stepData.isStructureStep ?? false

  return (
    <div className={styles.container}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svgRoot}
        role="img"
        aria-label={`${stepData.title}: ${stepData.reactionDisplay}`}
        data-testid="redox-types"
        data-step={stepData.stepIndex}
      >
        <defs>
          <linearGradient id="panel-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--surface-raised)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--surface)" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Outer subtle boundary card */}
        <rect
          x={12}
          y={10}
          width={VIEW_WIDTH - 24}
          height={VIEW_HEIGHT - 20}
          rx={12}
          fill="url(#panel-glow)"
          stroke="var(--border)"
          strokeWidth={1.2}
        />

        {/* Header bar: Step Category & Reaction */}
        <g transform="translate(24, 32)">
          <text
            x={0}
            y={0}
            className={styles.headerTitle}
            dominantBaseline="central"
          >
            {stepData.title}
          </text>
          <text
            x={VIEW_WIDTH - 48}
            y={0}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={14}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
          >
            {formatTrueMinus(stepData.reactionDisplay)}
          </text>
        </g>

        {/* Divider */}
        <line
          x1={24}
          y1={46}
          x2={VIEW_WIDTH - 24}
          y2={46}
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* Content Area */}
        {!isStructure ? (
          <g>
            {/* Oxidation Number Ladder on Left (x: 15 to 375) */}
            <g transform="translate(15, 48)">
              <ONLadder
                range={stepData.ladderRange}
                species={stepData.species}
                transitions={stepData.transitions}
                progress={1}
                title={stepData.title}
              />
            </g>

            {/* Right Summary Card for Oxidation Tags (x: 382 to 556) */}
            <g transform="translate(382, 58)">
              <rect
                x={0}
                y={0}
                width={174}
                height={336}
                rx={8}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={1}
              />

              {/* Title */}
              <text
                x={87}
                y={20}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
                letterSpacing="0.04em"
              >
                OXIDATION STATES
              </text>

              <line x1={12} y1={30} x2={162} y2={30} stroke="var(--border)" strokeWidth={0.8} />

              {/* Reactants Header */}
              <text
                x={14}
                y={46}
                fontSize={12}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
              >
                Reactants:
              </text>

              {/* Reactant Tags */}
              <g transform="translate(14, 56)">
                {stepData.reactantTags.map((tagItem, idx) => (
                  <g key={tagItem.formula} transform={`translate(0, ${idx * 60})`}>
                    <OxidationTag
                      formula={tagItem.formula}
                      charge={tagItem.charge}
                      tags={tagItem.tags}
                      fontSize={16}
                    />
                  </g>
                ))}
              </g>

              {/* Products Header */}
              {stepData.productTags.length > 0 && (
                <>
                  <line
                    x1={12}
                    y1={180}
                    x2={162}
                    y2={180}
                    stroke="var(--border)"
                    strokeWidth={0.8}
                  />
                  <text
                    x={14}
                    y={196}
                    fontSize={12}
                    fontWeight={600}
                    fontFamily="var(--font-sans)"
                    fill="var(--fg-muted)"
                  >
                    Products:
                  </text>

                  {/* Product Tags */}
                  <g transform="translate(14, 206)">
                    {stepData.productTags.map((tagItem, idx) => (
                      <g key={tagItem.formula} transform={`translate(0, ${idx * 60})`}>
                        <OxidationTag
                          formula={tagItem.formula}
                          charge={tagItem.charge}
                          tags={tagItem.tags}
                          fontSize={16}
                        />
                      </g>
                    ))}
                  </g>
                </>
              )}
            </g>

            {/* Contrast / Clarification Footer Note at Bottom (x: 24 to 556) */}
            {stepData.contrastNote && (
              <g transform="translate(24, 404)">
                <rect
                  x={0}
                  y={0}
                  width={VIEW_WIDTH - 48}
                  height={24}
                  rx={6}
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <circle cx={14} cy={12} r={4} fill="var(--primary, #3b82f6)" />
                <text
                  x={26}
                  y={13}
                  dominantBaseline="central"
                  fontSize={13}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg-muted)"
                >
                  {formatTrueMinus(stepData.contrastNote)}
                </text>
              </g>
            )}
          </g>
        ) : (
          /* Step 5: Tetrathionate Ion Structure Drawing */
          <g transform="translate(24, 56)">
            {/* Subheading */}
            <text
              x={0}
              y={12}
              fontSize={14}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              Real per-atom oxidation states in tetrathionate ion [O₃S−S−S−SO₃]²⁻:
            </text>

            {/* S4O6^2- Molecule Display */}
            {/* Bonds between sulfurs */}
            {/* S1-S2 bond */}
            <line x1={155} y1={130} x2={215} y2={130} stroke="var(--border)" strokeWidth={3} />
            {/* S2-S3 bond (homonuclear, highlighted) */}
            <line
              x1={245}
              y1={130}
              x2={285}
              y2={130}
              stroke="var(--primary, #3b82f6)"
              strokeWidth={3.5}
            />
            {/* S3-S4 bond */}
            <line x1={315} y1={130} x2={375} y2={130} stroke="var(--border)" strokeWidth={3} />

            {/* Terminal S1 Oxygens */}
            {/* Top O (double bond) */}
            <line x1={136} y1={115} x2={106} y2={75} stroke="var(--border)" strokeWidth={2.5} />
            <line x1={144} y1={111} x2={114} y2={71} stroke="var(--border)" strokeWidth={2.5} />
            <circle cx={100} cy={66} r={16} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={100} y={67} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--fg)">O</text>
            <text x={100} y={40} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--fg-muted)">−2</text>

            {/* Bottom O (double bond) */}
            <line x1={136} y1={145} x2={106} y2={185} stroke="var(--border)" strokeWidth={2.5} />
            <line x1={144} y1={149} x2={114} y2={189} stroke="var(--border)" strokeWidth={2.5} />
            <circle cx={100} cy={195} r={16} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={100} y={196} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--fg)">O</text>
            <text x={100} y={222} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--fg-muted)">−2</text>

            {/* Left O- (single bond) */}
            <line x1={125} y1={130} x2={75} y2={130} stroke="var(--border)" strokeWidth={2.5} />
            <circle cx={60} cy={130} r={16} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={60} y={131} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--fg)">O⁻</text>
            <text x={60} y={104} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--fg-muted)">−2</text>

            {/* Terminal S4 Oxygens */}
            {/* Top O (double bond) */}
            <line x1={394} y1={115} x2={424} y2={75} stroke="var(--border)" strokeWidth={2.5} />
            <line x1={386} y1={111} x2={416} y2={71} stroke="var(--border)" strokeWidth={2.5} />
            <circle cx={430} cy={66} r={16} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={430} y={67} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--fg)">O</text>
            <text x={430} y={40} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--fg-muted)">−2</text>

            {/* Bottom O (double bond) */}
            <line x1={394} y1={145} x2={424} y2={185} stroke="var(--border)" strokeWidth={2.5} />
            <line x1={386} y1={149} x2={416} y2={189} stroke="var(--border)" strokeWidth={2.5} />
            <circle cx={430} cy={195} r={16} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={430} y={196} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--fg)">O</text>
            <text x={430} y={222} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--fg-muted)">−2</text>

            {/* Right O- (single bond) */}
            <line x1={405} y1={130} x2={455} y2={130} stroke="var(--border)" strokeWidth={2.5} />
            <circle cx={470} cy={130} r={16} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={470} y={131} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--fg)">O⁻</text>
            <text x={470} y={104} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--fg-muted)">−2</text>

            {/* Four Sulfur Atoms in center row */}
            {/* S1: Terminal +5 */}
            <g transform="translate(140, 130)">
              <circle cx={0} cy={0} r={18} fill="var(--surface)" stroke="var(--ox)" strokeWidth={2.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="var(--fg)">S</text>
              <rect x={-22} y={-42} width={44} height={22} rx={5} fill="var(--ox)" />
              <text x={0} y={-30} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill="#fff">+5</text>
            </g>

            {/* S2: Central 0 */}
            <g transform="translate(230, 130)">
              <circle cx={0} cy={0} r={18} fill="var(--surface)" stroke="var(--border)" strokeWidth={2.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="var(--fg)">S</text>
              <rect x={-20} y={-42} width={40} height={22} rx={5} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
              <text x={0} y={-30} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill="var(--fg)">0</text>
            </g>

            {/* S3: Central 0 */}
            <g transform="translate(300, 130)">
              <circle cx={0} cy={0} r={18} fill="var(--surface)" stroke="var(--border)" strokeWidth={2.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="var(--fg)">S</text>
              <rect x={-20} y={-42} width={40} height={22} rx={5} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
              <text x={0} y={-30} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill="var(--fg)">0</text>
            </g>

            {/* S4: Terminal +5 */}
            <g transform="translate(390, 130)">
              <circle cx={0} cy={0} r={18} fill="var(--surface)" stroke="var(--ox)" strokeWidth={2.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="var(--fg)">S</text>
              <rect x={-22} y={-42} width={44} height={22} rx={5} fill="var(--ox)" />
              <text x={0} y={-30} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill="#fff">+5</text>
            </g>

            {/* Annotation under central bond */}
            <text
              x={265}
              y={162}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--primary, #3b82f6)"
            >
              Homonuclear S−S bond: Δχ = 0 → 0 contribution
            </text>

            {/* Calculation ledger card at bottom */}
            <g transform="translate(20, 246)">
              <rect
                x={0}
                y={0}
                width={490}
                height={110}
                rx={8}
                fill="var(--surface-raised)"
                stroke="var(--border)"
                strokeWidth={1.2}
              />
              <text
                x={18}
                y={26}
                fontSize={15}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                Arithmetic Average vs Atomic Reality:
              </text>
              <text
                x={18}
                y={56}
                fontSize={14}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                Average O.N. = (+5 + 0 + 0 + 5) / 4 = +10 / 4 ={' '}
                <tspan fontWeight={700} fill="var(--ox)">
                  +2.5 (+5/2)
                </tspan>
              </text>
              <text
                x={18}
                y={84}
                fontSize={14}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
              >
                Electrons are transferred as whole units. Fractional numbers are averages of integer states.
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
