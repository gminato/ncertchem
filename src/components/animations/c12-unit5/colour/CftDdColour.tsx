'use client'

import { useId } from 'react'
import { WHEEL_SECTORS, wheelSectorIndex, type WheelSectorKey } from '@/lib/chem/ligand-colour-lab'
import { SEVEN_SPECTRAL_BANDS, cftDdStepState } from './cft-dd-colour-steps'

export interface CftDdColourProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 440
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'

/** Eight-sector complementary colour wheel where opposite sectors sit 180 degrees apart across the centre. */
function CompactWheel({
  cx,
  cy,
  radius,
  absorbed,
  seen,
  markerId,
}: {
  cx: number
  cy: number
  radius: number
  absorbed: WheelSectorKey
  seen: WheelSectorKey
  markerId: string
}) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const n = WHEEL_SECTORS.length
  const stepDeg = 360 / n
  const sectorAngle = (i: number) => -90 + stepDeg * (i + 0.5)
  const labelR = radius + 16
  const iAbs = wheelSectorIndex(absorbed)
  const iSeen = wheelSectorIndex(seen)

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {WHEEL_SECTORS.map((sector, i) => {
        const a0 = rad(-90 + stepDeg * i)
        const a1 = rad(-90 + stepDeg * (i + 1))
        const x0 = radius * Math.cos(a0)
        const y0 = radius * Math.sin(a0)
        const x1 = radius * Math.cos(a1)
        const y1 = radius * Math.sin(a1)
        const d = `M0 0 L${x0.toFixed(1)} ${y0.toFixed(1)} A${radius} ${radius} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`
        const isAbs = sector.key === absorbed
        const isSeen = sector.key === seen
        return (
          <path
            key={sector.key}
            d={d}
            fill={sector.fill}
            fillOpacity={isAbs ? 0.35 : 0.9}
            stroke={isAbs || isSeen ? FG : SURFACE}
            strokeWidth={isAbs || isSeen ? 2.5 : 1.6}
            strokeDasharray={isAbs ? '5 3' : undefined}
          />
        )
      })}
      {WHEEL_SECTORS.map((sector, i) => {
        const ang = sectorAngle(i)
        const c = Math.cos(rad(ang))
        const s = Math.sin(rad(ang))
        const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'
        const isMarked = sector.key === absorbed || sector.key === seen
        return (
          <text
            key={`lbl-${sector.key}`}
            x={(labelR * c).toFixed(1)}
            y={(labelR * s + (s > 0.65 ? 14 : s < -0.65 ? -4 : 5)).toFixed(1)}
            textAnchor={anchor}
            fontSize={15}
            fontWeight={isMarked ? 700 : 400}
            fill={isMarked ? FG : MUTED}
          >
            {sector.label}
          </text>
        )
      })}
      <line
        x1={(0.58 * radius * Math.cos(rad(sectorAngle(iAbs)))).toFixed(1)}
        y1={(0.58 * radius * Math.sin(rad(sectorAngle(iAbs)))).toFixed(1)}
        x2={(0.58 * radius * Math.cos(rad(sectorAngle(iSeen)))).toFixed(1)}
        y2={(0.58 * radius * Math.sin(rad(sectorAngle(iSeen)))).toFixed(1)}
        stroke={FG}
        strokeWidth={2.5}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
    </g>
  )
}

/**
 * Section 5.5.5 Scrolly 1: How a d to d transition in [Ti(H2O)6]3+ removes a
 * 498 nm blue-green band from white light and leaves complementary violet,
 * and how removing water collapses Delta_o to zero.
 */
export function CftDdColour({ step, reducedMotion }: CftDdColourProps) {
  const uid = useId().replace(/:/g, '')
  const arrowId = `cft-dd-arr-${uid}`
  const photonArrowId = `cft-dd-ph-${uid}`
  const s = cftDdStepState(step)
  const tr = reducedMotion ? 'none' : 'all 420ms cubic-bezier(0.22, 1, 0.36, 1)'

  // Lamp and beaker coordinates on the left half
  const lampX = 136
  const lampY = 38
  const beakerX = 76
  const beakerY = 148
  const beakerW = 120
  const beakerH = 112

  // Wavelength strip below the beaker (700 nm red on left -> 400 nm violet on right)
  const stripX = 24
  const stripY = 330
  const stripW = 245
  const stripH = 28
  const segW = stripW / SEVEN_SPECTRAL_BANDS.length

  // Energy diagram coordinates on the right half
  const diagX = 332
  const diagW = 200
  const baryY = 178
  const egY = s.ligandsPresent ? 104 : baryY
  const t2gY = s.ligandsPresent ? 236 : baryY
  const electronX = s.ligandsPresent ? (s.electronPromoted ? diagX + 61 : diagX + 36) : diagX + 19
  const electronY = s.ligandsPresent ? (s.electronPromoted ? egY : t2gY) : baryY

  // Six water ligand positions around the beaker centre (slide away on Step 4)
  const cxBeaker = beakerX + beakerW / 2
  const cyBeaker = beakerY + beakerH / 2 + 6
  const ligandAngles = [0, 60, 120, 180, 240, 300]
  const ligandR = s.ligandsPresent ? 40 : 68

  // Sine-wave photon path from 498 nm band toward the energy diagram, stopping cleanly left of the Delta_o bracket
  let photonPath = 'M 202 260'
  for (let i = 1; i <= 24; i++) {
    const t = i / 24
    const px = 202 + t * 104
    const py = 260 - t * 42 + Math.sin(t * Math.PI * 6) * 5.5
    photonPath += ` L ${px.toFixed(1)} ${py.toFixed(1)}`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.ariaLabel}>
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={FG} />
        </marker>
        <marker id={photonArrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="var(--db-ln)" />
        </marker>
      </defs>

      {/* Lamp emitting 7-band white light fan (red left to violet right) */}
      <g>
        <rect x={lampX - 24} y={16} width={48} height={20} rx={6} fill="var(--surface-raised)" stroke={FG} strokeWidth={2} />
        <ellipse cx={lampX} cy={38} rx={16} ry={6} fill="var(--spec-yellow)" fillOpacity={0.85} stroke={FG} strokeWidth={1.5} />
        <text x={lampX + 34} y={32} fontSize={16} fontWeight={600} fill={FG}>
          White light
        </text>
      </g>

      {/* Incoming 7-colour spectral fan from lamp into beaker */}
      <g>
        {SEVEN_SPECTRAL_BANDS.map((band, i) => {
          const topX = lampX - 18 + i * 6
          const botX = beakerX + 10 + i * 16.5
          const dimmedInBeam = s.absorbedBandId === band.id && !s.showExitBeam
          return (
            <line
              key={`in-${band.id}`}
              x1={topX}
              y1={lampY + 6}
              x2={botX}
              y2={beakerY + 12}
              stroke={dimmedInBeam ? MUTED : band.colour}
              strokeWidth={7}
              strokeOpacity={dimmedInBeam ? 0.28 : 0.9}
              strokeLinecap="round"
              style={{ transition: tr }}
            />
          )
        })}
      </g>

      {/* Beaker containing [Ti(H2O)6]3+ (or ligand-free Ti3+ on Step 4) */}
      <g>
        {/* Liquid */}
        <path
          d={`M ${beakerX + 5} ${beakerY + 26} H ${beakerX + beakerW - 5} V ${beakerY + beakerH - 12} Q ${beakerX + beakerW - 5} ${beakerY + beakerH - 4} ${beakerX + beakerW - 13} ${beakerY + beakerH - 4} H ${beakerX + 13} Q ${beakerX + 5} ${beakerY + beakerH - 4} ${beakerX + 5} ${beakerY + beakerH - 12} Z`}
          fill={s.beakerTint}
          style={{ transition: tr }}
        />

        {/* Central metal and 6 water ligands (slide away on Step 4) */}
        <circle cx={cxBeaker} cy={cyBeaker} r={12} fill="var(--accent)" fillOpacity={0.88} stroke={FG} strokeWidth={1.5} />
        <text x={cxBeaker} y={cyBeaker + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--accent-fg)">
          Ti
        </text>
        {ligandAngles.map((deg, idx) => {
          const rad = (deg * Math.PI) / 180
          const lx = cxBeaker + ligandR * Math.cos(rad)
          const ly = cyBeaker + ligandR * Math.sin(rad)
          return (
            <g
              key={idx}
              style={{
                transform: `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`,
                opacity: s.ligandsPresent ? 1 : 0.35,
                transition: tr,
              }}
            >
              <circle cx={0} cy={0} r={6} fill="var(--el-O)" stroke={SURFACE} strokeWidth={1} />
              <circle cx={-5} cy={4} r={3} fill="var(--el-H)" />
              <circle cx={5} cy={4} r={3} fill="var(--el-H)" />
            </g>
          )
        })}

        {/* Beaker glass outline */}
        <path
          d={`M ${beakerX} ${beakerY} V ${beakerY + beakerH - 12} Q ${beakerX} ${beakerY + beakerH} ${beakerX + 12} ${beakerY + beakerH} H ${beakerX + beakerW - 12} Q ${beakerX + beakerW} ${beakerY + beakerH} ${beakerX + beakerW} ${beakerY + beakerH - 12} V ${beakerY}`}
          fill="var(--glass-fill)"
          fillOpacity={0.14}
          stroke="var(--glass-wall)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <line
          x1={beakerX + 10}
          y1={beakerY + 14}
          x2={beakerX + 10}
          y2={beakerY + beakerH - 16}
          stroke="var(--glass-sheen)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>

      {/* Exit fan below beaker on Steps 3 and 4 */}
      {s.showExitBeam && (
        <g>
          {SEVEN_SPECTRAL_BANDS.map((band, i) => {
            const x = beakerX + 10 + i * 16.5
            const missing = s.absorbedBandId === band.id
            return (
              <line
                key={`out-${band.id}`}
                x1={x}
                y1={beakerY + beakerH + 4}
                x2={x}
                y2={beakerY + beakerH + 34}
                stroke={missing ? MUTED : band.colour}
                strokeWidth={missing ? 2 : 7}
                strokeDasharray={missing ? '4 4' : undefined}
                strokeOpacity={missing ? 0.4 : 0.92}
                strokeLinecap="round"
              />
            )
          })}
        </g>
      )}

      {/* Beaker caption */}
      <text x={cxBeaker} y={s.showExitBeam ? 314 : 284} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
        {s.beakerLabel}
      </text>

      {/* Wavelength axis strip (700 nm left -> 400 nm right, matching red left -> violet right) */}
      <g>
        {SEVEN_SPECTRAL_BANDS.map((band, i) => {
          const x = stripX + i * segW
          const isAbs = s.absorbedBandId === band.id
          return (
            <rect
              key={`strip-${band.id}`}
              x={x}
              y={stripY}
              width={segW}
              height={stripH}
              fill={isAbs ? 'var(--surface-raised)' : band.colour}
              fillOpacity={isAbs ? 1 : 0.9}
              stroke={isAbs ? FG : SURFACE}
              strokeWidth={isAbs ? 2 : 1}
              strokeDasharray={isAbs ? '4 3' : undefined}
              style={{ transition: tr }}
            />
          )
        })}
        <text x={stripX} y={stripY + stripH + 20} fontSize={16} fill={MUTED}>
          700 nm
        </text>
        <text x={stripX + stripW} y={stripY + stripH + 20} textAnchor="end" fontSize={16} fill={MUTED}>
          400 nm
        </text>
        {s.absorbedBandId && (
          <text
            x={stripX + 4.5 * segW}
            y={stripY + stripH + 42}
            textAnchor="middle"
            fontSize={16}
            fontWeight={600}
            fill={FG}
          >
            498 nm absorbed
          </text>
        )}
      </g>

      {/* Right panel: Step 0 summary note */}
      {s.step === 0 && (
        <g>
          <rect
            x={306}
            y={124}
            width={236}
            height={148}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.5}
          />
          <text x={424} y={160} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
            Full visible spectrum
          </text>
          <text x={424} y={194} textAnchor="middle" fontSize={16} fill={MUTED}>
            All seven bands enter
          </text>
          <text x={424} y={220} textAnchor="middle" fontSize={16} fill={MUTED}>
            at full brightness.
          </text>
          <text x={424} y={252} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
            Nothing removed yet
          </text>
        </g>
      )}

      {/* Right panel: Energy diagram (Steps 1, 2, 4) */}
      {s.showEnergyDiagram && (
        <g>
          <text x={diagX + diagW / 2} y={56} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
            {s.ligandsPresent ? 'Octahedral d levels (Ti³⁺, 3d¹)' : 'No ligands: degenerate d'}
          </text>

          {/* Upper eg level (2 boxes) or collapsed into 5 degenerate lines */}
          {s.ligandsPresent ? (
            <>
              <line x1={diagX + 36} y1={egY} x2={diagX + 86} y2={egY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
              <line x1={diagX + 104} y1={egY} x2={diagX + 154} y2={egY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
              <text x={diagX + 166} y={egY + 6} fontSize={17} fontWeight={700} fill={FG}>
                eg
              </text>

              {/* Lower t2g level (3 boxes) */}
              <line x1={diagX + 14} y1={t2gY} x2={diagX + 58} y2={t2gY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
              <line x1={diagX + 70} y1={t2gY} x2={diagX + 114} y2={t2gY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
              <line x1={diagX + 126} y1={t2gY} x2={diagX + 170} y2={t2gY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
              <text x={diagX + 178} y={t2gY + 6} fontSize={17} fontWeight={700} fill={FG}>
                t₂g
              </text>

              {/* Delta_o bracket */}
              <line x1={diagX - 6} y1={egY + 4} x2={diagX - 6} y2={t2gY - 4} stroke={MUTED} strokeWidth={2} />
              <line x1={diagX - 12} y1={egY + 4} x2={diagX} y2={egY + 4} stroke={MUTED} strokeWidth={2} />
              <line x1={diagX - 12} y1={t2gY - 4} x2={diagX} y2={t2gY - 4} stroke={MUTED} strokeWidth={2} />
              <text x={diagX - 16} y={(egY + t2gY) / 2 + 6} textAnchor="end" fontSize={17} fontWeight={700} fill={FG}>
                Δₒ
              </text>
            </>
          ) : (
            <>
              {[0, 1, 2, 3, 4].map((idx) => (
                <line
                  key={idx}
                  x1={diagX + 4 + idx * 38}
                  y1={baryY}
                  x2={diagX + 34 + idx * 38}
                  y2={baryY}
                  stroke={FG}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              ))}
              <text x={diagX + diagW / 2} y={baryY + 34} textAnchor="middle" fontSize={16} fontWeight={600} fill={MUTED}>
                5 equal d orbitals (Δₒ = 0)
              </text>
            </>
          )}

          {/* Single 3d electron dot with up arrow */}
          <g
            style={{
              transform: `translate(${electronX.toFixed(1)}px, ${(electronY - 14).toFixed(1)}px)`,
              transition: tr,
            }}
          >
            <circle cx={0} cy={0} r={10} fill="var(--electron)" />
            <line x1={0} y1={6} x2={0} y2={-6} stroke={SURFACE} strokeWidth={2} />
            <path d="M -3.5 -2 L 0 -7 L 3.5 -2" fill="none" stroke={SURFACE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Promotion arrow on Step 2 */}
          {s.electronPromoted && s.ligandsPresent && (
            <line
              x1={diagX + 60}
              y1={t2gY - 12}
              x2={diagX + 60}
              y2={egY + 14}
              stroke={FG}
              strokeWidth={2.2}
              strokeDasharray="5 4"
              markerEnd={`url(#${arrowId})`}
            />
          )}

          {/* Configuration caption */}
          <text x={diagX + diagW / 2} y={302} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
            {!s.ligandsPresent
              ? 'No gap: no d to d jump'
              : s.electronPromoted
                ? 't₂g¹ eg⁰ → t₂g⁰ eg¹'
                : 'Ground state: t₂g¹ eg⁰'}
          </text>
          <text x={diagX + diagW / 2} y={328} textAnchor="middle" fontSize={16} fill={MUTED}>
            {!s.ligandsPresent
              ? 'All light passes through'
              : s.electronPromoted
                ? 'hν = Δₒ (498 nm)'
                : 'Ready to absorb a photon'}
          </text>
        </g>
      )}

      {/* Wavy blue-green photon striking the electron on Step 2 */}
      {s.showPhoton && (
        <g>
          <path d={photonPath} fill="none" stroke="var(--db-ln)" strokeWidth={3} markerEnd={`url(#${photonArrowId})`} />
          <text x={240} y={216} fontSize={16} fontWeight={700} fill="var(--db-ln)">
            hν
          </text>
        </g>
      )}

      {/* Right panel: Complementary colour wheel on Step 3 */}
      {s.showWheel && (
        <g>
          <text x={422} y={48} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
            Complementary colour wheel
          </text>
          <CompactWheel cx={422} cy={174} radius={56} absorbed="green" seen="purple" markerId={arrowId} />
          <text x={422} y={292} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
            Absorbed: blue-green (498 nm)
          </text>
          <text x={422} y={318} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
            Seen: violet / purple (complement)
          </text>
        </g>
      )}

      {/* Bottom takeaway line */}
      <text x={W / 2} y={422} textAnchor="middle" fontSize={16} fill={MUTED}>
        {s.step === 4
          ? 'Without water ligands, splitting vanishes and the sample is colourless.'
          : s.step === 3
            ? 'The colour seen is the complement of the colour absorbed.'
            : 'Δₒ = hc / λ links the d-orbital gap directly to the absorbed wavelength.'}
      </text>
    </svg>
  )
}
