import { solveIce, type IceTable } from '@/lib/chem/equilibrium'
import { NOCL_K, NOCL_REACTION, NOCL_START } from './example'

/** The ICE table for the worked example, solved by the library. */
export function iceExample(): IceTable {
  return solveIce(NOCL_REACTION, { ...NOCL_START }, NOCL_K, { basis: 'concentration' })
}

/** Number of Steps in the ICE Scrolly. */
export const ICE_STEP_COUNT = 5
