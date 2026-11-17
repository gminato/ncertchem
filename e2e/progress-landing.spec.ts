import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

interface SeedSection {
  slug: string
  class: number
  unit: number
  order: number
  section: string
  title: string
  checkNumbers: string[]
}

/** Every Section in book order, read from the content the build wrote. */
const sections: SeedSection[] = (
  JSON.parse(fs.readFileSync(path.join('.velite', 'sections.json'), 'utf8')) as SeedSection[]
).sort((a, b) => a.class - b.class || a.unit - b.unit || a.order - b.order)

const unit1 = sections.filter((s) => s.class === 11 && s.unit === 1)

interface SeedProgress {
  answered: Record<string, number>
  lastOpened: { slug: string; at: number } | null
}

const AT = 1_700_000_000_000

/** Answers every Check of one Section. */
function answerAll(section: SeedSection): Record<string, number> {
  return Object.fromEntries(section.checkNumbers.map((n) => [`${section.slug}:${n}`, AT]))
}

function progressOf(answered: Record<string, number>, lastOpened: SeedProgress['lastOpened'] = null): SeedProgress {
  return { answered, lastOpened }
}

/** Collects page errors and console errors, so a test can assert there were none. */
function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

/** Stores this Progress in the browser before any page script runs. */
async function seed(page: Page, progress: SeedProgress): Promise<void> {
  await page.addInitScript((value) => localStorage.setItem('progress:v1', value), JSON.stringify(progress))
}

const hero = (page: Page) => page.getByTestId('hero-cta')

let errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors = watchErrors(page)
})

test.afterEach(async () => {
  expect(errors).toEqual([])
})

test.describe('Continue in the hero', () => {
  test('with no Progress the button starts with Unit 1', async ({ page }) => {
    await page.goto('/')
    const button = hero(page)
    await expect(button).toHaveAttribute('href', '/class-11/unit-1')
    await expect(page.getByRole('link', { name: 'Start with Unit 1', exact: true })).toHaveAttribute(
      'href',
      '/class-11/unit-1'
    )
    await expect(page.getByTestId('unit-card-progress')).toHaveCount(0)
  })

  test('a Section that is not complete is continued', async ({ page }) => {
    const target = unit1[2]
    await seed(page, progressOf({ [`${unit1[0].slug}:${unit1[0].checkNumbers[0]}`]: AT }, { slug: target.slug, at: AT }))
    await page.goto('/')
    const button = hero(page)
    await expect(button).toContainText(`Continue with Section ${target.section}`)
    await expect(button).toHaveAttribute('href', `/class-11/unit-1/${target.slug}`)
    await expect(button).toHaveAttribute('aria-label', `Continue with Section ${target.section}: ${target.title}`)
  })

  test('a Section that is complete moves on to the next Section in book order', async ({ page }) => {
    const opened = unit1[0]
    const next = unit1[1]
    await seed(page, progressOf(answerAll(opened), { slug: opened.slug, at: AT }))
    await page.goto('/')
    const button = hero(page)
    await expect(button).toContainText(`Continue with Section ${next.section}`)
    await expect(button).toHaveAttribute('href', `/class-11/unit-1/${next.slug}`)
  })

  test('a Section that no longer exists keeps the button on Unit 1', async ({ page }) => {
    await seed(page, progressOf({}, { slug: 'no-such-section', at: AT }))
    await page.goto('/')
    await expect(hero(page)).toContainText('Start with Unit 1')
    await expect(hero(page)).toHaveAttribute('href', '/class-11/unit-1')
  })

  test('the button row keeps its height with and without Progress', async ({ page }) => {
    await page.goto('/')
    const row = hero(page).locator('xpath=..')
    const without = await row.boundingBox()

    await page.evaluate(() => localStorage.clear())
    await seed(page, progressOf({ [`${unit1[0].slug}:${unit1[0].checkNumbers[0]}`]: AT }, { slug: unit1[0].slug, at: AT }))
    await page.goto('/')
    await expect(hero(page)).toContainText('Continue with Section')
    const withProgress = await row.boundingBox()

    expect(without).not.toBeNull()
    expect(withProgress).not.toBeNull()
    expect(withProgress!.height).toBeCloseTo(without!.height, 0)
  })
})

test.describe('Continue at a phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the longest Section label keeps the button row the same height and the page on screen', async ({ page }) => {
    const longest = sections.reduce((a, b) => (b.section.length > a.section.length ? b : a))
    await page.goto('/')
    const row = hero(page).locator('xpath=..')
    const without = await row.boundingBox()

    await seed(page, progressOf({}, { slug: longest.slug, at: AT }))
    await page.goto('/')
    await expect(hero(page)).toContainText(`Continue with Section ${longest.section}`)
    const withProgress = await row.boundingBox()
    expect(without).not.toBeNull()
    expect(withProgress).not.toBeNull()
    expect(withProgress!.height).toBeCloseTo(without!.height, 0)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('Progress on the Unit cards', () => {
  const unit1Card = (page: Page) => page.getByRole('link', { name: /Unit 1\s*Some Basic Concepts/ })
  const unit2Card = (page: Page) => page.getByRole('link', { name: /Unit 2\s*Structure of Atom/ })
  const unit3Card = (page: Page) => page.getByRole('link', { name: /Unit 3\s*/ }).first()
  /** The meta line of a card: its Simulation count, or its Progress line once started. */
  const metaLine = (card: ReturnType<typeof unit1Card>) =>
    card.locator('span').filter({ hasText: /Sections? · \d+ Simulations?|Sections complete/ }).last()

  test('a card keeps its height and its meta line keeps its place with Progress', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    const before = await unit1Card(page).boundingBox()
    const beforeMeta = await metaLine(unit1Card(page)).boundingBox()

    await seed(page, progressOf({ [`${unit1[0].slug}:${unit1[0].checkNumbers[0]}`]: AT }))
    await page.goto('/')
    await expect(unit1Card(page).getByTestId('unit-card-progress')).toHaveCount(1)
    const after = await unit1Card(page).boundingBox()
    const afterMeta = await metaLine(unit1Card(page)).boundingBox()

    expect(after!.height).toBeCloseTo(before!.height, 0)
    expect(afterMeta!.y).toBeCloseTo(beforeMeta!.y, 0)
  })

  test('meta lines in one row share their y when only some cards have Progress', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await seed(page, progressOf({ [`${unit1[0].slug}:${unit1[0].checkNumbers[0]}`]: AT }))
    await page.goto('/')
    const ys = await Promise.all(
      [unit1Card, unit2Card, unit3Card].map(async (card) => (await metaLine(card(page)).boundingBox())!.y)
    )
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(1)
    await expect(unit1Card(page).getByTestId('unit-card-progress')).toHaveCount(1)
    await expect(unit2Card(page).getByTestId('unit-card-progress')).toHaveCount(0)
  })

  test('one Section complete and one started reads 1 of 10 and fills about 10%', async ({ page }) => {
    await seed(
      page,
      progressOf({ ...answerAll(unit1[0]), [`${unit1[1].slug}:${unit1[1].checkNumbers[0]}`]: AT })
    )
    await page.goto('/')
    const card = unit1Card(page)
    const progress = card.getByTestId('unit-card-progress')
    await expect(progress).toHaveCount(1)
    await expect(progress).toContainText('1 of 10 Sections complete')

    const track = card.getByTestId('unit-card-progress-fill').locator('xpath=..')
    const trackBox = await track.boundingBox()
    const fillBox = await card.getByTestId('unit-card-progress-fill').boundingBox()
    expect(trackBox).not.toBeNull()
    expect(fillBox).not.toBeNull()
    expect(fillBox!.width / trackBox!.width).toBeCloseTo(0.1, 1)
    const cardBox = await card.boundingBox()
    // The strip sits inside the card's 1px border on each side.
    expect(trackBox!.width).toBeGreaterThan(cardBox!.width - 4)
    expect(trackBox!.width).toBeLessThanOrEqual(cardBox!.width)

    await expect(page.getByTestId('unit-card-progress')).toHaveCount(1)
  })

  test('every Section complete reads All 10 Sections complete', async ({ page }) => {
    await seed(page, progressOf(Object.assign({}, ...unit1.map(answerAll))))
    await page.goto('/')
    const card = unit1Card(page)
    await expect(card.getByTestId('unit-card-progress')).toContainText('All 10 Sections complete')
    const fillBox = await card.getByTestId('unit-card-progress-fill').boundingBox()
    const trackBox = await card.getByTestId('unit-card-progress-fill').locator('xpath=..').boundingBox()
    expect(fillBox!.width / trackBox!.width).toBeCloseTo(1, 2)
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`screenshots in ${scheme}`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' })

    for (const [name, width, height] of [
      ['phone', 390, 844],
      ['desktop', 1440, 900],
    ] as const) {
    test(`hero with Continue and the Class 11 cards with Progress (${name})`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const unit2 = sections.filter((s) => s.class === 11 && s.unit === 2)
      const shown = progressOf(
        {
          ...answerAll(unit1[0]),
          [`${unit1[1].slug}:${unit1[1].checkNumbers[0]}`]: AT,
          [`${unit2[0].slug}:${unit2[0].checkNumbers[0]}`]: AT,
        },
        { slug: unit1[1].slug, at: AT }
      )
      await seed(page, shown)
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      await expect(hero(page)).toContainText('Continue with Section')
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.screenshot({ path: path.join(SCREEN_DIR, `progress-landing-hero-${name}-${scheme}.png`) })

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBeLessThanOrEqual(0)

      const cards = page.getByRole('list', { name: 'Class 11 Units' })
      await cards.evaluate((el) => el.scrollIntoView({ block: 'start' }))
      await page.waitForTimeout(300)
      const box = await cards.boundingBox()
      expect(box).not.toBeNull()
      await page.screenshot({
        path: path.join(SCREEN_DIR, `progress-landing-cards-${name}-${scheme}.png`),
        clip: { x: box!.x, y: box!.y, width: box!.width, height: box!.height },
      })
    })
    }

    test('the page does not scroll sideways on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  })
}
