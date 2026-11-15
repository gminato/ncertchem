'use client'

import React from 'react'
import { getONStep, ON_STEP_COUNT } from './balance-on-steps'
import styles from './balance-on.module.css'

export interface RedoxBalanceONProps {
  step: number
  reducedMotion: boolean
}

export function RedoxBalanceON({ step, reducedMotion }: RedoxBalanceONProps) {
  const index = Math.min(ON_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const data = getONStep(index)

  return (
    <div className={styles.container} data-step={index}>
      <svg
        viewBox="0 0 580 430"
        className={styles.svg}
        role="img"
        aria-label={`Oxidation Number Method: ${data.title}. ${data.instruction}`}
      >
        <defs>
          <filter id="glow-ox" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <marker
            id="arrow-head-red"
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--red)" />
          </marker>
          <marker
            id="arrow-head-ox"
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--ox)" />
          </marker>
        </defs>

        {/* Outer Card Background */}
        <rect
          x="10"
          y="10"
          width="560"
          height="410"
          rx="14"
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth="1.2"
        />

        {/* Step Indicator Header */}
        <g transform="translate(24, 38)">
          <rect
            x="0"
            y="-16"
            width="88"
            height="22"
            rx="11"
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x="44"
            y="-2"
            fill="var(--fg-muted)"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="0.05em"
          >
            STEP {data.stepNumber} OF 5
          </text>
          <text
            x="98"
            y="0"
            fill="var(--fg)"
            fontSize="15"
            fontWeight="700"
            data-testid="on-step-title"
          >
            {data.title}
          </text>
        </g>

        {/* Middle Stage: Equation Display Box */}
        <rect
          x="24"
          y="56"
          width="532"
          height="124"
          rx="10"
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth="1"
        />

        {/* Reaction Equation Graphics */}
        {index === 0 && (
          <g transform="translate(290, 126)" textAnchor="middle" data-testid="on-equation">
            <text fill="var(--fg)" fontSize="19" fontWeight="600">
              MnO<tspan dy="4" fontSize="13">4</tspan>
              <tspan dy="-10" fontSize="13">−</tspan>
              <tspan dy="6"> + </tspan>
              C<tspan dy="4" fontSize="13">2</tspan>
              <tspan dy="-4">O</tspan>
              <tspan dy="4" fontSize="13">4</tspan>
              <tspan dy="-10" fontSize="13">2−</tspan>
              <tspan dy="6"> → </tspan>
              Mn<tspan dy="-6" fontSize="13">2+</tspan>
              <tspan dy="6"> + </tspan>
              CO<tspan dy="4" fontSize="13">2</tspan>
            </text>
            <text y="30" fill="var(--fg-muted)" fontSize="13">
              Unbalanced skeletal equation in ionic form
            </text>
          </g>
        )}

        {index === 1 && (
          <g transform="translate(0, 0)" data-testid="on-equation">
            {/* Top oxidation state badges */}
            <g transform="translate(134, 82)">
              <rect x="-18" y="-14" width="36" height="20" rx="5" fill="var(--surface)" stroke="var(--red)" strokeWidth="1.5" />
              <text x="0" y="0" fill="var(--red)" fontSize="12" fontWeight="700" textAnchor="middle">+7</text>
            </g>
            <g transform="translate(216, 82)">
              <rect x="-18" y="-14" width="36" height="20" rx="5" fill="var(--surface)" stroke="var(--ox)" strokeWidth="1.5" />
              <text x="0" y="0" fill="var(--ox)" fontSize="12" fontWeight="700" textAnchor="middle">+3</text>
            </g>
            <g transform="translate(366, 82)">
              <rect x="-18" y="-14" width="36" height="20" rx="5" fill="var(--surface)" stroke="var(--red)" strokeWidth="1.5" />
              <text x="0" y="0" fill="var(--red)" fontSize="12" fontWeight="700" textAnchor="middle">+2</text>
            </g>
            <g transform="translate(446, 82)">
              <rect x="-18" y="-14" width="36" height="20" rx="5" fill="var(--surface)" stroke="var(--ox)" strokeWidth="1.5" />
              <text x="0" y="0" fill="var(--ox)" fontSize="12" fontWeight="700" textAnchor="middle">+4</text>
            </g>

            {/* Connecting Arc for Mn: Reduction (+7 to +2) */}
            <path
              d="M 134 68 Q 250 42 366 68"
              fill="none"
              stroke="var(--red)"
              strokeWidth="2"
              strokeDasharray="4 3"
              markerEnd="url(#arrow-head-red)"
            />
            <text x="250" y="48" fill="var(--red)" fontSize="11" fontWeight="700" textAnchor="middle">
              Decrease of 5 per atom (Reduction)
            </text>

            {/* Connecting Arc for C: Oxidation (+3 to +4) */}
            <path
              d="M 216 148 Q 331 174 446 148"
              fill="none"
              stroke="var(--ox)"
              strokeWidth="2"
              strokeDasharray="4 3"
              markerEnd="url(#arrow-head-ox)"
            />
            <text x="331" y="172" fill="var(--ox)" fontSize="11" fontWeight="700" textAnchor="middle">
              Increase of 1 per atom; 2 per C₂O₄²⁻ (Oxidation)
            </text>

            {/* Equation text */}
            <g transform="translate(290, 126)" textAnchor="middle">
              <text fill="var(--fg)" fontSize="19" fontWeight="600">
                <tspan fill="var(--red)">Mn</tspan>O<tspan dy="4" fontSize="13">4</tspan>
                <tspan dy="-10" fontSize="13">−</tspan>
                <tspan dy="6"> + </tspan>
                <tspan fill="var(--ox)">C</tspan><tspan dy="4" fontSize="13">2</tspan>
                <tspan dy="-4">O</tspan><tspan dy="4" fontSize="13">4</tspan>
                <tspan dy="-10" fontSize="13">2−</tspan>
                <tspan dy="6"> → </tspan>
                <tspan fill="var(--red)">Mn</tspan><tspan dy="-6" fontSize="13">2+</tspan>
                <tspan dy="6"> + </tspan>
                <tspan fill="var(--ox)">C</tspan>O<tspan dy="4" fontSize="13">2</tspan>
              </text>
            </g>
          </g>
        )}

        {index === 2 && (
          <g transform="translate(0, 0)" data-testid="on-equation">
            {/* Multipliers on top */}
            <g transform="translate(140, 82)">
              <rect x="-35" y="-12" width="70" height="20" rx="5" fill="var(--surface)" stroke="var(--red)" strokeWidth="1.5" />
              <text x="0" y="2" fill="var(--red)" fontSize="11" fontWeight="700" textAnchor="middle">× 2 (total −10)</text>
            </g>
            <g transform="translate(230, 82)">
              <rect x="-35" y="-12" width="70" height="20" rx="5" fill="var(--surface)" stroke="var(--ox)" strokeWidth="1.5" />
              <text x="0" y="2" fill="var(--ox)" fontSize="11" fontWeight="700" textAnchor="middle">× 5 (total +10)</text>
            </g>

            <g transform="translate(290, 128)" textAnchor="middle">
              <text fill="var(--fg)" fontSize="20" fontWeight="700">
                <tspan fill="var(--red)">2 </tspan>MnO<tspan dy="4" fontSize="13">4</tspan>
                <tspan dy="-10" fontSize="13">−</tspan>
                <tspan dy="6"> + </tspan>
                <tspan fill="var(--ox)">5 </tspan>C<tspan dy="4" fontSize="13">2</tspan>
                <tspan dy="-4">O</tspan><tspan dy="4" fontSize="13">4</tspan>
                <tspan dy="-10" fontSize="13">2−</tspan>
                <tspan dy="6"> → </tspan>
                <tspan fill="var(--red)">2 </tspan>Mn<tspan dy="-6" fontSize="13">2+</tspan>
                <tspan dy="6"> + </tspan>
                <tspan fill="var(--ox)">10 </tspan>CO<tspan dy="4" fontSize="13">2</tspan>
              </text>
              <text y="28" fill="var(--fg-muted)" fontSize="13">
                Total increase (+10) = Total decrease (−10)
              </text>
            </g>
          </g>
        )}

        {index === 3 && (
          <g transform="translate(0, 0)" data-testid="on-equation">
            <g transform="translate(290, 118)" textAnchor="middle">
              <text fill="var(--fg)" fontSize="18" fontWeight="600">
                2 MnO<tspan dy="4" fontSize="13">4</tspan>
                <tspan dy="-10" fontSize="13">−</tspan>
                <tspan dy="6"> + 5 C</tspan>
                <tspan dy="4" fontSize="13">2</tspan>
                <tspan dy="-4">O</tspan>
                <tspan dy="4" fontSize="13">4</tspan>
                <tspan dy="-10" fontSize="13">2−</tspan>
                <tspan dy="6" fill="var(--sol-cu)" fontWeight="700"> + 16 H</tspan>
                <tspan dy="-6" fontSize="13" fill="var(--sol-cu)">+</tspan>
                <tspan dy="6"> → 2 Mn</tspan>
                <tspan dy="-6" fontSize="13">2+</tspan>
                <tspan dy="6"> + 10 CO</tspan>
                <tspan dy="4" fontSize="13">2</tspan>
              </text>
              <text y="34" fill="var(--fg-muted)" fontSize="13">
                Left charge: 2(−1) + 5(−2) + 16(+1) = +4 &nbsp;|&nbsp; Right charge: 2(+2) + 10(0) = +4
              </text>
            </g>
          </g>
        )}

        {index === 4 && (
          <g transform="translate(0, 0)" data-testid="on-equation">
            <g transform="translate(290, 118)" textAnchor="middle">
              <text fill="var(--fg)" fontSize="16" fontWeight="700">
                2 MnO<tspan dy="4" fontSize="12">4</tspan>
                <tspan dy="-9" fontSize="12">−</tspan>
                <tspan dy="5"> + 5 C</tspan>
                <tspan dy="4" fontSize="12">2</tspan>
                <tspan dy="-4">O</tspan>
                <tspan dy="4" fontSize="12">4</tspan>
                <tspan dy="-9" fontSize="12">2−</tspan>
                <tspan dy="5"> + 16 H</tspan>
                <tspan dy="-9" fontSize="12">+</tspan>
                <tspan dy="5"> → 2 Mn</tspan>
                <tspan dy="-9" fontSize="12">2+</tspan>
                <tspan dy="5"> + 10 CO</tspan>
                <tspan dy="4" fontSize="12">2</tspan>
                <tspan dy="-4" fill="var(--sol-cu)"> + 8 H</tspan>
                <tspan dy="4" fontSize="12" fill="var(--sol-cu)">2</tspan>
                <tspan dy="-4" fill="var(--sol-cu)">O</tspan>
              </text>
              <text y="34" fill="var(--success)" fontSize="13" fontWeight="700">
                ✓ Balanced in mass (atoms) and electric charge
              </text>
            </g>
          </g>
        )}

        {/* Lower Detail Stage */}
        <g transform="translate(24, 194)">
          {/* Steps 0 & 1: Roles card */}
          {(index === 0 || index === 1) && (
            <g>
              {/* Reductant Box */}
              <rect
                x="0"
                y="0"
                width="256"
                height="116"
                rx="8"
                fill="var(--surface-raised)"
                stroke="var(--ox)"
                strokeWidth="1.5"
              />
              <text x="14" y="24" fill="var(--ox)" fontSize="12" fontWeight="700" letterSpacing="0.04em">
                REDUCTANT (OXIDISED)
              </text>
              <text x="14" y="48" fill="var(--fg)" fontSize="16" fontWeight="700">
                Oxalate Ion: C₂O₄²⁻
              </text>
              <text x="14" y="72" fill="var(--fg-muted)" fontSize="13">
                Carbon state: +3 → +4
              </text>
              <text x="14" y="94" fill="var(--fg-subtle)" fontSize="12">
                Increase of 1 per C atom; 2 per formula unit
              </text>

              {/* Oxidant Box */}
              <rect
                x="276"
                y="0"
                width="256"
                height="116"
                rx="8"
                fill="var(--surface-raised)"
                stroke="var(--red)"
                strokeWidth="1.5"
              />
              <text x="290" y="24" fill="var(--red)" fontSize="12" fontWeight="700" letterSpacing="0.04em">
                OXIDANT (REDUCED)
              </text>
              <text x="290" y="48" fill="var(--fg)" fontSize="16" fontWeight="700">
                Permanganate Ion: MnO₄⁻
              </text>
              <text x="290" y="72" fill="var(--fg-muted)" fontSize="13">
                Manganese state: +7 → +2
              </text>
              <text x="290" y="94" fill="var(--fg-subtle)" fontSize="12">
                Decrease of 5 per Mn atom
              </text>
            </g>
          )}

          {/* Step 2: Multiplier Balancing Box */}
          {index === 2 && (
            <g>
              <rect
                x="0"
                y="0"
                width="532"
                height="116"
                rx="8"
                fill="var(--surface-raised)"
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text x="20" y="26" fill="var(--fg)" fontSize="13" fontWeight="700">
                Equalising Electron / Oxidation Number Changes:
              </text>

              <g transform="translate(20, 48)">
                <rect x="0" y="0" width="235" height="52" rx="6" fill="var(--surface)" stroke="var(--ox)" strokeWidth="1" />
                <text x="12" y="22" fill="var(--ox)" fontSize="12" fontWeight="700">Carbon (in C₂O₄²⁻):</text>
                <text x="12" y="40" fill="var(--fg)" fontSize="13">
                  +2 per ion × <tspan fontWeight="700" fill="var(--ox)">5</tspan> = <tspan fontWeight="700">+10 increase</tspan>
                </text>
              </g>

              <g transform="translate(277, 48)">
                <rect x="0" y="0" width="235" height="52" rx="6" fill="var(--surface)" stroke="var(--red)" strokeWidth="1" />
                <text x="12" y="22" fill="var(--red)" fontSize="12" fontWeight="700">Manganese (in MnO₄⁻):</text>
                <text x="12" y="40" fill="var(--fg)" fontSize="13">
                  −5 per ion × <tspan fontWeight="700" fill="var(--red)">2</tspan> = <tspan fontWeight="700">−10 decrease</tspan>
                </text>
              </g>
            </g>
          )}

          {/* Step 3: Charge Balance Box */}
          {index === 3 && (
            <g>
              <rect
                x="0"
                y="0"
                width="532"
                height="116"
                rx="8"
                fill="var(--surface-raised)"
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text x="20" y="26" fill="var(--fg)" fontSize="13" fontWeight="700">
                Ionic Charge Ledger (Acidic medium: add H⁺):
              </text>

              <g transform="translate(20, 44)">
                <rect x="0" y="0" width="235" height="56" rx="6" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                <text x="12" y="20" fill="var(--fg-muted)" fontSize="11" fontWeight="700">REACTANTS CHARGE</text>
                <text x="12" y="42" fill="var(--fg)" fontSize="14" fontWeight="600">
                  −12 <tspan fill="var(--sol-cu)">+ 16 H⁺</tspan> = <tspan fill="var(--success)" fontWeight="700">+4</tspan>
                </text>
              </g>

              <g transform="translate(277, 44)">
                <rect x="0" y="0" width="235" height="56" rx="6" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                <text x="12" y="20" fill="var(--fg-muted)" fontSize="11" fontWeight="700">PRODUCTS CHARGE</text>
                <text x="12" y="42" fill="var(--fg)" fontSize="14" fontWeight="600">
                  2(+2) + 10(0) = <tspan fill="var(--success)" fontWeight="700">+4</tspan>
                </text>
              </g>
            </g>
          )}

          {/* Step 4: Verification Grid */}
          {index === 4 && (
            <g>
              <rect
                x="0"
                y="0"
                width="532"
                height="116"
                rx="8"
                fill="var(--surface-raised)"
                stroke="var(--success)"
                strokeWidth="1.2"
              />
              <text x="20" y="24" fill="var(--success)" fontSize="12" fontWeight="700" letterSpacing="0.04em">
                FINAL VERIFICATION SCORECARD
              </text>

              {/* Tally Columns */}
              <g transform="translate(20, 38)">
                {[
                  { sym: 'Mn', l: 2, r: 2 },
                  { sym: 'C', l: 10, r: 10 },
                  { sym: 'H', l: 16, r: 16 },
                  { sym: 'O', l: 28, r: 28 },
                  { sym: 'Net Charge', l: '+4', r: '+4' },
                ].map((item, i) => (
                  <g key={item.sym} transform={`translate(${i * 100}, 0)`}>
                    <rect x="0" y="0" width="92" height="64" rx="6" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                    <text x="46" y="20" fill="var(--fg)" fontSize="12" fontWeight="700" textAnchor="middle">
                      {item.sym}
                    </text>
                    <text x="46" y="40" fill="var(--fg-muted)" fontSize="12" textAnchor="middle">
                      {item.l} = {item.r}
                    </text>
                    <text x="46" y="56" fill="var(--success)" fontSize="10" fontWeight="700" textAnchor="middle">
                      ✓ MATCH
                    </text>
                  </g>
                ))}
              </g>
            </g>
          )}
        </g>

        {/* Bottom Takeaway Bar */}
        <g transform="translate(24, 326)">
          <rect
            x="0"
            y="0"
            width="532"
            height="76"
            rx="8"
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text x="16" y="24" fill="var(--fg-muted)" fontSize="11" fontWeight="700" letterSpacing="0.05em">
            STEP {data.stepNumber} TAKEAWAY
          </text>
          <text x="16" y="46" fill="var(--fg)" fontSize="13" fontWeight="500">
            {data.instruction}
          </text>
          <text x="16" y="64" fill="var(--fg-subtle)" fontSize="12">
            {index === 0 && 'Formula accuracy is essential before assigning oxidation numbers.'}
            {index === 1 && 'Mn is reduced (oxidant) while C is oxidised (reductant).'}
            {index === 2 && 'LCM of 5 and 2 is 10, requiring 2 Mn and 5 oxalate units.'}
            {index === 3 && 'In acid solution, add H⁺ to make total reactant charge equal product charge.'}
            {index === 4 && 'Hydrogen is balanced with H₂O, and oxygen balances as an automatic cross-check.'}
          </text>
        </g>
      </svg>
    </div>
  )
}
