'use client'

import React from 'react'
import styles from '@/app/vocab/vocab.module.css'
import { CollisionFlash, CatalystSurface, EnergyProfile, MaxwellBoltzmannCurve, Particle, PlotCurve, PlotFrame, PlotLine, PlotPoint, PlotSlopeTriangle, RateMeter, ReactionBox, Stopwatch } from './index'

/** The kinetics figures, in the order the Visual Vocabulary shows them. Client-side because the plot frame uses context and function props. */
export function KineticsGallery() {
  const r = (t: number) => Math.exp(-0.02 * t)
  const tangentSlope = -0.02 * r(40)
  return (
    <div className={styles.grid}>
      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 330" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Concentration of reactant falling against time, with an average-rate secant between two times, an instantaneous-rate tangent and its slope triangle">
            <PlotFrame x={84} y={18} width={488} height={250} domain={{ xMin: 0, xMax: 100, yMin: 0, yMax: 1 }} xTicks={[0, 25, 50, 75, 100]} yTicks={[0, 0.25, 0.5, 0.75, 1]} yTickFormat={(v) => v.toFixed(2)} xTitle="t / s" yTitle="[R] / mol L⁻¹">
              <PlotCurve points={Array.from({ length: 101 }, (_, i) => [i, r(i)] as [number, number])} tone="reactant" />
              <PlotLine from={{ x: 20, y: r(20) }} to={{ x: 60, y: r(60) }} tone="accent" width={2.4} />
              <PlotPoint at={{ x: 20, y: r(20) }} tone="accent" label="average rate" side="ne" />
              <PlotPoint at={{ x: 60, y: r(60) }} tone="accent" />
              <PlotLine through={{ x: 40, y: r(40) }} slope={tangentSlope} tone="product" dashed />
              <PlotPoint at={{ x: 40, y: r(40) }} tone="product" label="instantaneous rate" side="sw" />
              <PlotSlopeTriangle at={{ x: 54, y: r(40) + tangentSlope * 14 }} dx={14} slope={tangentSlope} dxLabel="Δt" dyLabel="Δ[R]" tone="product" />
            </PlotFrame>
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Average and instantaneous rate</span>
          </div>
          <p className={styles.cardDescription}>
            The secant joins two points on the curve and gives the average rate. The tangent touches the curve at one instant, and its slope is the instantaneous rate.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 330" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Natural logarithm of the reactant concentration against time, a straight line falling below zero with slope minus k">
            <PlotFrame x={84} y={18} width={488} height={250} domain={{ xMin: 0, xMax: 100, yMin: -2.5, yMax: 0.5 }} xTicks={[0, 25, 50, 75, 100]} yTicks={[-2.5, -2, -1.5, -1, -0.5, 0, 0.5]} yTickFormat={(v) => v.toFixed(1)} xTitle="t / s" yTitle="ln[R]">
              <PlotLine from={{ x: 0, y: 0 }} to={{ x: 100, y: -2 }} tone="reactant" width={3} />
              <PlotPoint at={{ x: 0, y: 0 }} tone="reactant" label="ln[R]₀" side="ne" />
              <PlotSlopeTriangle at={{ x: 50, y: -1 }} dx={20} slope={-0.02} dxLabel="Δt = 20 s" dyLabel="−0.40" tone="product" />
              <PlotPoint at={{ x: 100, y: -2 }} tone="reactant" label="slope = −k" side="sw" />
            </PlotFrame>
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>First order: a straight line</span>
          </div>
          <p className={styles.cardDescription}>
            Plotting ln[R] against time gives a straight line. Its slope is −k, and the axis runs below zero because the logarithm of a concentration under one is negative.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 320" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Potential energy against reaction coordinate for a one-step reaction, with activation energy, enthalpy change and a lower catalysed path between the same reactant and product levels">
            <EnergyProfile
              x={70}
              y={20}
              width={470}
              height={240}
              reactant={0}
              product={-40}
              profile={[0, 90, -40]}
              catalysed={[0, 55, -40]}
              reactantsLabel="Reactants"
              productsLabel="Products"
              peakLabel="Activated complex"
              catalysedLabel="catalysed path"
              eaLabel="Eₐ"
              dhLabel="ΔrH"
              xTitle="Reaction coordinate"
              yTitle="Potential energy"
            />
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Energy barrier and catalyst</span>
          </div>
          <p className={styles.cardDescription}>
            Eₐ is the climb from the reactant level to the activated complex. A catalyst lowers the peak, and the catalysed path starts and ends at the same levels.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 320" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Two-step energy profile with an intermediate in a valley between two activated complexes">
            <EnergyProfile
              x={70}
              y={20}
              width={470}
              height={240}
              reactant={0}
              product={-30}
              profile={[0, 60, 25, 75, -30]}
              reactantsLabel="Reactants"
              productsLabel="Products"
              peakLabel="Activated complex"
              intermediateLabel="Intermediate"
              dhLabel="ΔrH"
              xTitle="Reaction coordinate"
              yTitle="Potential energy"
            />
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Two steps, one intermediate</span>
          </div>
          <p className={styles.cardDescription}>
            The intermediate sits in a valley between two barriers. The slower step, the higher peak, is the rate-determining step.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 330" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Maxwell-Boltzmann distributions at 300 K and 310 K with the fraction of molecules above the activation energy shaded">
            <MaxwellBoltzmannCurve x={84} y={18} width={488} height={250} temperatures={[300, 310]} ea={2.2} labels={['300 K', '310 K']} eaLabel="Eₐ" />
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Molecules at two temperatures</span>
          </div>
          <p className={styles.cardDescription}>
            Ten kelvin more makes the peak move right and drop, and the shaded tail beyond Eₐ grows. The total area under each curve is the same.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 300" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Molecules in a sealed vessel, with one effective collision flashing amber and one ineffective collision drawn faint">
            <ReactionBox x={120} y={20} width={360} height={230} caption="Sealed vessel">
              <Particle x={40} y={40} tone="reactant" r={13} />
              <Particle x={92} y={64} tone="reactant" r={13} />
              <Particle x={200} y={48} tone="reactant" r={13} />
              <Particle x={320} y={40} tone="reactant" r={13} />
              <Particle x={60} y={150} tone="reactant" r={13} />
              <Particle x={230} y={170} tone="reactant" r={13} />
              <Particle x={320} y={160} tone="reactant" r={13} />
              <Particle x={140} y={96} tone="reactant" r={13} />
              <Particle x={166} y={104} tone="reactant" r={13} />
              <CollisionFlash x={153} y={100} size={22} effective />
              <Particle x={262} y={106} tone="neutral" r={13} />
              <Particle x={282} y={122} tone="neutral" r={13} />
              <CollisionFlash x={272} y={114} size={16} effective={false} />
            </ReactionBox>
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Effective collisions</span>
          </div>
          <p className={styles.cardDescription}>
            Only collisions with enough energy and the right orientation react. The amber burst is effective, and the faint dashed one is not.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 230" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="A stopwatch reading 42.3 seconds">
            <Stopwatch x={215} y={20} size={190} seconds={42.3} />
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Timing a reaction</span>
          </div>
          <p className={styles.cardDescription}>
            The stopwatch sets the time at which each concentration is read.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 230" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Three rate meters on one scale: 2, 8 and 4 times ten to the minus four mol per litre per second">
            <RateMeter x={60} y={10} width={480} value={2} max={8} label="Experiment 1" valueLabel="2.0 × 10⁻⁴ mol L⁻¹ s⁻¹" tone="reactant" />
            <RateMeter x={60} y={80} width={480} value={8} max={8} label="Experiment 2" valueLabel="8.0 × 10⁻⁴ mol L⁻¹ s⁻¹" tone="product" />
            <RateMeter x={60} y={150} width={480} value={4} max={8} label="Experiment 3" valueLabel="4.0 × 10⁻⁴ mol L⁻¹ s⁻¹" tone="catalyst" />
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Initial rates on one scale</span>
          </div>
          <p className={styles.cardDescription}>
            Every meter uses the same full scale, so the bars compare directly.
          </p>
        </div>
      </article>

      <article className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="A metal surface with ten adsorption sites, five of them occupied by molecules">
            <CatalystSurface x={60} y={40} width={480} height={70} occupied={[true, false, true, false, true, false, true, false, true, false]} caption="Half the sites are occupied" />
          </svg>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardHeading}>
            <span>Catalyst surface</span>
          </div>
          <p className={styles.cardDescription}>
            Molecules bind to a fixed number of sites on the metal. When every site is busy, adding more gas does not speed the reaction.
          </p>
        </div>
      </article>
    </div>
  )
}
