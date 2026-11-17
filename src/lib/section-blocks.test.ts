import { describe, expect, it } from 'vitest'
import { checkNumbers, checkProblems, countBlocks, findChecks } from './section-blocks'

describe('countBlocks', () => {
  it('counts each kind of block in a Section', () => {
    const mdx = [
      '<Hook>Why only those colours?</Hook>',
      '<Scrolly animation="bohr-emission">',
      '<Step>One</Step>',
      '</Scrolly>',
      '<Check n={1} options={["a", "b"]} answer={0} explanation="x">Q</Check>',
      '<Simulation name="hydrogen-spectrum" title="Hydrogen spectrum" />',
      '<Check n={2} numeric answer={656} explanation="y">Q</Check>',
    ].join('\n')
    expect(countBlocks(mdx)).toEqual({ simulations: 1, animations: 1, checks: 2 })
  })

  it('returns zeros for plain Prose', () => {
    expect(countBlocks('Light is an electromagnetic wave.')).toEqual({
      simulations: 0,
      animations: 0,
      checks: 0,
    })
  })

  it('does not count a longer component name or a closing tag', () => {
    expect(countBlocks('<SimulationControls /> <Checklist> </Check> </Scrolly>')).toEqual({
      simulations: 0,
      animations: 0,
      checks: 0,
    })
  })

  it('counts two blocks on one line', () => {
    expect(countBlocks('<Check answer={0}/><Check answer={1}/>').checks).toBe(2)
  })
})

describe('countBlocks and the Checks a Learner builds', () => {
  it('counts a ConfigBuilder as a Check', () => {
    expect(countBlocks('<Check n={1} answer={0}/>\n<ConfigBuilder n="config-N" element="N" />').checks).toBe(2)
  })
})

describe('checkNumbers', () => {
  it('reads n written as a number, as a string and as a string in braces', () => {
    const mdx = [
      '<Check n={1} answer={0} explanation="x">Q</Check>',
      '<Check n="4f" numeric answer={14} explanation="y">Q</Check>',
      "<Check n={'cr-unpaired'} numeric answer={6} explanation=\"z\">Q</Check>",
      '<ConfigBuilder n="config-N" element="N" />',
    ].join('\n')
    expect(checkNumbers(mdx)).toEqual(['1', '4f', 'cr-unpaired', 'config-N'])
  })

  it('finds n when it is not the first attribute, and when the tag spans lines', () => {
    const mdx = [
      '<Check',
      '  numeric',
      '  options={["a > b", "{c}"]}',
      '  explanation={<p>Bohr\'s model gives n = 3, so 2n = 6.</p>}',
      '  n={2}',
      '  answer={1}',
      '>',
      'Which is larger?',
      '</Check>',
    ].join('\n')
    expect(checkNumbers(mdx)).toEqual(['2'])
  })

  it('is not misled by "n=" inside another attribute or inside the question', () => {
    const mdx = '<Check question="Shell n=3 holds how many electrons?" explanation="2n² with n={3}" n={7} answer={18} numeric>For n={3}?</Check>'
    expect(checkNumbers(mdx)).toEqual(['7'])
  })

  it('leaves out a Check that has no n, or an n that is not a plain value', () => {
    expect(checkNumbers('<Check answer={0}/><Check n={index} answer={1}/><Check n={3} answer={1}/>')).toEqual(['3'])
  })

  it('gives nothing for plain Prose', () => {
    expect(checkNumbers('Light is an electromagnetic wave.')).toEqual([])
  })
})

describe('findChecks', () => {
  it('lists every Check in order, with a null n where none can be read', () => {
    expect(findChecks('<Check n={1}/><ConfigBuilder element="O" /><Checklist n={9}/>')).toEqual([
      { tag: 'Check', n: '1' },
      { tag: 'ConfigBuilder', n: null },
    ])
  })
})

describe('checkProblems', () => {
  it('is empty when every Check has its own n', () => {
    expect(checkProblems('<Check n={1} answer={0}/><Check n={2} answer={0}/>')).toEqual([])
  })

  it('reports a Check with no n', () => {
    const problems = checkProblems('<Check n={1} answer={0}/><ConfigBuilder element="O" />')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('<ConfigBuilder> number 2')
    expect(problems[0]).toContain('no explicit n')
  })

  it('reports a repeated n', () => {
    const problems = checkProblems('<Check n={1} answer={0}/><Check n="1" answer={0}/>')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('repeats n="1"')
  })
})
