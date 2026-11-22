'use client'

import React from 'react'
import styles from '@/app/vocab/vocab.module.css'
import { MechanismProfile, MECHANISM_PROFILE_SIZE } from './MechanismProfile'
import { PlanarCation } from './PlanarCation'
import { PolarBond, POLAR_BOND_SIZE } from './PolarBond'
import { Polarimeter, POLARIMETER_SIZE } from './Polarimeter'
import { StereoCentre, STEREO_SIZE } from './StereoCentre'
import { PLANAR_CATION_SIZE } from './PlanarCation'
import { HALOGEN_TONE, ROLE_TONE } from './tones'

const brTone = HALOGEN_TONE.Br
const nuTone = ROLE_TONE.nucleophile

function Card({ label, title, children, description }: { label: string; title: string; children: React.ReactNode; description: string }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
        <svg viewBox={label} style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label={title}>
          {children}
        </svg>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <span>{title}</span>
        </div>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </article>
  )
}

const box = (s: { width: number; height: number }) => `0 0 ${s.width} ${s.height}`

/** Every organic6 drawing, in the states the Sections use: the same parts, shown together. */
export function OrganicGallery() {
  const alkyl = ['H', 'CH₃', 'C₂H₅'] as const
  return (
    <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))' }}>
      <Card
        label={box(STEREO_SIZE)}
        title="SN2: the reactant"
        description="The leaving group sits on the axis. The three other groups form an umbrella that opens away from it."
      >
        <StereoCentre umbrella={[{ label: alkyl[0] }, { label: alkyl[1] }, { label: alkyl[2] }]} leaving={{ label: 'Br', tone: brTone }} invert={0} />
      </Card>
      <Card
        label={box(STEREO_SIZE)}
        title="SN2: the transition state"
        description="The nucleophile and the leaving group share the carbon, each partly bonded (dashed). The three groups lie in one plane. Square brackets and a double dagger mark it."
      >
        <StereoCentre
          umbrella={[{ label: alkyl[0] }, { label: alkyl[1] }, { label: alkyl[2] }]}
          incoming={{ label: 'HO⁻', tone: nuTone, bondOrder: 0.5 }}
          leaving={{ label: 'Br', tone: brTone, bondOrder: 0.5 }}
          invert={0.5}
          bracketTS
        />
      </Card>
      <Card
        label={box(STEREO_SIZE)}
        title="SN2: the inverted product"
        description="The nucleophile is now fully bonded on the opposite side, and the umbrella has turned over. The configuration is inverted."
      >
        <StereoCentre umbrella={[{ label: alkyl[0] }, { label: alkyl[1] }, { label: alkyl[2] }]} incoming={{ label: 'HO', tone: nuTone }} invert={1} />
      </Card>
      <Card
        label={box(STEREO_SIZE)}
        title="A chiral carbon"
        description="Four different groups on one carbon make a stereocentre. The carbon bears H, CH₃, C₂H₅ and Br."
      >
        <StereoCentre umbrella={[{ label: alkyl[0] }, { label: alkyl[1] }, { label: alkyl[2] }]} axial={{ label: 'Br', tone: brTone }} />
      </Card>
      <Card
        label={box(STEREO_SIZE)}
        title="Its mirror image"
        description="The same four groups reflected in a mirror. It cannot be superimposed on the original, so it is a different molecule with the opposite sign of rotation."
      >
        <StereoCentre umbrella={[{ label: alkyl[0] }, { label: alkyl[1] }, { label: alkyl[2] }]} axial={{ label: 'Br', tone: brTone }} mirror />
      </Card>
      <Card
        label={box(POLAR_BOND_SIZE)}
        title="The C–Cl bond is polar"
        description="The halogen pulls the bonding pair, so carbon is δ+ and the halogen is δ−. The dipole arrow points to the halogen. The bond length is drawn to scale."
      >
        <PolarBond halogen="Cl" dipole ruler />
      </Card>
      <Card
        label={box(POLAR_BOND_SIZE)}
        title="The C–I bond is the longest"
        description="The halogen sphere grows from F to I, and the bond lengthens from C–F to C–I (NCERT Table 6.2)."
      >
        <PolarBond halogen="I" ruler />
      </Card>
      <Card
        label={box(POLARIMETER_SIZE)}
        title="Polarimeter: a clockwise rotation"
        description="Plane-polarised light turns through the sample. + means clockwise as seen by the observer. The angle is illustrative."
      >
        <Polarimeter angle={30} />
      </Card>
      <Card
        label={box(POLARIMETER_SIZE)}
        title="Polarimeter: an anticlockwise rotation"
        description="The same apparatus with the analyser turned the other way: − means anticlockwise."
      >
        <Polarimeter angle={-30} />
      </Card>
      <Card
        label={box(MECHANISM_PROFILE_SIZE)}
        title="One-step mechanism"
        description="SN2 has one hump: one transition state, with no intermediate."
      >
        <MechanismProfile kind="one-step" />
      </Card>
      <Card
        label={box(MECHANISM_PROFILE_SIZE)}
        title="Two-step mechanism"
        description="SN1 has two humps. The first is the higher, and the carbocation sits in the valley between them."
      >
        <MechanismProfile kind="two-step" />
      </Card>
      <Card
        label={box(PLANAR_CATION_SIZE)}
        title="A planar carbocation"
        description="The carbocation carbon is sp². Its three groups lie in one plane, with an empty p orbital above and below."
      >
        <PlanarCation />
      </Card>
      <Card
        label={box(PLANAR_CATION_SIZE)}
        title="Attack from either face"
        description="A nucleophile can reach the empty p orbital from the top face or the bottom face, so both faces are open to attack."
      >
        <PlanarCation attackTop attackBottom />
      </Card>
    </div>
  )
}
