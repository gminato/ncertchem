import { describe, expect, it } from 'vitest'
import { countBlocks } from './section-blocks'

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
