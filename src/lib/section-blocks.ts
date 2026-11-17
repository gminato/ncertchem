/** How many of each visual block a Section holds. */
export interface BlockCounts {
  /** `<Simulation>` blocks. */
  simulations: number
  /** `<Scrolly>` blocks, each one a Scrolly Animation. */
  animations: number
  /** Checks: `<Check>` blocks and `<ConfigBuilder>` blocks, which are Checks the Learner builds. */
  checks: number
}

/** The MDX components that are Checks. */
const CHECK_TAGS = ['Check', 'ConfigBuilder'] as const

function countTag(mdx: string, tag: string): number {
  // The character after the name keeps <Check> apart from a longer name such as <Checklist>.
  return mdx.match(new RegExp(`<${tag}[\\s/>]`, 'g'))?.length ?? 0
}

/** Counts the Simulations, Scrolly Animations and Checks in a Section's MDX source. */
export function countBlocks(mdx: string): BlockCounts {
  return {
    simulations: countTag(mdx, 'Simulation'),
    animations: countTag(mdx, 'Scrolly'),
    checks: CHECK_TAGS.reduce((sum, tag) => sum + countTag(mdx, tag), 0),
  }
}

/** One Check found in a Section's MDX source. */
export interface CheckTag {
  tag: (typeof CHECK_TAGS)[number]
  /** The Check's number, from its `n` attribute. Null when the tag has no `n` that can be read. */
  n: string | null
}

/**
 * Reads the value of the `n` attribute from the text that follows a tag name.
 *
 * It walks the attributes one at a time. A quoted value ends at its matching quote. A value in
 * braces ends at its matching brace, and only braces are counted inside it: quotes are not
 * tracked there, because a brace value may hold JSX text with a lone apostrophe.
 */
function readN(mdx: string, from: number): string | null {
  let i = from
  while (i < mdx.length) {
    while (i < mdx.length && /\s/.test(mdx[i])) i++
    if (i >= mdx.length || mdx[i] === '>' || mdx[i] === '/') return null

    const nameStart = i
    while (i < mdx.length && /[\w$:.-]/.test(mdx[i])) i++
    if (i === nameStart) return null
    const name = mdx.slice(nameStart, i)

    if (mdx[i] !== '=') continue
    i++

    let value: string
    const open = mdx[i]
    if (open === '"' || open === "'") {
      const close = mdx.indexOf(open, i + 1)
      if (close === -1) return null
      value = mdx.slice(i + 1, close)
      i = close + 1
    } else if (open === '{') {
      let depth = 0
      let j = i
      for (; j < mdx.length; j++) {
        if (mdx[j] === '{') depth++
        else if (mdx[j] === '}' && --depth === 0) break
      }
      if (j >= mdx.length) return null
      const inner = mdx.slice(i + 1, j).trim()
      i = j + 1
      // A number, or a string literal, is a Check number. Anything else is an expression.
      const literal = /^(?:(-?\d+(?:\.\d+)?)|"([^"]*)"|'([^']*)'|`([^`$]*)`)$/.exec(inner)
      if (name === 'n' && !literal) return null
      value = literal ? (literal[1] ?? literal[2] ?? literal[3] ?? literal[4] ?? '') : inner
    } else {
      return null
    }

    if (name === 'n') return value === '' ? null : value
  }
  return null
}

/** Every Check in a Section's MDX source, in the order the Learner meets them. */
export function findChecks(mdx: string): CheckTag[] {
  const pattern = new RegExp(`<(${CHECK_TAGS.join('|')})(?=[\\s/>])`, 'g')
  const found: CheckTag[] = []
  for (const match of mdx.matchAll(pattern)) {
    const tag = match[1] as CheckTag['tag']
    found.push({ tag, n: readN(mdx, match.index + match[0].length) })
  }
  return found
}

/**
 * The numbers of the Checks a Section holds, in order. Progress is recorded against these, so
 * every Check needs its own explicit `n`. A Check without one is left out; `checkProblems` reports it.
 */
export function checkNumbers(mdx: string): string[] {
  const numbers: string[] = []
  for (const check of findChecks(mdx)) {
    if (check.n !== null && !numbers.includes(check.n)) numbers.push(check.n)
  }
  return numbers
}

/** What is wrong with the Check numbers of a Section. Empty when all is well. */
export function checkProblems(mdx: string): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  findChecks(mdx).forEach((check, index) => {
    const where = `<${check.tag}> number ${index + 1} in the Section`
    if (check.n === null) {
      problems.push(`${where} has no explicit n. Give it one, such as n={${index + 1}}.`)
    } else if (seen.has(check.n)) {
      problems.push(`${where} repeats n="${check.n}". Every Check in a Section needs its own n.`)
    } else {
      seen.add(check.n)
    }
  })
  return problems
}
