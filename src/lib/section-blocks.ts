/** How many of each visual block a Section holds. */
export interface BlockCounts {
  /** `<Simulation>` blocks. */
  simulations: number
  /** `<Scrolly>` blocks, each one a Scrolly Animation. */
  animations: number
  /** `<Check>` blocks. */
  checks: number
}

function countTag(mdx: string, tag: string): number {
  // The character after the name keeps <Check> apart from a longer name such as <Checklist>.
  return mdx.match(new RegExp(`<${tag}[\\s/>]`, 'g'))?.length ?? 0
}

/** Counts the Simulations, Scrolly Animations and Checks in a Section's MDX source. */
export function countBlocks(mdx: string): BlockCounts {
  return {
    simulations: countTag(mdx, 'Simulation'),
    animations: countTag(mdx, 'Scrolly'),
    checks: countTag(mdx, 'Check'),
  }
}
