import React, { forwardRef, useMemo } from 'react'
import { wavelengthToCss, wavelengthToRgb } from '@/lib/chem/wavelength-color'

export interface PhotonProps extends React.SVGAttributes<SVGGElement> {
  wavelengthNm: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  x?: number
  y?: number
  length?: number
  angle?: number
  amplitude?: number
  scale?: number
}

/**
 * Maps physical wavelength in nanometers (100–2000 nm) to a visually pleasing
 * oscillation period (wavelength of the wiggle) in pixels.
 * Shorter physical wavelengths produce tighter wiggles; longer physical wavelengths produce wider wiggles.
 */
export function mapWavelengthToVisualPeriod(nm: number): number {
  const clamped = Math.max(100, Math.min(2200, nm))
  const t = (clamped - 100) / 2100
  return 10 + 32 * Math.pow(t, 0.6)
}

/**
 * Generates an SVG path string for a Gaussian-windowed sine wave packet.
 */
function buildWavePacketPath(
  startX: number,
  startY: number,
  length: number,
  angleRad: number,
  amplitude: number,
  visualLambda: number
): string {
  const sampleCount = Math.max(60, Math.round(length * 0.8))
  const cosA = Math.cos(angleRad)
  const sinA = Math.sin(angleRad)

  // Gaussian envelope parameter: 2.6 sigma at boundaries
  const sigma = length / 5.2
  const gEnd = Math.exp(-Math.pow(length / (2 * sigma), 2) / 2)

  const points: string[] = []

  for (let i = 0; i <= sampleCount; i++) {
    const s = (i / sampleCount) * length
    const u = (s - length / 2) / sigma
    const gRaw = Math.exp(-(u * u) / 2)
    // Normalize envelope so it decays smoothly to exactly 0 at ends
    const envelope = Math.max(0, (gRaw - gEnd) / (1 - gEnd))

    // Centered sine wave oscillation
    const oscillation = Math.sin((2 * Math.PI * (s - length / 2)) / visualLambda)
    const displacement = amplitude * envelope * oscillation

    // Coordinate rotation from packet local frame to canvas
    const px = startX + s * cosA - displacement * sinA
    const py = startY + s * sinA + displacement * cosA

    const command = i === 0 ? 'M' : 'L'
    points.push(`${command}${px.toFixed(2)},${py.toFixed(2)}`)
  }

  return points.join(' ')
}

export const Photon = forwardRef<SVGGElement, PhotonProps>(function Photon(
  {
    wavelengthNm,
    x1,
    y1,
    x2,
    y2,
    x = 0,
    y = 0,
    length = 120,
    angle = 0,
    amplitude = 9,
    scale = 1,
    className,
    style,
    ...rest
  },
  ref
) {
  const spectralColor = useMemo(() => wavelengthToRgb(wavelengthNm), [wavelengthNm])
  const cssColor = useMemo(() => wavelengthToCss(wavelengthNm), [wavelengthNm])

  const { startX, startY, packetLength, angleRad } = useMemo(() => {
    if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
      const dx = x2 - x1
      const dy = y2 - y1
      const dist = Math.sqrt(dx * dx + dy * dy)
      const rad = Math.atan2(dy, dx)
      return { startX: x1, startY: y1, packetLength: dist, angleRad: rad }
    }
    return {
      startX: x,
      startY: y,
      packetLength: length,
      angleRad: (angle * Math.PI) / 180,
    }
  }, [x1, y1, x2, y2, x, y, length, angle])

  const pathData = useMemo(() => {
    const visualPeriod = mapWavelengthToVisualPeriod(wavelengthNm)
    return buildWavePacketPath(
      startX,
      startY,
      packetLength,
      angleRad,
      amplitude,
      visualPeriod
    )
  }, [startX, startY, packetLength, angleRad, amplitude, wavelengthNm])

  return (
    <g
      ref={ref}
      transform={scale !== 1 ? `scale(${scale})` : undefined}
      className={className}
      style={{
        filter: spectralColor.visible
          ? `drop-shadow(0 0 calc(4px * var(--glow-strength)) ${cssColor})`
          : undefined,
        ...style,
      }}
      {...rest}
    >
      <path
        d={pathData}
        fill="none"
        stroke={cssColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={spectralColor.visible ? undefined : '5 4'}
      />
    </g>
  )
})
