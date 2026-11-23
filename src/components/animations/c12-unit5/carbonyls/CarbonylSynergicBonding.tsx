'use client'

import { PI_TONE, SIGMA_TONE } from './carbonyl-geometry'
import { synergicStepState } from './synergic-steps'

export interface CarbonylSynergicBondingProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 440

const MX = 134
const MY = 222
const CX = 386
const CY = 222
const OX = 488
const OY = 222

/** Smooth orbital teardrop lobe anchored at (0,0) pointing along +x. */
function lobePath(len: number, halfWidth: number): string {
  return `M 0 0 C ${(len * 0.42).toFixed(1)} ${(-halfWidth).toFixed(1)}, ${len.toFixed(1)} ${(-halfWidth * 0.85).toFixed(1)}, ${len.toFixed(1)} 0 C ${len.toFixed(1)} ${(halfWidth * 0.85).toFixed(1)}, ${(len * 0.42).toFixed(1)} ${halfWidth.toFixed(1)}, 0 0 Z`
}

/** A pair of electron dots placed along a lobe axis at distance d from origin. */
function ElectronPair({
  x,
  y,
  angleDeg,
  color,
}: {
  x: number
  y: number
  angleDeg: number
  color: string
}) {
  const rad = (angleDeg * Math.PI) / 180
  const px = -Math.sin(rad) * 5.5
  const py = Math.cos(rad) * 5.5
  return (
    <g>
      <circle cx={x + px} cy={y + py} r={3.6} fill={color} />
      <circle cx={x - px} cy={y - py} r={3.6} fill={color} />
    </g>
  )
}

export function CarbonylSynergicBonding({ step, reducedMotion }: CarbonylSynergicBondingProps) {
  const state = synergicStepState(step)
  const tr = reducedMotion ? 'none' : 'all 320ms ease'

  const dLobe = lobePath(88, 28)
  const vacantMLobe = lobePath(78, 20)
  const lonePairLobe = lobePath(72, 19)
  const piStarC = lobePath(78, 24)
  const piStarO = lobePath(44, 15)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`${state.heading}. ${state.caption}`}
      style={{ display: 'block' }}
    >
      <defs>
        <marker id="syn-sigma" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill={SIGMA_TONE} />
        </marker>
        <marker id="syn-pi" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill={PI_TONE} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W / 2} y={34} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--fg)">
        {state.heading}
      </text>

      {/* Metal negative tint halo in Step 2 (sigma donation before pi back donation) */}
      <circle
        cx={MX}
        cy={MY}
        r={42}
        fill="var(--delta-minus)"
        fillOpacity={state.metalNegativeTint ? 0.2 : 0}
        stroke="var(--delta-minus)"
        strokeOpacity={state.metalNegativeTint ? 0.65 : 0}
        strokeWidth={2}
        strokeDasharray="4 3"
        style={{ transition: tr }}
      />
      {state.metalNegativeTint && (
        <text x={MX - 52} y={MY + 6} textAnchor="end" fontSize={16} fontWeight={700} fill="var(--delta-minus)">
          {'\u03b4\u2212'}
        </text>
      )}

      {/* Metal filled d orbital (4-lobed cloverleaf at 45 deg) */}
      <g transform={`translate(${MX}, ${MY})`}>
        {[-45, 45, -135, 135].map((deg) => (
          <path
            key={deg}
            d={dLobe}
            transform={`rotate(${deg})`}
            fill={PI_TONE}
            fillOpacity={deg === -45 || deg === 45 ? 0.3 : 0.16}
            stroke={PI_TONE}
            strokeWidth={2}
            style={{ transition: tr }}
          />
        ))}
        {/* Single electron pair in one lobe of the filled d orbital (matching NCERT Fig. 5.14) */}
        <ElectronPair x={46} y={46} angleDeg={45} color={PI_TONE} />

        {/* Metal vacant sigma-acceptor orbital pointing right toward C */}
        <path
          d={vacantMLobe}
          fill={state.vacantMetalFilled ? SIGMA_TONE : 'none'}
          fillOpacity={state.vacantMetalFilled ? 0.28 : 0}
          stroke={state.vacantMetalFilled ? SIGMA_TONE : 'var(--fg-muted)'}
          strokeWidth={2.2}
          strokeDasharray={state.vacantMetalFilled ? undefined : '5 4'}
          style={{ transition: tr }}
        />
      </g>

      {/* Carbon antibonding pi* lobes on C and O */}
      <g transform={`translate(${CX}, ${CY})`}>
        {[-122, 122].map((deg) => (
          <path
            key={deg}
            d={piStarC}
            transform={`rotate(${deg})`}
            fill={state.piStarFilled ? PI_TONE : 'none'}
            fillOpacity={state.piStarFilled ? 0.3 : 0}
            stroke={state.piStarFilled ? PI_TONE : 'var(--fg-muted)'}
            strokeWidth={2.2}
            strokeDasharray={state.piStarFilled ? undefined : '5 4'}
            style={{ transition: tr }}
          />
        ))}
        {/* Carbon lone pair lobe pointing left toward M */}
        <path
          d={lonePairLobe}
          transform="rotate(180)"
          fill={SIGMA_TONE}
          fillOpacity={0.32}
          stroke={SIGMA_TONE}
          strokeWidth={2}
        />
        <ElectronPair x={-46} y={0} angleDeg={180} color={SIGMA_TONE} />
      </g>

      {/* Smaller outer pi* lobes on O */}
      <g transform={`translate(${OX}, ${OY})`}>
        {[-55, 55].map((deg) => (
          <path
            key={deg}
            d={piStarO}
            transform={`rotate(${deg})`}
            fill={state.piStarFilled ? PI_TONE : 'none'}
            fillOpacity={state.piStarFilled ? 0.16 : 0}
            stroke={state.piStarFilled ? PI_TONE : 'var(--fg-muted)'}
            strokeWidth={1.6}
            strokeDasharray={state.piStarFilled ? undefined : '4 4'}
            style={{ transition: tr }}
          />
        ))}
      </g>

      {/* M-C bond line: none in step 1, normal in steps 2-3, heavier in step 4 (synergy) */}
      {state.mcBondStrength !== 'none' && (
        <g>
          {state.mcBondStrength === 'synergic' && (
            <line
              x1={MX + 24}
              y1={MY}
              x2={CX - 22}
              y2={CY}
              stroke={SIGMA_TONE}
              strokeOpacity={0.22}
              strokeWidth={14}
              strokeLinecap="round"
            />
          )}
          <line
            x1={MX + 24}
            y1={MY}
            x2={CX - 22}
            y2={CY}
            stroke="var(--fg)"
            strokeWidth={state.mcBondStrength === 'synergic' ? 5.5 : 2.6}
            strokeLinecap="round"
            style={{ transition: tr }}
          />
        </g>
      )}

      {/* C≡O triple bond */}
      <g stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round">
        <line x1={CX + 22} y1={CY - 7} x2={OX - 22} y2={OY - 7} />
        <line x1={CX + 22} y1={CY} x2={OX - 22} y2={OY} />
        <line x1={CX + 22} y1={CY + 7} x2={OX - 22} y2={OY + 7} />
      </g>

      {/* Sigma donation arrow (C -> M, ligand tone) */}
      {state.showSigmaArrow && (
        <g>
          <path
            d={`M ${CX - 66} ${CY - 12} Q ${(MX + CX) / 2} ${CY - 30} ${MX + 70} ${MY - 12}`}
            fill="none"
            stroke={SIGMA_TONE}
            strokeWidth={3.2}
            strokeLinecap="round"
            markerEnd="url(#syn-sigma)"
          />
          <text
            x={(MX + CX) / 2 + 10}
            y={CY - 34}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={SIGMA_TONE}
            stroke="var(--surface)"
            strokeWidth={4}
            paintOrder="stroke"
          >
            sigma bond: C to M
          </text>
        </g>
      )}

      {/* Pi back-donation arrows (M -> C, metal tone) */}
      {state.showPiArrows && (
        <g>
          {/* Upper arc */}
          <path
            d={`M ${MX + 64} ${MY - 66} Q ${(MX + CX) / 2} ${MY - 120} ${CX - 48} ${CY - 66}`}
            fill="none"
            stroke={PI_TONE}
            strokeWidth={3.2}
            strokeLinecap="round"
            markerEnd="url(#syn-pi)"
          />
          {/* Lower arc */}
          <path
            d={`M ${MX + 64} ${MY + 66} Q ${(MX + CX) / 2} ${MY + 120} ${CX - 48} ${CY + 66}`}
            fill="none"
            stroke={PI_TONE}
            strokeWidth={3.2}
            strokeLinecap="round"
            markerEnd="url(#syn-pi)"
          />
          <text
            x={(MX + CX) / 2}
            y={MY - 104}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={PI_TONE}
          >
            pi bond: M to C
          </text>
          <text
            x={(MX + CX) / 2}
            y={MY + 114}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={PI_TONE}
          >
            pi back donation
          </text>
        </g>
      )}

      {/* Atom centres drawn last so symbols stay crisp on top */}
      <g>
        <circle cx={MX} cy={MY} r={22} fill="var(--surface)" />
        <circle cx={MX} cy={MY} r={22} fill={PI_TONE} fillOpacity={0.22} stroke={PI_TONE} strokeWidth={2.5} />
        <text x={MX} y={MY + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--fg)">
          M
        </text>
      </g>
      <g>
        <circle cx={CX} cy={CY} r={20} fill="var(--surface)" />
        <circle cx={CX} cy={CY} r={20} fill="var(--el-C)" fillOpacity={0.16} stroke="var(--fg)" strokeWidth={2} />
        <text x={CX} y={CY + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--fg)">
          C
        </text>
      </g>
      <g>
        <circle cx={OX} cy={OY} r={20} fill="var(--surface)" />
        <circle cx={OX} cy={OY} r={20} fill="var(--el-O)" fillOpacity={0.2} stroke="var(--el-O)" strokeWidth={2} />
        <text x={OX} y={OY + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--fg)">
          O
        </text>
      </g>

      {/* Orbital state labels in Step 0 (The parts) */}
      {state.kind === 'parts' && (
        <g fontSize={15}>
          <text x={112} y={118} textAnchor="middle" fontWeight={600} fill={PI_TONE}>
            filled d orbital
          </text>
          <text x={420} y={118} textAnchor="middle" fill="var(--fg-muted)">
            vacant {'\u03c0*'} orbital
          </text>

          {/* Leader lines to inner sigma lobes so labels never overlap lobes */}
          <line
            x1={MX + 58}
            y1={MY + 22}
            x2={216}
            y2={308}
            stroke="var(--fg-muted)"
            strokeWidth={1.3}
            strokeDasharray="3 3"
          />
          <text x={200} y={328} textAnchor="middle" fill="var(--fg-muted)">
            vacant M orbital
          </text>

          <line
            x1={CX - 54}
            y1={CY + 20}
            x2={336}
            y2={308}
            stroke={SIGMA_TONE}
            strokeWidth={1.3}
            strokeDasharray="3 3"
          />
          <text x={356} y={328} textAnchor="middle" fontWeight={600} fill={SIGMA_TONE}>
            filled lone pair
          </text>
        </g>
      )}

      {/* Subtle orbital tags in Steps 1-3 */}
      {state.kind !== 'parts' && (
        <g fontSize={15} fill="var(--fg-muted)">
          <text x={74} y={120} textAnchor="middle">
            filled d
          </text>
          <text x={428} y={120} textAnchor="middle">
            {state.piStarFilled ? '\u03c0* (populated)' : '\u03c0* (vacant)'}
          </text>
        </g>
      )}

      {/* Bottom caption */}
      {state.kind === 'parts' && (
        <>
          <text x={W / 2} y={376} textAnchor="middle" fontSize={15} fill="var(--fg)">
            Metal has a vacant orbital and a filled d orbital.
          </text>
          <text x={W / 2} y={400} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
            CO has a carbon lone pair and vacant antibonding {'\u03c0*'} orbitals.
          </text>
        </>
      )}
      {state.kind === 'sigma' && (
        <>
          <text x={W / 2} y={376} textAnchor="middle" fontSize={15} fill="var(--fg)">
            Carbon donates its lone pair into the vacant metal orbital.
          </text>
          <text x={W / 2} y={400} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
            The vacant lobe fills and M gains extra electron density ({'\u03b4\u2212'}).
          </text>
        </>
      )}
      {state.kind === 'pi' && (
        <>
          <text x={W / 2} y={376} textAnchor="middle" fontSize={15} fill="var(--fg)">
            Filled metal d lobes donate back into vacant {'\u03c0*'} lobes on CO.
          </text>
          <text x={W / 2} y={400} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
            Back donation relieves the negative buildup on the metal.
          </text>
        </>
      )}
      {state.kind === 'synergy' && (
        <>
          <text x={W / 2} y={376} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
            Synergic effect: stronger M-CO bond
          </text>
          <text x={W / 2} y={402} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
            Each donation makes the other easier, reinforcing the bond.
          </text>
        </>
      )}
    </svg>
  )
}
