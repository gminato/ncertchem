'use client'

import { useMemo } from 'react'
import katex from 'katex'
import { IceTable, IonisationBeaker } from '@/components/equilibrium'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { weakAcidSteps, WEAK_ACID_STEP_COUNT, concText, percentText, sciText } from './weakacid-steps'
import styles from './WeakAcid.module.css'

export interface WeakAcidProps {
  step: number
  reducedMotion: boolean
}

const STEPS = weakAcidSteps()

/** A TeX string rendered by KaTeX, compact so the panel keeps its height. */
function Tex({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false }), [tex])
  return <div className={styles.tex} dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * Benzoic acid at three concentrations, one per Step: the beaker shows the ionised fraction α from the
 * library's quadratic, and the ICE table beneath it fills in I, C and E. Dilution raises α while Ka
 * stays put. The readout shows whether the x ≪ c shortcut is still within its 5 % limit.
 */
export function WeakAcid({ step, reducedMotion }: WeakAcidProps) {
  const index = Math.min(WEAK_ACID_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = STEPS[index]
  const r = current.report
  const fraction = useTweenedNumber(current.beakerFraction, reducedMotion, 1.0)
  const solved = current.revealStep === 3

  const ph = r.pH.toFixed(2)
  const hText = sciText(r.hConc)
  const shortcut = percentText(r.alphaApprox)

  return (
    <div className={styles.stage} data-testid="weak-acid" data-step={index}>
      <svg
        viewBox="0 0 580 312"
        role="img"
        aria-label={
          solved
            ? `Beaker of benzoic acid at ${current.c} mol per litre with ${percentText(r.alpha)} ionised. [H₃O⁺] is ${hText} mol per litre and pH is ${ph}.`
            : `Beaker of benzoic acid at ${current.c} mol per litre, not yet ionised.`
        }
        className={styles.svg}
        data-testid="weak-acid-visual"
      >
        <g transform="translate(18, 0) scale(1.2)">
          <IonisationBeaker fractionIonised={fraction} molecules={36} seed={5} title={`Benzoic acid beaker, ${percentText(r.alpha)} ionised`} />
        </g>

        <g transform="translate(330, 26)" fontFamily="var(--font-sans)">
          <text x={0} y={0} fontSize={16} fill="var(--fg-muted)">
            C₆H₅COOH
          </text>
          <text x={0} y={30} fontSize={17} fill="var(--fg)">
            c = {current.c.toPrecision(3)} mol L⁻¹
          </text>
          {solved ? (
            <>
              <text x={0} y={92} fontSize={38} fontWeight={600} fill="var(--acid)" data-testid="alpha-value">
                α = {percentText(r.alpha)}
              </text>
              <text x={0} y={130} fontSize={17} fill="var(--fg)">
                [H₃O⁺] = {hText}
              </text>
              <text x={0} y={154} fontSize={17} fill="var(--fg)">
                mol L⁻¹, pH = {ph}
              </text>
              <text x={0} y={204} fontSize={15} fill="var(--fg-muted)">
                Shortcut √(Ka/c) = {shortcut}
              </text>
              <text
                x={0}
                y={226}
                fontSize={15}
                fontWeight={600}
                fill={r.approximationHolds ? 'var(--fwd)' : 'var(--rev)'}
                data-testid="shortcut-verdict"
              >
                {r.approximationHolds ? 'Under 5 %: x ≪ c holds' : 'Over 5 %: use the quadratic'}
              </text>
            </>
          ) : (
            <>
              <text x={0} y={92} fontSize={38} fontWeight={600} fill="var(--fg-muted)">
                α = 0
              </text>
              <text x={0} y={130} fontSize={16} fill="var(--fg-muted)">
                Nothing has ionised yet.
              </text>
            </>
          )}
        </g>
      </svg>

      <div className={styles.table}>
        <IceTable
          species={['[HA]', '[H₃O⁺]', '[A⁻]']}
          initial={[current.c.toPrecision(3), '0', '0']}
          change={['−x', '+x', '+x']}
          equilibrium={[concText(r.ice.equilibrium.HA), concText(r.ice.equilibrium.H3O), concText(r.ice.equilibrium.A)]}
          revealStep={current.revealStep}
          caption="mol L⁻¹: I, C and E rows for HA ⇌ H₃O⁺ + A⁻"
        />
      </div>

      <div className={styles.working} aria-live="polite">
        {index === 0 && <Tex tex="K_{a} = \dfrac{[\mathrm{H_3O^{+}}][\mathrm{A^{-}}]}{[\mathrm{HA}]} = 6.5 \times 10^{-5}" />}
        {index === 1 && (
          <>
            <Tex tex="6.5 \times 10^{-5} = \dfrac{0.200\,\alpha^{2}}{1 - \alpha}" />
            <Tex tex={`\\text{Positive root: } \\alpha = ${r.alpha.toFixed(4)}`} />
          </>
        )}
        {index === 2 && (
          <>
            <Tex tex={`\\alpha = ${r.alpha.toFixed(4)}`} />
            <Tex tex={`\\sqrt{K_a/c} = ${r.alphaApprox.toFixed(4)} > 0.05 \\;\\text{(shortcut fails)}`} />
          </>
        )}
        {index === 3 && (
          <>
            <Tex tex={`\\alpha = ${r.alpha.toFixed(3)}`} />
            <Tex tex={`\\sqrt{K_a/c} = ${r.alphaApprox.toFixed(3)} > 0.05 \\;\\text{(shortcut fails)}`} />
          </>
        )}
        {index === 4 && <Tex tex={`\\mathrm{pH} = -\\log_{10}(${sciText(r.hConc)}) = ${ph}`} />}
      </div>
    </div>
  )
}
