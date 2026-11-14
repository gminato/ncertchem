'use client'

import { Label, Photon } from '@/components/vocab'
import { photonMomentum } from '@/lib/chem/wave-orbit'
import { Scientific, Sup, splitScientific } from './notation'
import { useTweenedValues } from './useTweenedValues'
import {
  LONG_WAVELENGTH_NM,
  MICROSCOPE_STEP_COUNT,
  SHORT_WAVELENGTH_NM,
  microscopeTargets,
  shortLightKickRatio,
} from './quantum-steps'
import styles from './visuals.module.css'

export interface HeisenbergMicroscopeProps {
  step: number
  reducedMotion: boolean
}

// Sized for a ~570px visual panel: labels are 14 units and read at about 14px.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 300
const ELECTRON = { x: 290, y: 118 }
const LIGHT_START_X = 24

const longSci = splitScientific(photonMomentum(LONG_WAVELENGTH_NM * 1e-9))
const shortSci = splitScientific(photonMomentum(SHORT_WAVELENGTH_NM * 1e-9))
const ratioText = `${Math.round(shortLightKickRatio())}`

/** Wavelength of the light used at each Step, in nm. Null means no light is shown. */
const LIGHT_NM: readonly (number | null)[] = [null, LONG_WAVELENGTH_NM, SHORT_WAVELENGTH_NM, null]

/** Caption under the picture at each Step. Positions and lengths are not to scale. */
function caption(step: number): { line1: string; line2: string } {
  switch (step) {
    case 0:
      return {
        line1: 'Somewhere in this cloud, and we do not yet know where.',
        line2: 'To locate the electron, we must hit it with light.',
      }
    case 1:
      return {
        line1: 'Red light, 700 nm: the position is blurred to about 700 nm.',
        line2: '',
      }
    case 2:
      return {
        line1: 'X-rays, 0.1 nm: the position is sharp, but the kick is hard.',
        line2: '',
      }
    default:
      return {
        line1: 'A sharp position means an uncertain velocity.',
        line2: 'Both cannot be known exactly at the same time.',
      }
  }
}

/**
 * HeisenbergMicroscope: a thought experiment. To locate an electron to within a
 * distance, the light must have a wavelength about that size, and every photon
 * carries momentum h / λ into the electron. Long waves blur the position; short
 * waves sharpen it and kick the electron hard.
 */
export function HeisenbergMicroscope({ step, reducedMotion }: HeisenbergMicroscopeProps) {
  const targets = useTweenedValues(microscopeTargets(step), reducedMotion, 0.8)
  const s = Math.min(MICROSCOPE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const lightNm = LIGHT_NM[s]
  const text = caption(s)
  const kickEnd = ELECTRON.x + 18 + targets.kick

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="An electron, a cloud showing how well its position is known, a beam of light, and a recoil arrow. Long-wavelength light blurs the position; short-wavelength light sharpens it but gives a large kick."
        data-testid="heisenberg-microscope"
        data-step={step}
      >
        {/* Position cloud: the region the electron could be in */}
        <circle
          cx={ELECTRON.x}
          cy={ELECTRON.y}
          r={targets.cloud}
          strokeWidth={1.4}
          strokeDasharray="4 4"
          style={{ fill: 'var(--electron)', fillOpacity: 0.14, stroke: 'var(--electron)' }}
        />
        <circle cx={ELECTRON.x} cy={ELECTRON.y} r={7} style={{ fill: 'var(--electron)' }} />

        {/* Light that finds the electron */}
        {lightNm !== null && (
          <g opacity={targets.photon}>
            <Photon
              wavelengthNm={lightNm}
              x1={LIGHT_START_X}
              y1={ELECTRON.y}
              x2={ELECTRON.x - targets.cloud - 4}
              y2={ELECTRON.y}
              amplitude={10}
            />
          </g>
        )}

        {/* Recoil: the momentum the photon gives the electron, not to scale */}
        {targets.kick > 0 && (
          <g data-testid="recoil-arrow">
            <line
              x1={ELECTRON.x + 18}
              x2={kickEnd}
              y1={ELECTRON.y}
              y2={ELECTRON.y}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ stroke: 'var(--proton)' }}
            />
            <polygon
              points={`${kickEnd},${ELECTRON.y} ${kickEnd - 12},${ELECTRON.y - 8} ${kickEnd - 12},${ELECTRON.y + 8}`}
              style={{ fill: 'var(--proton)' }}
            />
            <Label x={ELECTRON.x + 18 + targets.kick / 2} y={ELECTRON.y - 24} fontSize={14} fill="var(--proton)">
              {`Recoil: about ${ratioText} × the electron's momentum`}
            </Label>
          </g>
        )}

        <Label x={ELECTRON.x} y={ELECTRON.y + 60} fontSize={14} fill="var(--electron)">
          {s === 0 ? 'Electron' : 'Electron (cloud not to scale)'}
        </Label>

        <Label x={VIEW_WIDTH / 2} y={218} fontSize={14} fill="var(--fg)">
          {text.line1}
        </Label>
        {text.line2 !== '' && (
          <Label x={VIEW_WIDTH / 2} y={240} fontSize={14} fill="var(--fg-muted)">
            {text.line2}
          </Label>
        )}
        {s === 1 && (
          <Label x={VIEW_WIDTH / 2} y={266} fontSize={14} fill="var(--fg-muted)">
            {'Recoil '}<tspan className="sym">p = h/λ</tspan>{' ≈ '}
            <Scientific mantissa={longSci.mantissa} exp={longSci.exp} />
            {' kg m s'}
            <Sup>−1</Sup>
          </Label>
        )}
        {s === 2 && (
          <Label x={VIEW_WIDTH / 2} y={266} fontSize={14} fill="var(--fg-muted)">
            {'Recoil '}<tspan className="sym">p = h/λ</tspan>{' ≈ '}
            <Scientific mantissa={shortSci.mantissa} exp={shortSci.exp} />
            {' kg m s'}
            <Sup>−1</Sup>
          </Label>
        )}
      </svg>
      <p className={styles.srOnly} aria-live="polite">
        {`${text.line1} ${text.line2}`}
      </p>
    </div>
  )
}
