import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkNumbers } from '../section-blocks'
import publishedManifest from './published-checks.json'

/**
 * Learner Progress in `public.answered_checks`, `public.last_opened`, and browser `localStorage`
 * keys off `(section_slug, check_number)`. See docs/adr/0003-published-slugs-and-check-numbers-never-change.md.
 *
 * Adding new Sections or new Checks is allowed. Removing or renaming any published Section slug
 * or Check number must fail this suite.
 */

const CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../content')
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

type Manifest = Record<string, readonly string[]>

interface SectionRecord {
  file: string
  slug: string | null
  checks: string[]
}

function sectionFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sectionFiles(full)
    return entry.name.endsWith('.mdx') ? [full] : []
  })
}

function readSection(file: string): SectionRecord {
  const raw = fs.readFileSync(file, 'utf8')
  const match = raw.match(FRONTMATTER)
  const frontmatter = match?.[1] ?? ''
  const slugMatch = frontmatter.match(/^slug:\s*(?:"([^"]+)"|'([^']+)'|([^\s#]+))\s*$/m)
  const slug = slugMatch ? (slugMatch[1] ?? slugMatch[2] ?? slugMatch[3] ?? null) : null
  const body = match ? raw.slice(match[0].length) : raw
  return {
    file: path.relative(CONTENT_DIR, file),
    slug,
    checks: checkNumbers(body),
  }
}

interface GuardReport {
  missingSlugFiles: string[]
  duplicateSlugs: string[]
  missingPublishedSlugs: string[]
  missingPublishedChecks: string[]
}

function checkAgainstManifest(published: Manifest, sections: readonly SectionRecord[]): GuardReport {
  const missingSlugFiles: string[] = []
  const filesBySlug = new Map<string, string[]>()
  const checksBySlug = new Map<string, Set<string>>()

  for (const section of sections) {
    if (!section.slug) {
      missingSlugFiles.push(section.file)
      continue
    }
    const files = filesBySlug.get(section.slug) ?? []
    files.push(section.file)
    filesBySlug.set(section.slug, files)

    const checks = checksBySlug.get(section.slug) ?? new Set<string>()
    for (const n of section.checks) checks.add(n)
    checksBySlug.set(section.slug, checks)
  }

  const duplicateSlugs: string[] = []
  for (const [slug, files] of filesBySlug) {
    if (files.length > 1) {
      duplicateSlugs.push(`Duplicate Section slug "${slug}" in: ${files.join(', ')}`)
    }
  }

  const missingPublishedSlugs: string[] = []
  const missingPublishedChecks: string[] = []

  for (const [slug, publishedNumbers] of Object.entries(published)) {
    const currentNumbers = checksBySlug.get(slug)
    if (!currentNumbers) {
      missingPublishedSlugs.push(slug)
      continue
    }
    for (const n of publishedNumbers) {
      if (!currentNumbers.has(n)) {
        missingPublishedChecks.push(`${slug}:${n}`)
      }
    }
  }

  return {
    missingSlugFiles,
    duplicateSlugs,
    missingPublishedSlugs,
    missingPublishedChecks,
  }
}

const published: Manifest = publishedManifest
const currentSections = sectionFiles(CONTENT_DIR).map(readSection)
const report = checkAgainstManifest(published, currentSections)

describe('published Section slugs and Check numbers', () => {
  it('reads a slug from every Section file under content/', () => {
    expect(currentSections.length).toBeGreaterThan(0)
    expect(
      report.missingSlugFiles,
      `Section files missing a frontmatter slug:\n${report.missingSlugFiles.join('\n')}`,
    ).toEqual([])
  })

  it('has no duplicate Section slugs across content/', () => {
    expect(report.duplicateSlugs, report.duplicateSlugs.join('\n')).toEqual([])
  })

  it('keeps every published Section slug in content/', () => {
    const message = [
      'Published Section slug(s) missing or renamed in content/ (ADR 0003: published slugs must never change):',
      ...report.missingPublishedSlugs.map((slug) => `  - ${slug}`),
    ].join('\n')
    expect(report.missingPublishedSlugs, message).toEqual([])
  })

  it('keeps every published Check number in its Section MDX', () => {
    const message = [
      'Published Check id(s) missing or renamed in content/ (ADR 0003: published Check numbers must never change):',
      ...report.missingPublishedChecks.map((id) => `  - ${id}`),
    ].join('\n')
    expect(report.missingPublishedChecks, message).toEqual([])
  })
})

describe('published-checks guard rules', () => {
  const baseline: Manifest = {
    '1-1-example': ['1', '2'],
  }

  it('allows adding new Sections and new Checks without failing', () => {
    const result = checkAgainstManifest(baseline, [
      { file: 'class-11/unit-1/1-1-example.mdx', slug: '1-1-example', checks: ['1', '2', '3'] },
      { file: 'class-11/unit-1/1-2-new.mdx', slug: '1-2-new', checks: ['1'] },
    ])
    expect(result).toEqual({
      missingSlugFiles: [],
      duplicateSlugs: [],
      missingPublishedSlugs: [],
      missingPublishedChecks: [],
    })
  })

  it('flags a removed or renamed published Section slug', () => {
    const result = checkAgainstManifest(baseline, [
      { file: 'class-11/unit-1/1-1-renamed.mdx', slug: '1-1-renamed', checks: ['1', '2'] },
    ])
    expect(result.missingPublishedSlugs).toEqual(['1-1-example'])
  })

  it('flags a removed or renamed published Check number as <slug>:<n>', () => {
    const result = checkAgainstManifest(baseline, [
      { file: 'class-11/unit-1/1-1-example.mdx', slug: '1-1-example', checks: ['1', 'renamed'] },
    ])
    expect(result.missingPublishedChecks).toEqual(['1-1-example:2'])
  })

  it('flags duplicate Section slugs', () => {
    const result = checkAgainstManifest(baseline, [
      { file: 'class-11/unit-1/a.mdx', slug: '1-1-example', checks: ['1', '2'] },
      { file: 'class-11/unit-1/b.mdx', slug: '1-1-example', checks: ['1', '2'] },
    ])
    expect(result.duplicateSlugs).toEqual([
      'Duplicate Section slug "1-1-example" in: class-11/unit-1/a.mdx, class-11/unit-1/b.mdx',
    ])
  })
})
