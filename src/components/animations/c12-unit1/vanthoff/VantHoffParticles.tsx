'use client'

import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Vessel, VocabDefs } from '@/components/vocab'
import { NCERT_VANT_HOFF_SALTS } from '@/lib/chem/ncert-c12-unit1-tables'
import { VANT_HOFF_STEPS, clampVantHoffStep } from './vanthoff-steps'

export interface VantHoffParticlesProps {
  step: number
  reducedMotion: boolean
}

interface AnchorPoint {
  readonly x: number
  readonly y: number
  readonly ph: number
}

// Six nominal solute anchors inside the central Vessel beaker (x: 120..460, liquid y: 89..302)
const BEAKER_ANCHORS: readonly AnchorPoint[] = [
  { x: 192, y: 154, ph: 0.4 },
  { x: 290, y: 154, ph: 1.7 },
  { x: 388, y: 154, ph: 3.0 },
  { x: 192, y: 242, ph: 4.1 },
  { x: 290, y: 242, ph: 5.2 },
  { x: 388, y: 242, ph: 2.3 },
]

// Three cyclic H-bonded dimer centres for Step 2 (pairing 6 monomers into 3 dimers)
const DIMER_CENTRES: readonly AnchorPoint[] = [
  { x: 204, y: 154, ph: 0.7 },
  { x: 376, y: 154, ph: 2.5 },
  { x: 290, y: 242, ph: 4.3 },
]

const SALT_STYLES: Record<string, { color: string; dashed?: boolean }> = {
  k2so4: { color: 'var(--spot-1)' },
  nacl: { color: 'var(--ox)' },
  kcl: { color: 'var(--accent)', dashed: true },
  mgso4: { color: 'var(--spot-3)' },
}

// Dilution chart plot geometry (Step 3)
const PLOT_LEFT = 86
const PLOT_RIGHT = 468
const PLOT_TOP = 64
const PLOT_BOTTOM = 336

function plotY(iVal: number): number {
  // Maps i in [1.0, 3.1] onto [PLOT_BOTTOM, PLOT_TOP]
  return PLOT_BOTTOM - ((iVal - 1.0) / 2.1) * (PLOT_BOTTOM - PLOT_TOP)
}

function plotX(colIdx: number): number {
  return PLOT_LEFT + 14 + colIdx * ((PLOT_RIGHT - PLOT_LEFT - 28) / 3)
}

export function VantHoffParticles({ step, reducedMotion }: VantHoffParticlesProps) {
  const index = clampVantHoffStep(step)
  const cfg = VANT_HOFF_STEPS[index]
  const t = useAmbientTime(reducedMotion)

  const showBeakerView =
    cfg.mode === 'baseline' || cfg.mode === 'dissociation' || cfg.mode === 'association'

  const tweenI = useTweenedNumber(cfg.targetI, reducedMotion, 0.52)
  const tweenMassRatio = useTweenedNumber(cfg.targetMassRatio, reducedMotion, 0.52)
  const splitProgress = useTweenedNumber(cfg.mode === 'dissociation' ? 1 : 0, reducedMotion, 0.55)
  const dimerProgress = useTweenedNumber(cfg.mode === 'association' ? 1 : 0, reducedMotion, 0.55)

  const beakerOpacity = useTweenedNumber(showBeakerView ? 1 : 0, reducedMotion, 0.38)
  const dilutionOpacity = useTweenedNumber(cfg.mode === 'definitions' ? 1 : 0, reducedMotion, 0.38)
  const equationsOpacity = useTweenedNumber(cfg.mode === 'equations' ? 1 : 0, reducedMotion, 0.38)

  // Horizontal meter geometry (borderless)
  const meterX = 186
  const meterTrackW = 264
  const iFillW = Math.max(8, Math.min(meterTrackW, (tweenI / 3) * meterTrackW))
  const massFillW = Math.max(8, Math.min(meterTrackW, (tweenMassRatio / 2.2) * meterTrackW))
  const massRefX = meterX + (1.0 / 2.2) * meterTrackW

  const modeColor =
    cfg.mode === 'dissociation'
      ? 'var(--ox)'
      : cfg.mode === 'association'
        ? 'var(--acid)'
        : 'var(--accent)'

  const tracerU = reducedMotion ? 0.65 : (t * 0.28) % 1
  const eqPulse = reducedMotion ? 1 : 0.82 + 0.18 * Math.sin(t * 2.6)

  return (
    <svg
      viewBox="0 0 580 540"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={cfg.ariaSummary}
      data-testid="vant-hoff-particles"
      data-step={index}
    >
      <VocabDefs idPrefix="vh" />

      {/* ===================== STEPS 0, 1, 2: BEAKER + LIVE METERS ===================== */}
      <g opacity={beakerOpacity} style={{ pointerEvents: 'none' }}>
        {/* Real Class-11 Vessel beaker filling upper canvas */}
        <Vessel
          variant="beaker"
          width={340}
          height={264}
          x={290}
          y={170}
          level={0.82}
          liquid
          graduated
        />

        {/* Solvent context label floating subtly above meniscus */}
        <text
          x={290}
          y={72}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={600}
          fill="var(--fg-muted)"
        >
          {cfg.mode === 'association' ? 'Benzene solvent (non-polar)' : 'Aqueous solution (water)'}
        </text>

        {/* Living 3D-shaded particles inside the Vessel */}
        {cfg.mode === 'association' ? (
          <g>
            {DIMER_CENTRES.map((centre, dIdx) => {
              const driftX = reducedMotion ? 0 : Math.sin(t * 1.15 + centre.ph) * 4.5
              const driftY = reducedMotion ? 0 : Math.cos(t * 0.95 + centre.ph * 1.2) * 3.5
              const cx = centre.x + driftX
              const cy = centre.y + driftY
              const gap = 36 - 16 * dimerProgress
              const leftX = cx - gap
              const rightX = cx + gap
              return (
                <g key={`dimer-${dIdx}`}>
                  {/* Soft cyclic H-bonded dimer envelope */}
                  <rect
                    x={cx - 46}
                    y={cy - 24}
                    width={92}
                    height={48}
                    rx={24}
                    fill="var(--accent-soft)"
                    fillOpacity={0.38 * dimerProgress}
                    stroke="var(--acid)"
                    strokeWidth={1.4}
                    strokeDasharray="4 3"
                    opacity={dimerProgress}
                  />
                  {/* Dual hydrogen-bond bridges */}
                  <line
                    x1={leftX + 12}
                    y1={cy - 6}
                    x2={rightX - 12}
                    y2={cy - 6}
                    stroke="var(--acid)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    opacity={dimerProgress}
                  />
                  <line
                    x1={leftX + 12}
                    y1={cy + 6}
                    x2={rightX - 12}
                    y2={cy + 6}
                    stroke="var(--acid)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    opacity={dimerProgress}
                  />
                  {/* Left ethanoic acid monomer */}
                  <circle
                    cx={leftX}
                    cy={cy}
                    r={14}
                    fill="var(--acid)"
                    stroke="var(--atom-rim)"
                    strokeWidth={1.2}
                  />
                  <circle cx={leftX} cy={cy} r={14} fill="url(#vh-sphere-shading)" />
                  <text
                    x={leftX}
                    y={cy + 5}
                    textAnchor="middle"
                    fill="var(--accent-fg)"
                    fontFamily="var(--font-mono)"
                    fontSize={14}
                    fontWeight={700}
                  >
                    A
                  </text>
                  {/* Right ethanoic acid monomer */}
                  <circle
                    cx={rightX}
                    cy={cy}
                    r={14}
                    fill="var(--acid)"
                    stroke="var(--atom-rim)"
                    strokeWidth={1.2}
                  />
                  <circle cx={rightX} cy={cy} r={14} fill="url(#vh-sphere-shading)" />
                  <text
                    x={rightX}
                    y={cy + 5}
                    textAnchor="middle"
                    fill="var(--accent-fg)"
                    fontFamily="var(--font-mono)"
                    fontSize={14}
                    fontWeight={700}
                  >
                    A
                  </text>
                </g>
              )
            })}
            {/* Inline H-bond legend right of beaker */}
            <g opacity={dimerProgress}>
              <line
                x1={480}
                y1={154}
                x2={504}
                y2={154}
                stroke="var(--acid)"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
              <text
                x={480}
                y={178}
                fontFamily="var(--font-sans)"
                fontSize={14}
                fontWeight={600}
                fill="var(--acid)"
              >
                H-bond
              </text>
              <text
                x={480}
                y={196}
                fontFamily="var(--font-sans)"
                fontSize={14}
                fill="var(--fg-muted)"
              >
                dimers
              </text>
            </g>
          </g>
        ) : (
          <g>
            {BEAKER_ANCHORS.map((pt, pIdx) => {
              const driftX = reducedMotion ? 0 : Math.sin(t * 1.3 + pt.ph) * 4.5
              const driftY = reducedMotion ? 0 : Math.cos(t * 1.05 + pt.ph * 1.2) * 3.8
              const bx = pt.x + driftX
              const by = pt.y + driftY

              if (cfg.mode === 'dissociation' || splitProgress > 0.02) {
                const sepX = 24 * splitProgress
                const sepY = (pIdx % 2 === 0 ? -11 : 11) * splitProgress
                const ionDrift = reducedMotion ? 0 : Math.sin(t * 1.9 + pt.ph) * 2.5 * splitProgress
                const kx = bx - sepX - ionDrift
                const ky = by + sepY
                const clx = bx + sepX + ionDrift
                const cly = by - sepY
                return (
                  <g key={`ion-pair-${pIdx}`}>
                    <line
                      x1={kx + 11}
                      y1={ky}
                      x2={clx - 11}
                      y2={cly}
                      stroke="var(--fg-subtle)"
                      strokeWidth={1.3}
                      strokeDasharray="2 3"
                      opacity={0.65 * splitProgress}
                    />
                    {/* K+ cation */}
                    <circle
                      cx={kx}
                      cy={ky}
                      r={14.5}
                      fill="var(--ox)"
                      stroke="var(--atom-rim)"
                      strokeWidth={1.2}
                    />
                    <circle cx={kx} cy={ky} r={14.5} fill="url(#vh-sphere-shading)" />
                    <text
                      x={kx}
                      y={ky + 5}
                      textAnchor="middle"
                      fill="var(--accent-fg)"
                      fontFamily="var(--font-mono)"
                      fontSize={15}
                      fontWeight={700}
                    >
                      +
                    </text>
                    {/* Cl- anion */}
                    <circle
                      cx={clx}
                      cy={cly}
                      r={14.5}
                      fill="var(--el-Cl)"
                      stroke="var(--atom-rim)"
                      strokeWidth={1.2}
                    />
                    <circle cx={clx} cy={cly} r={14.5} fill="url(#vh-sphere-shading)" />
                    <text
                      x={clx}
                      y={cly + 5}
                      textAnchor="middle"
                      fill="var(--accent-fg)"
                      fontFamily="var(--font-mono)"
                      fontSize={15}
                      fontWeight={700}
                    >
                      −
                    </text>
                  </g>
                )
              }

              // Baseline intact glucose/urea molecule
              return (
                <g key={`neutral-${pIdx}`}>
                  <circle
                    cx={bx}
                    cy={by}
                    r={16}
                    fill="var(--spot-1)"
                    stroke="var(--atom-rim)"
                    strokeWidth={1.2}
                  />
                  <circle cx={bx} cy={by} r={16} fill="url(#vh-sphere-shading)" />
                  <text
                    x={bx}
                    y={by + 5}
                    textAnchor="middle"
                    fill="var(--accent-fg)"
                    fontFamily="var(--font-mono)"
                    fontSize={14}
                    fontWeight={700}
                  >
                    G
                  </text>
                </g>
              )
            })}

            {/* Minimal ion legend right of beaker in Step 1 */}
            {cfg.mode === 'dissociation' && (
              <g opacity={splitProgress}>
                <circle cx={490} cy={146} r={8} fill="var(--ox)" />
                <circle cx={490} cy={146} r={8} fill="url(#vh-sphere-shading)" />
                <text
                  x={506}
                  y={151}
                  fontFamily="var(--font-sans)"
                  fontSize={15}
                  fontWeight={700}
                  fill="var(--fg)"
                >
                  K<Sup>+</Sup>
                </text>
                <circle cx={490} cy={180} r={8} fill="var(--el-Cl)" />
                <circle cx={490} cy={180} r={8} fill="url(#vh-sphere-shading)" />
                <text
                  x={506}
                  y={185}
                  fontFamily="var(--font-sans)"
                  fontSize={15}
                  fontWeight={700}
                  fill="var(--fg)"
                >
                  Cl<Sup>−</Sup>
                </text>
              </g>
            )}
          </g>
        )}

        {/* Stoichiometry summary directly below beaker */}
        <text
          x={290}
          y={334}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg)"
        >
          {cfg.mode === 'baseline' && <>1 mol → 1 mol · 6 intact molecules</>}
          {cfg.mode === 'dissociation' && (
            <>
              1 mol → 2 mol · KCl → K<Sup>+</Sup> + Cl<Sup>−</Sup> (12 ions)
            </>
          )}
          {cfg.mode === 'association' && (
            <>
              2 mol → 1 mol · 2 CH<Sub>3</Sub>COOH ⇌ (CH<Sub>3</Sub>COOH)<Sub>2</Sub> (3 dimers)
            </>
          )}
        </text>

        {/* Subtle divider above horizontal meters */}
        <line x1={44} y1={356} x2={536} y2={356} stroke="var(--border)" strokeWidth={1} opacity={0.6} />

        {/* Borderless Meter 1: van't Hoff factor i */}
        <text
          x={44}
          y={392}
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={600}
          fill="var(--fg-muted)"
        >
          van’t Hoff factor i
        </text>
        <rect
          x={meterX}
          y={379}
          width={meterTrackW}
          height={16}
          rx={8}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth={1}
        />
        <rect x={meterX} y={379} width={iFillW} height={16} rx={8} fill={modeColor} />
        {/* Reference tick at i = 1.0 */}
        <line
          x1={meterX + meterTrackW / 3}
          y1={373}
          x2={meterX + meterTrackW / 3}
          y2={401}
          stroke="var(--fg)"
          strokeWidth={1.6}
          strokeDasharray="2 2"
        />
        <text
          x={536}
          y={393}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={17}
          fontWeight={700}
          fill={modeColor}
        >
          {tweenI.toFixed(2)}
        </text>
        {/* Scale ticks 0, 1, 2, 3 */}
        {[0, 1, 2, 3].map((tick) => {
          const tx = meterX + (tick / 3) * meterTrackW
          return (
            <text
              key={`itick-${tick}`}
              x={tx}
              y={416}
              textAnchor={tick === 0 ? 'start' : tick === 3 ? 'end' : 'middle'}
              fontFamily="var(--font-mono)"
              fontSize={14}
              fontWeight={tick === 1 ? 700 : 400}
              fill={tick === 1 ? 'var(--fg)' : 'var(--fg-subtle)'}
            >
              {tick}
            </text>
          )
        })}

        {/* Borderless Meter 2: Apparent vs Normal Molar Mass */}
        <text
          x={44}
          y={456}
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={600}
          fill="var(--fg-muted)"
        >
          M<Sub>obs</Sub> / M<Sub>norm</Sub>
        </text>
        <rect
          x={meterX}
          y={443}
          width={meterTrackW}
          height={16}
          rx={8}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth={1}
        />
        <rect x={meterX} y={443} width={massFillW} height={16} rx={8} fill={modeColor} />
        {/* Reference tick at 1.0× (normal molar mass) */}
        <line
          x1={massRefX}
          y1={437}
          x2={massRefX}
          y2={465}
          stroke="var(--fg)"
          strokeWidth={1.6}
          strokeDasharray="2 2"
        />
        <text
          x={536}
          y={457}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={17}
          fontWeight={700}
          fill="var(--fg)"
        >
          {tweenMassRatio.toFixed(2)}×
        </text>
        <text
          x={massRefX}
          y={480}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          1.0× = M<Sub>norm</Sub>
        </text>
      </g>

      {/* ===================== STEP 3: NCERT TABLE 1.4 DILUTION LADDER ===================== */}
      <g opacity={dilutionOpacity} style={{ pointerEvents: 'none' }}>
        <text
          x={290}
          y={38}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={16}
          fontWeight={700}
          fill="var(--fg)"
        >
          Dilution Trend — NCERT Table 1.4
        </text>

        {/* Horizontal gridlines & ideal asymptotes i = 1, 2, 3 */}
        {[1, 2, 3].map((val) => {
          const y = plotY(val)
          return (
            <g key={`dgrid-${val}`}>
              <line
                x1={PLOT_LEFT}
                y1={y}
                x2={PLOT_RIGHT}
                y2={y}
                stroke={val === 1 ? 'var(--glass-wall)' : 'var(--border)'}
                strokeWidth={val === 1 ? 1.5 : 1.2}
                strokeDasharray={val === 1 ? undefined : '4 4'}
              />
              <text
                x={PLOT_LEFT - 12}
                y={y + 5}
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={val > 1 ? 700 : 500}
                fill="var(--fg-muted)"
              >
                {val}.0
              </text>
            </g>
          )
        })}

        {/* Vertical axis spine */}
        <line
          x1={PLOT_LEFT}
          y1={PLOT_TOP}
          x2={PLOT_LEFT}
          y2={PLOT_BOTTOM}
          stroke="var(--glass-wall)"
          strokeWidth={1.5}
        />
        <text
          x={34}
          y={(PLOT_TOP + PLOT_BOTTOM) / 2}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={700}
          fill="var(--fg-muted)"
        >
          i
        </text>

        {/* X-axis molality ticks */}
        {(['0.1 m', '0.01 m', '0.001 m', '∞'] as const).map((lbl, cIdx) => {
          const x = plotX(cIdx)
          return (
            <g key={lbl}>
              <line
                x1={x}
                y1={PLOT_BOTTOM}
                x2={x}
                y2={PLOT_BOTTOM + 6}
                stroke="var(--glass-wall)"
                strokeWidth={1.4}
              />
              <text
                x={x}
                y={PLOT_BOTTOM + 26}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={cIdx === 3 ? 700 : 500}
                fill={cIdx === 3 ? 'var(--fg)' : 'var(--fg-muted)'}
              >
                {lbl}
              </text>
            </g>
          )
        })}
        <text
          x={(PLOT_LEFT + PLOT_RIGHT) / 2}
          y={PLOT_BOTTOM + 50}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-subtle)"
        >
          Increasing dilution → ion pairing fades
        </text>

        {/* All four NCERT Table 1.4 strong electrolyte curves */}
        {NCERT_VANT_HOFF_SALTS.map((salt) => {
          const vals = [salt.iAt01m, salt.iAt001m, salt.iAt0001m, salt.iComplete]
          const pts = vals.map((v, cIdx) => ({ x: plotX(cIdx), y: plotY(v) }))
          const pathD = pts
            .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(' ')
          const style = SALT_STYLES[salt.id] ?? { color: 'var(--accent)' }

          // Interpolated ambient tracer along curve
          const segPos = tracerU * 3
          const segIdx = Math.min(2, Math.floor(segPos))
          const segFrac = segPos - segIdx
          const tx = pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * segFrac
          const ty = pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * segFrac

          return (
            <g key={salt.id}>
              <path
                d={pathD}
                fill="none"
                stroke={style.color}
                strokeWidth={style.dashed ? 2.2 : 2.8}
                strokeDasharray={style.dashed ? '6 4' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p, idx) => (
                <circle
                  key={`${salt.id}-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r={style.dashed ? 4.2 : 4.8}
                  fill={style.dashed ? 'var(--surface)' : style.color}
                  stroke={style.dashed ? style.color : 'var(--surface)'}
                  strokeWidth={style.dashed ? 2 : 1.5}
                />
              ))}
              {!reducedMotion && (salt.id === 'k2so4' || salt.id === 'mgso4') && (
                <circle cx={tx} cy={ty} r={6.5} fill={style.color} opacity={0.35} />
              )}
            </g>
          )
        })}

        {/* Clean non-overlapping direct series labels */}
        <text
          x={PLOT_RIGHT + 10}
          y={plotY(3.0) + 5}
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={700}
          fill="var(--spot-1)"
        >
          K<Sub>2</Sub>SO<Sub>4</Sub> (3)
        </text>
        <text
          x={PLOT_RIGHT + 10}
          y={plotY(2.0) - 4}
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={700}
          fill="var(--ox)"
        >
          NaCl,{' '}
          <tspan fill="var(--accent)">KCl</tspan>
        </text>
        <text
          x={PLOT_RIGHT + 10}
          y={plotY(2.0) + 16}
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={700}
          fill="var(--spot-3)"
        >
          MgSO<Sub>4</Sub> (2)
        </text>
        {/* Label MgSO4 dip clearly at 0.1 m */}
        <text
          x={plotX(0) + 10}
          y={plotY(1.21) + 20}
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={600}
          fill="var(--spot-3)"
        >
          MgSO<Sub>4</Sub> (1.21)
        </text>

        {/* Borderless three-ratio strip below plot */}
        <line x1={38} y1={410} x2={542} y2={410} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
        <text
          x={116}
          y={440}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={14}
          fontWeight={700}
          fill="var(--fg)"
        >
          i = M<Sub>norm</Sub> / M<Sub>obs</Sub>
        </text>
        <text
          x={116}
          y={462}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          Molar mass
        </text>

        <line x1={202} y1={422} x2={202} y2={470} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
        <text
          x={290}
          y={440}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={14}
          fontWeight={700}
          fill="var(--fg)"
        >
          i = Obs. / Calc.
        </text>
        <text
          x={290}
          y={462}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          Colligative prop.
        </text>

        <line x1={378} y1={422} x2={378} y2={470} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
        <text
          x={464}
          y={440}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={14}
          fontWeight={700}
          fill="var(--fg)"
        >
          i = n<Sub>after</Sub> / n<Sub>before</Sub>
        </text>
        <text
          x={464}
          y={462}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          Active moles
        </text>
      </g>

      {/* ===================== STEP 4: FOUR COLLIGATIVE LAWS UNIFIED BY i ===================== */}
      <g opacity={equationsOpacity} style={{ pointerEvents: 'none' }}>
        <text
          x={290}
          y={48}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={16}
          fontWeight={700}
          fill="var(--fg)"
        >
          van’t Hoff Factor Scales All Four Colligative Laws
        </text>

        {/* Row 1: Relative lowering of vapour pressure */}
        <text
          x={42}
          y={114}
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg-muted)"
        >
          Vapour pressure
        </text>
        <text
          x={538}
          y={118}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={19}
          fontWeight={600}
          fill="var(--fg)"
        >
          (p<Sub>1</Sub><Sup>0</Sup> − p<Sub>1</Sub>) / p<Sub>1</Sub><Sup>0</Sup> ={' '}
          <tspan fill="var(--accent)" fontWeight={700} opacity={eqPulse}>
            i
          </tspan>{' '}
          · n<Sub>2</Sub> / n<Sub>1</Sub>
        </text>
        <line x1={42} y1={154} x2={538} y2={154} stroke="var(--border)" strokeWidth={1} opacity={0.65} />

        {/* Row 2: Boiling-point elevation */}
        <text
          x={42}
          y={212}
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg-muted)"
        >
          Boiling-point elevation
        </text>
        <text
          x={538}
          y={216}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={21}
          fontWeight={600}
          fill="var(--fg)"
        >
          ΔT<Sub>b</Sub> ={' '}
          <tspan fill="var(--accent)" fontWeight={700} opacity={eqPulse}>
            i
          </tspan>{' '}
          · K<Sub>b</Sub> · m
        </text>
        <line x1={42} y1={252} x2={538} y2={252} stroke="var(--border)" strokeWidth={1} opacity={0.65} />

        {/* Row 3: Freezing-point depression */}
        <text
          x={42}
          y={310}
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg-muted)"
        >
          Freezing-point depression
        </text>
        <text
          x={538}
          y={314}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={21}
          fontWeight={600}
          fill="var(--fg)"
        >
          ΔT<Sub>f</Sub> ={' '}
          <tspan fill="var(--accent)" fontWeight={700} opacity={eqPulse}>
            i
          </tspan>{' '}
          · K<Sub>f</Sub> · m
        </text>
        <line x1={42} y1={350} x2={538} y2={350} stroke="var(--border)" strokeWidth={1} opacity={0.65} />

        {/* Row 4: Osmotic pressure */}
        <text
          x={42}
          y={408}
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg-muted)"
        >
          Osmotic pressure
        </text>
        <text
          x={538}
          y={412}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={21}
          fontWeight={600}
          fill="var(--fg)"
        >
          Π ={' '}
          <tspan fill="var(--accent)" fontWeight={700} opacity={eqPulse}>
            i
          </tspan>{' '}
          · C · R · T
        </text>
      </g>

      {/* Understated single-line scientific working equation at bottom */}
      <text
        x={290}
        y={516}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg-muted)"
      >
        {cfg.mode === 'baseline' && (
          <>
            i = 1.00 · M<Sub>obs</Sub> = M<Sub>norm</Sub>
          </>
        )}
        {cfg.mode === 'dissociation' && (
          <>
            i = 1 + (n − 1)α · M<Sub>obs</Sub> = M<Sub>norm</Sub> / i
          </>
        )}
        {cfg.mode === 'association' && (
          <>
            i = 1 − (1 − 1/n)α · M<Sub>obs</Sub> = M<Sub>norm</Sub> / i
          </>
        )}
        {cfg.mode === 'definitions' && <>m → 0 ⇒ ion pairing vanishes ⇒ i → n</>}
        {cfg.mode === 'equations' && <>All four colligative properties scale directly with i</>}
      </text>
    </svg>
  )
}
