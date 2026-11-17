import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const UNIT_URL = '/class-11/unit-1'

interface SectionRecord {
  class: number
  unit: number
  order: number
  slug: string
  checkNumbers: string[]
}

interface StoredProgress {
  answered: Record<string, number>
  lastOpened: null
}

// The Sections come from the built content, so this spec never goes stale when Checks change.
function unitOneSections(): SectionRecord[] {
  const all = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '.velite', 'sections.json'), 'utf8')
  ) as SectionRecord[]
  return all
    .filter((s) => s.class === 11 && s.unit === 1)
    .sort((a, b) => a.order - b.order)
}

const sections = unitOneSections()

function answerAll(section: SectionRecord, answered: Record<string, number>): void {
  for (const n of section.checkNumbers) answered[`${section.slug}:${n}`] = 1_700_000_000_000
}

function progressWith(answeredSections: SectionRecord[], partial?: { section: SectionRecord; count: number }): StoredProgress {
  const answered: Record<string, number> = {}
  for (const s of answeredSections) answerAll(s, answered)
  if (partial) {
    partial.section.checkNumbers.slice(0, partial.count).forEach((n) => {
      answered[`${partial.section.slug}:${n}`] = 1_700_000_000_000
    })
  }
  return { answered, lastOpened: null }
}

async function seed(page: Page, progress: StoredProgress): Promise<void> {
  await page.addInitScript(
    (value) => localStorage.setItem('progress:v1', value),
    JSON.stringify(progress)
  )
}

function rows(page: Page) {
  return page.getByRole('list', { name: 'Sections' }).getByRole('link')
}

function statuses(page: Page) {
  return page.getByTestId('section-row-status')
}

function unitLine(page: Page) {
  return page.getByTestId('unit-progress')
}

async function openUnit(page: Page): Promise<void> {
  await page.goto(UNIT_URL)
  await expect(rows(page)).toHaveCount(sections.length)
}

// Every error on the page is collected per test, and none may appear.
const errorsByPage = new WeakMap<Page, string[]>()

test.beforeEach(({ page }) => {
  const errors: string[] = []
  errorsByPage.set(page, errors)
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
})

test.afterEach(({ page }) => {
  expect(errorsByPage.get(page)).toEqual([])
})

test.describe('Unit page Progress', () => {
  test('with no Progress every status is empty and the line is empty', async ({ page }) => {
    await openUnit(page)
    await expect(statuses(page)).toHaveCount(sections.length)
    for (let i = 0; i < sections.length; i++) {
      await expect(statuses(page).nth(i)).toHaveAttribute('data-state', 'none')
    }
    await expect(unitLine(page)).toBeAttached()
    await expect(unitLine(page)).toHaveText('')
  })

  test('one complete Section and one started Section show their status', async ({ page }) => {
    const first = sections[0]
    const second = sections[1]
    await seed(page, progressWith([first], { section: second, count: 1 }))
    await openUnit(page)

    await expect(statuses(page).nth(0)).toHaveAttribute('data-state', 'complete')
    await expect(statuses(page).nth(0).locator('[data-progress-tick]')).toBeVisible()
    await expect(rows(page).nth(0)).toHaveAccessibleName(/Section complete/)

    await expect(statuses(page).nth(1)).toHaveAttribute('data-state', 'started')
    await expect(statuses(page).nth(1)).toContainText(`1 of ${second.checkNumbers.length}`)

    for (let i = 2; i < sections.length; i++) {
      await expect(statuses(page).nth(i)).toHaveAttribute('data-state', 'none')
    }
    await expect(unitLine(page)).toHaveText('1 of 10 Sections complete')
  })

  test('every Section complete shows the all-complete line', async ({ page }) => {
    await seed(page, progressWith(sections))
    await openUnit(page)

    for (let i = 0; i < sections.length; i++) {
      await expect(statuses(page).nth(i)).toHaveAttribute('data-state', 'complete')
    }
    await expect(unitLine(page)).toHaveText('All 10 Sections complete')
    await expect(unitLine(page).locator('[data-progress-tick]')).toBeVisible()
  })

  test('the first row does not move when Progress arrives', async ({ page }) => {
    await openUnit(page)
    await expect(statuses(page).nth(0)).toHaveAttribute('data-state', 'none')
    const before = await rows(page).nth(0).boundingBox()

    await seed(page, progressWith(sections))
    await page.reload()
    await expect(statuses(page).nth(0)).toHaveAttribute('data-state', 'complete')
    await expect(unitLine(page)).toHaveText('All 10 Sections complete')
    const after = await rows(page).nth(0).boundingBox()

    expect(before).not.toBeNull()
    expect(after?.y).toBe(before?.y)
  })
})

test.describe('Unit page Progress at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the status is visible and the page does not scroll sideways', async ({ page }) => {
    await seed(page, progressWith([sections[0]], { section: sections[1], count: 1 }))
    await openUnit(page)

    await expect(statuses(page).nth(0).locator('[data-progress-tick]')).toBeVisible()
    await expect(statuses(page).nth(1)).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
    expect(overflow).toBe(true)
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit page Progress screenshots (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('partial Progress', async ({ page }) => {
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await seed(page, progressWith([sections[0]], { section: sections[1], count: 1 }))
      await openUnit(page)
      await expect(statuses(page).nth(1)).toHaveAttribute('data-state', 'started')
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: path.join(SCREEN_DIR, `progress-unit-partial-${scheme}.png`),
        fullPage: true,
      })
    })

    test('all Sections complete', async ({ page }) => {
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await seed(page, progressWith(sections))
      await openUnit(page)
      await expect(unitLine(page)).toHaveText('All 10 Sections complete')
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: path.join(SCREEN_DIR, `progress-unit-complete-${scheme}.png`),
        fullPage: true,
      })
    })

    test('phone width', async ({ page }) => {
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.setViewportSize({ width: 390, height: 844 })
      await seed(page, progressWith([sections[0]], { section: sections[1], count: 1 }))
      await openUnit(page)
      await expect(statuses(page).nth(1)).toHaveAttribute('data-state', 'started')
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: path.join(SCREEN_DIR, `progress-unit-390-${scheme}.png`),
        fullPage: true,
      })
    })
  })
}
