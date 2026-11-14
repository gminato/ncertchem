/**
 * Target states for the IonizationTrends Scrolly. Each Step is one deterministic state of
 * the animation. The live state tweens from wherever it is to the next target, so
 * scrolling either way lands on the same picture.
 */

/** Number of Steps in the IonizationTrends Scrolly. */
export const IONIZATION_STEP_COUNT = 4

/** Which pair of orbital diagrams is on show. */
export type IonizationPair = 'none' | 'BeB' | 'NO'

export interface IonizationSnapshot {
  /** How far the period 2 and period 3 lines have been drawn, 0 to 1. */
  periodDraw: number
  /** Opacity of the period charts, 0 to 1. */
  periodAlpha: number
  /** Strength of the anomaly callouts, 0 to 1. Callouts show above 0.5. */
  dips: number
  /** Opacity of the orbital diagram panel, 0 to 1. */
  boxes: number
  /** How far the group 1 line has been drawn, 0 to 1. */
  groupDraw: number
  /** Opacity of the group 1 chart, 0 to 1. */
  groupAlpha: number
}

/** Clamps a Step index into range, so a stray value never breaks the animation. */
export function clampIonizationStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(IONIZATION_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** The state the animation starts from, before the first Step tween. */
export const IONIZATION_START: IonizationSnapshot = {
  periodDraw: 0,
  periodAlpha: 1,
  dips: 0,
  boxes: 0,
  groupDraw: 0,
  groupAlpha: 0,
}

/** Target state for each Step. */
export function ionizationTargetForStep(step: number): IonizationSnapshot {
  switch (clampIonizationStep(step)) {
    case 0:
      return { periodDraw: 1, periodAlpha: 1, dips: 1, boxes: 0, groupDraw: 0, groupAlpha: 0 }
    case 1:
    case 2:
      return { periodDraw: 1, periodAlpha: 0, dips: 0, boxes: 1, groupDraw: 0, groupAlpha: 0 }
    default:
      return { periodDraw: 1, periodAlpha: 0, dips: 0, boxes: 0, groupDraw: 1, groupAlpha: 1 }
  }
}

/** Which orbital diagram pair a Step shows. */
export function ionizationPairForStep(step: number): IonizationPair {
  switch (clampIonizationStep(step)) {
    case 1:
      return 'BeB'
    case 2:
      return 'NO'
    default:
      return 'none'
  }
}

/** A short description of the Step, for the screen-reader live region. */
export function ionizationStepDescription(step: number): string {
  switch (clampIonizationStep(step)) {
    case 0:
      return 'Period 2 and period 3 first ionization enthalpies rise across each period, with dips at boron and oxygen in period 2 and at aluminium and sulphur in period 3.'
    case 1:
      return 'Beryllium and boron: beryllium loses a 2s electron, boron loses a 2p electron, which is more shielded.'
    case 2:
      return 'Nitrogen and oxygen: nitrogen has three unpaired 2p electrons. Oxygen has a paired 2p orbital, so its fourth electron is easier to remove.'
    default:
      return 'Group 1 first ionization enthalpies fall down the group, as the outer electron moves further from the nucleus and shielding increases.'
  }
}
