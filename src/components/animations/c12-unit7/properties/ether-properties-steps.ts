import {
  BOILING_GAP_ALCOHOL_VS_ETHER_K,
  ETHER_ANGLE_DEG,
  ETHER_CO_LENGTH_PM,
  PHYSICAL_PROPERTY_RECORDS,
} from '@/lib/chem/c12-u7-s11-ethers'

export interface EtherPropertiesStepMeta {
  id: string
  title: string
  subtitle: string
}

export const ETHER_PROPERTIES_STEPS: readonly EtherPropertiesStepMeta[] = [
  {
    id: 'dipole-no-self-hbond',
    title: 'Bent C–O–C polarity, no self H-bonding',
    subtitle: `Angle ${ETHER_ANGLE_DEG}° creates net dipole, but pure ethers lack O–H`,
  },
  {
    id: 'boiling-point-bars',
    title: 'Boiling points at comparable molar mass',
    subtitle: `Ethoxyethane matches n-pentane, ${BOILING_GAP_ALCOHOL_VS_ETHER_K} K below butan-1-ol`,
  },
  {
    id: 'water-hbond-miscibility',
    title: 'In water: ether accepts H-bonds',
    subtitle: 'Oxygen lone pairs accept H-bonds from water (R₂O⋯H–O–H)',
  },
] as const

export const PROPERTIES_RECORDS = PHYSICAL_PROPERTY_RECORDS
export const ETHER_GEOMETRY = {
  angleDeg: ETHER_ANGLE_DEG,
  coLengthPm: ETHER_CO_LENGTH_PM,
  alcoholEtherBpGapK: BOILING_GAP_ALCOHOL_VS_ETHER_K,
} as const
