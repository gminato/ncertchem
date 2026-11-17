import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SLUG = '1-8-mole-concept-and-molar-masses'
const SECTION_URL = `/class-11/unit-1/${SLUG}`
const TOTAL = 3

/** The three Checks of Section 1.8, in order: numeric (n=1), multiple-choice (n=2), numeric (n=3). */
const check = (page: Page, index: number) => page.locator('section[data-status]').nth(index)
const status = (page: Page) => page.getByTestId('section-status')

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

async function storedProgress(page: Page): Promise<{
  answered?: Record<string, number>
  lastOpened?: { slug: string; at: number } | null
}> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('progress:v1') ?? '{}'))
}

/** Progress with every Check of the Section answered, for seeding before load. */
function allAnswered() {
  const at = Date.parse('2026-11-01T10:00:00Z')
  return {
    answered: Object.fromEntries(['1', '2', '3'].map((n) => [`${SLUG}:${n}`, at])),
    lastOpened: null,
  }
}

async function answerAll(page: Page) {
  await check(page, 0).getByRole('spinbutton').fill('3.011')
  await check(page, 0).getByRole('button', { name: 'Check' }).click()
  await expect(check(page, 0)).toHaveAttribute('data-status', 'correct')

  await check(page, 1).getByRole('radio', { name: /58\.5 g of sodium chloride/ }).check({ force: true })
  await check(page, 1).getByRole('button', { name: 'Check' }).click()
  await expect(check(page, 1)).toHaveAttribute('data-status', 'correct')

  await check(page, 2).getByRole('spinbutton').fill('146.25')
  await check(page, 2).getByRole('button', { name: 'Check' }).click()
  await expect(check(page, 2)).toHaveAttribute('data-status', 'correct')
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Progress on a Section (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('screenshots of the status pill and a revealed Check', async ({ page }) => {
      const errors = collectErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(status(page)).toHaveAttribute('data-complete', 'false')
      await page.evaluate(() => document.fonts.ready)
      await status(page).locator('xpath=..').screenshot({
        path: path.join(SCREEN_DIR, `progress-section-${scheme}-pill-neutral.png`),
      })

      // Reveal Check 2 by answering it wrongly twice.
      await check(page, 1).getByRole('radio', { name: /12\.011 g of water/ }).check({ force: true })
      await check(page, 1).getByRole('button', { name: 'Check' }).click()
      await check(page, 1).getByRole('radio', { name: /24\.022 g of carbon/ }).check({ force: true })
      await check(page, 1).getByRole('button', { name: 'Check' }).click()
      await expect(check(page, 1)).toHaveAttribute('data-status', 'revealed')
      await check(page, 1).screenshot({
        path: path.join(SCREEN_DIR, `progress-section-${scheme}-revealed.png`),
      })

      await page.goto(SECTION_URL)
      await page.addInitScript((value) => localStorage.setItem('progress:v1', value), JSON.stringify(allAnswered()))
      await page.reload()
      await expect(status(page)).toHaveAttribute('data-complete', 'true')
      await status(page).locator('xpath=..').screenshot({
        path: path.join(SCREEN_DIR, `progress-section-${scheme}-pill-complete.png`),
      })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Progress on a Section (phone width)', () => {
  test.use({ colorScheme: 'light', viewport: { width: 390, height: 844 } })

  test('the revealed Check and the complete pill fit at 390px', async ({ page }) => {
    const errors = collectErrors(page)
    fs.mkdirSync(SCREEN_DIR, { recursive: true })

    await page.goto(SECTION_URL)
    await check(page, 1).getByRole('radio', { name: /12\.011 g of water/ }).check({ force: true })
    await check(page, 1).getByRole('button', { name: 'Check' }).click()
    await check(page, 1).getByRole('radio', { name: /24\.022 g of carbon/ }).check({ force: true })
    await check(page, 1).getByRole('button', { name: 'Check' }).click()
    await expect(check(page, 1)).toHaveAttribute('data-status', 'revealed')
    await page.evaluate(() => document.fonts.ready)
    await check(page, 1).screenshot({
      path: path.join(SCREEN_DIR, 'progress-section-mobile-390-revealed.png'),
    })

    // The Check and the status pill must sit inside the phone width. (A Scrolly Animation's visual
    // already runs a few pixels wider at this width; that is outside this slice.)
    const overflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth
      return [...document.querySelectorAll('[data-status], [data-testid="section-status"]')]
        .map((el) => ({ name: el.tagName.toLowerCase(), right: Math.round(el.getBoundingClientRect().right) }))
        .filter((box) => box.right > width + 1)
    })
    expect(overflow).toEqual([])

    await page.goto(SECTION_URL)
    await page.addInitScript((value) => localStorage.setItem('progress:v1', value), JSON.stringify(allAnswered()))
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-complete', 'true')
    await status(page).locator('xpath=..').screenshot({
      path: path.join(SCREEN_DIR, 'progress-section-mobile-390-pill-complete.png'),
    })

    expect(errors).toEqual([])
  })
})

test.describe('Progress on a Section: behaviour', () => {
  test('a fresh Learner sees no Checks answered', async ({ page }) => {
    const errors = collectErrors(page)

    await page.goto(SECTION_URL)
    await expect(status(page)).toHaveText(`0 of ${TOTAL} Checks answered`)
    await expect(status(page)).toHaveAttribute('data-complete', 'false')

    expect(errors).toEqual([])
  })

  test('a reveal records nothing, Try again resets the Check, and a right answer is recorded', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await page.goto(SECTION_URL)
    const mcq = check(page, 1)

    // Two wrong tries: the first leaves the Check open for another go, the second reveals it.
    await mcq.getByRole('radio', { name: /12\.011 g of water/ }).check({ force: true })
    await mcq.getByRole('button', { name: 'Check' }).click()
    await expect(mcq).toHaveAttribute('data-status', 'wrong')
    await mcq.getByRole('button', { name: 'Try again' }).click()
    await mcq.getByRole('radio', { name: /24\.022 g of carbon/ }).check({ force: true })
    await mcq.getByRole('button', { name: 'Check' }).click()

    await expect(mcq).toHaveAttribute('data-status', 'revealed')
    const retry = mcq.getByRole('button', { name: 'Try again' })
    await expect(retry).toBeVisible()
    await expect(mcq.getByText(/12\.011 g of carbon is one mole/)).toBeVisible()
    await expect(status(page)).toHaveText(`0 of ${TOTAL} Checks answered`)
    expect(Object.keys((await storedProgress(page)).answered ?? {})).toEqual([])

    await retry.click()
    await expect(mcq).toHaveAttribute('data-status', 'idle')
    await expect(mcq.getByText(/12\.011 g of carbon is one mole/)).toHaveCount(0)
    await expect(mcq.getByRole('radio', { name: /58\.5 g of sodium chloride/ })).not.toBeChecked()

    await mcq.getByRole('radio', { name: /58\.5 g of sodium chloride/ }).check({ force: true })
    await mcq.getByRole('button', { name: 'Check' }).click()
    await expect(mcq).toHaveAttribute('data-status', 'correct')
    await expect(mcq.getByText('Answered', { exact: true })).toBeVisible()
    await expect(status(page)).toHaveText(`1 of ${TOTAL} Checks answered`)
    expect(Object.keys((await storedProgress(page)).answered ?? {})).toEqual([`${SLUG}:2`])

    expect(errors).toEqual([])
  })

  test('answering every Check completes the Section, and it stays complete after a reload', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await page.goto(SECTION_URL)
    await answerAll(page)

    await expect(status(page)).toHaveText('Section complete')
    await expect(status(page)).toHaveAttribute('data-complete', 'true')
    await expect(status(page).locator('[data-progress-tick]')).toBeVisible()

    await page.reload()
    await expect(status(page)).toHaveAttribute('data-complete', 'true')
    await expect(status(page)).toHaveText('Section complete')
    await expect(page.getByText('Answered', { exact: true })).toHaveCount(TOTAL)

    expect(errors).toEqual([])
  })

  test('opening the Section records it as the one opened most recently', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(SECTION_URL)

    await expect
      .poll(async () => (await storedProgress(page)).lastOpened?.slug)
      .toBe(SLUG)

    expect(errors).toEqual([])
  })

  test('Progress seeded before load shows the Section complete on arrival', async ({ page }) => {
    const errors = collectErrors(page)
    await page.addInitScript(
      (value) => localStorage.setItem('progress:v1', value),
      JSON.stringify(allAnswered())
    )
    await page.goto(SECTION_URL)

    await expect(status(page)).toHaveText('Section complete')
    await expect(status(page)).toHaveAttribute('data-complete', 'true')

    expect(errors).toEqual([])
  })
})
