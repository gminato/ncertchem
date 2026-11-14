import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Design Tokens in src/styles/tokens.css', () => {
  const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css')
  const content = fs.readFileSync(tokensPath, 'utf8')

  it('defines all required surface tokens', () => {
    expect(content).toContain('--bg')
    expect(content).toContain('--surface')
    expect(content).toContain('--surface-raised')
    expect(content).toContain('--border')
  })

  it('defines all required text tokens', () => {
    expect(content).toContain('--fg')
    expect(content).toContain('--fg-muted')
    expect(content).toContain('--fg-subtle')
  })

  it('defines accent tokens', () => {
    expect(content).toContain('--accent')
    expect(content).toContain('--accent-soft')
  })

  it('defines all required visual vocabulary entity colors and glow strength', () => {
    expect(content).toContain('--electron')
    expect(content).toContain('--proton')
    expect(content).toContain('--neutron')
    expect(content).toContain('--nucleus-glow')
    expect(content).toContain('--orbit')
    expect(content).toContain('--orbit-active')
    expect(content).toContain('--glow-strength')
  })

  it('defines typography font family tokens', () => {
    expect(content).toContain('--font-serif')
    expect(content).toContain('--font-sans')
    expect(content).toContain('--font-mono')
  })

  it('defines spacing scale --space-1 through --space-8', () => {
    for (let i = 1; i <= 8; i++) {
      expect(content).toContain(`--space-${i}`)
    }
  })

  it('defines radii and easing tokens', () => {
    expect(content).toContain('--radius-sm')
    expect(content).toContain('--radius-md')
    expect(content).toContain('--radius-lg')
    expect(content).toContain('--ease-out')
  })

  it('contains dark theme overrides via [data-theme="dark"] and media query', () => {
    expect(content).toContain('[data-theme="dark"]')
    expect(content).toContain('@media (prefers-color-scheme: dark)')
    expect(content).toContain(':root:not([data-theme="light"])')
  })
})
