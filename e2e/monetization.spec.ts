import { test, expect, type Page } from '@playwright/test'

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const where = msg.location().url ?? ''
    // Google's sign-in script logs expected errors on local test origins.
    if (/accounts\.google\.com|gstatic\.com/.test(where) || msg.text().includes('[GSI_LOGGER]')) return
    errors.push(`${msg.text()} [${where}]`)
  })
  return errors
}

const PAID_SECTION_URL = '/class-11/unit-1/1-3-properties-of-matter-and-measurement'
const FREE_MATHML_SECTION_URL = '/class-11/unit-1/1-8-mole-concept-and-molar-masses'

const UNIT_1_FREE_SLUGS = [
  '1-1-importance-of-chemistry',
  '1-2-nature-of-matter',
  '1-8-mole-concept-and-molar-masses',
  '1-10-stoichiometry',
] as const

const UNIT_1_PAID_SLUGS = [
  '1-3-properties-of-matter-and-measurement',
  '1-4-uncertainty-in-measurement',
  '1-5-laws-of-chemical-combinations',
  '1-6-daltons-atomic-theory',
  '1-7-atomic-and-molecular-masses',
  '1-9-percentage-composition',
] as const

test.describe('Syllabus Map and Unit Lock UI', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`home Syllabus Map displays Free Section counts, Lock icons, and Pricing footer link (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const errors = watchErrors(page)

      const response = await page.goto('/')
      expect(response?.status()).toBe(200)

      const class11Units = page.getByRole('list', { name: 'Class 11 Units' })
      const unitLinks = class11Units.getByRole('link')
      const count = await unitLinks.count()
      expect(count).toBeGreaterThan(0)

      for (let i = 0; i < count; i++) {
        const card = unitLinks.nth(i)
        const freeBadge = card.locator('[data-access="free"]')
        const paidBadge = card.locator('[data-access="paid"]')
        await expect(freeBadge).toBeVisible()
        await expect(freeBadge).toHaveText(/\d+ Free/)
        await expect(paidBadge).toBeVisible()
        await expect(paidBadge).toHaveText(/\d+ Paid/)
        await expect(paidBadge.locator('svg')).toHaveCount(1)
      }

      const footerPricingLink = page.getByRole('contentinfo').getByRole('link', { name: 'Pricing' })
      await expect(footerPricingLink).toBeVisible()
      await expect(footerPricingLink).toHaveAttribute('href', '/pricing')

      expect(errors).toEqual([])
    })

    test(`Unit 1 page distinguishes Free Sections and Paid Sections with Lock indicators (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const errors = watchErrors(page)

      const response = await page.goto('/class-11/unit-1')
      expect(response?.status()).toBe(200)

      const sectionList = page.getByRole('list', { name: 'Sections' })

      for (const slug of UNIT_1_FREE_SLUGS) {
        const row = sectionList.locator(`a[href="/class-11/unit-1/${slug}"]`)
        const badge = row.locator('[data-access="free"]')
        await expect(badge).toBeVisible()
        await expect(badge).toHaveText('Free')
        await expect(row.locator('[data-access="paid"]')).toHaveCount(0)
      }

      for (const slug of UNIT_1_PAID_SLUGS) {
        const row = sectionList.locator(`a[href="/class-11/unit-1/${slug}"]`)
        const badge = row.locator('[data-access="paid"]')
        await expect(badge).toBeVisible()
        await expect(badge).toHaveAttribute('aria-label', 'Paid Section')
        await expect(badge.locator('svg')).toHaveCount(1)
        await expect(row.locator('[data-access="free"]')).toHaveCount(0)
      }

      expect(errors).toEqual([])
    })
  }
})

test.describe('Server-side gating on Paid Sections', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`unsubscribed Paid Section shows Hook, Paywall, and pager without body content (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const errors = watchErrors(page)

      const response = await page.goto(PAID_SECTION_URL)
      expect(response?.status()).toBe(200)

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Properties of Matter and their Measurement'
      )

      const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' })
      await expect(breadcrumbs).toBeVisible()
      await expect(breadcrumbs.getByRole('link')).toHaveAttribute('href', '/class-11/unit-1')
      await expect(breadcrumbs).toContainText('Section 1.3')

      const hook = page.locator('article aside').first()
      await expect(hook).toBeVisible()
      await expect(hook).toContainText('A doctor writes 37 °C')

      const paywall = page.getByTestId('paywall')
      await expect(paywall).toBeVisible()
      await expect(paywall.getByText('Sign in with Google to subscribe')).toBeVisible()
      await expect(paywall.getByRole('link', { name: /Subscription/i })).toHaveAttribute(
        'href',
        '/pricing'
      )

      const pager = page.getByRole('navigation', { name: 'Sections in this Unit' })
      await expect(pager).toBeVisible()
      await expect(pager.locator('[data-access="free"]')).toBeVisible()
      await expect(pager.locator('[data-access="paid"]')).toBeVisible()

      await expect(page.locator('[data-animation]')).toHaveCount(0)
      await expect(page.locator('[data-simulation]')).toHaveCount(0)
      await expect(page.locator('section[data-status]')).toHaveCount(0)
      await expect(page.getByTestId('section-status')).toHaveCount(0)

      expect(errors).toEqual([])
    })
  }

  test('raw HTML response for a Paid Section excludes Prose, Animations, and Checks', async ({
    request,
  }) => {
    const response = await request.get(PAID_SECTION_URL)
    expect(response.status()).toBe(200)

    const html = await response.text()
    expect(html).toContain('Properties of Matter and their Measurement')
    expect(html).toContain('A doctor writes 37 °C')

    // Paid-only Prose, Check prompts, and Animation identifiers must not leak in HTML.
    expect(html).not.toContain('Which of these is a chemical property?')
    expect(html).not.toContain(
      'established by the 11th General Conference on Weights and Measures in 1960'
    )
    expect(html).not.toContain('A 60 kg block is taken to the Moon')
    expect(html).not.toContain('thermometer-trio')
  })
})

test.describe('Progress preservation on locked Paid Section', () => {
  test('visiting a gated Paid Section preserves previously saved local Progress', async ({
    page,
  }) => {
    const errors = watchErrors(page)

    const initialProgress = {
      answered: {
        '1-3-properties-of-matter-and-measurement:1': 1_700_000_001_000,
        '1-8-mole-concept-and-molar-masses:1': 1_700_000_002_000,
      },
      lastOpened: {
        slug: '1-8-mole-concept-and-molar-masses',
        at: 1_700_000_003_000,
      },
    }

    await page.addInitScript((serialized) => {
      if (!sessionStorage.getItem('seeded-monetization-progress')) {
        localStorage.setItem('progress:v1', serialized)
        sessionStorage.setItem('seeded-monetization-progress', '1')
      }
    }, JSON.stringify(initialProgress))

    await page.goto(PAID_SECTION_URL)
    await expect(page.getByTestId('paywall')).toBeVisible()

    const storedRaw = await page.evaluate(() => localStorage.getItem('progress:v1'))
    expect(storedRaw).not.toBeNull()
    expect(JSON.parse(storedRaw!)).toEqual(initialProgress)

    expect(errors).toEqual([])
  })
})

test.describe('390px mobile overflow regression (MathML in Scrolly)', () => {
  test('Section 1.8 fits a 390px viewport without horizontal overflow', async ({ page }) => {
    const errors = watchErrors(page)
    await page.setViewportSize({ width: 390, height: 844 })

    const response = await page.goto(FREE_MATHML_SECTION_URL)
    expect(response?.status()).toBe(200)
    await page.evaluate(() => document.fonts.ready)

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    expect(errors).toEqual([])
  })
})

test.describe('Pricing and updated Terms pages', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`Pricing page shows ₹999 Subscription details, parental notice, and legal links (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const errors = watchErrors(page)

      const response = await page.goto('/pricing')
      expect(response?.status()).toBe(200)

      await expect(page.getByRole('heading', { level: 1 })).toContainText('Subscription')
      await expect(page.getByText('₹999', { exact: true })).toBeVisible()
      await expect(
        page.getByRole('heading', { name: '365-Day All-Access Subscription' })
      ).toBeVisible()
      await expect(page.getByText('Non-recurring — no auto-debit')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: /Parental or guardian consent/i })
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: /Non-refundable terms/i })
      ).toBeVisible()
      await expect(page.getByText(/non-refundable once activated/i)).toBeVisible()

      await expect(page.getByRole('link', { name: 'Terms of Use' }).first()).toHaveAttribute(
        'href',
        '/terms'
      )
      await expect(page.getByRole('link', { name: 'Privacy Policy' }).first()).toHaveAttribute(
        'href',
        '/privacy'
      )

      expect(errors).toEqual([])
    })

    test(`Terms page includes Subscription, parental consent, technical-failure refund, and Grievance Officer (${scheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const errors = watchErrors(page)

      const response = await page.goto('/terms')
      expect(response?.status()).toBe(200)

      await expect(page.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Paid Sections and 365-Day Subscription' })
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Parental or Guardian Consent for Payments' })
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Refund Policy and Technical Failures' })
      ).toBeVisible()
      await expect(page.getByText(/Statutory exception for technical failures/i)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Grievance Officer' })).toBeVisible()
      await expect(page.getByText(/acknowledged within 48 hours/i)).toBeVisible()

      expect(errors).toEqual([])
    })
  }
})

test.describe('API route auth and webhook signature smoke checks', () => {
  test('POST /api/checkout/create-order rejects unauthenticated requests with 401', async ({
    request,
  }) => {
    const response = await request.post('/api/checkout/create-order', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/webhooks/razorpay rejects invalid signatures with 401 or 503', async ({
    request,
  }) => {
    const response = await request.post('/api/webhooks/razorpay', {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid-signature',
      },
      data: JSON.stringify({ event: 'order.paid' }),
    })
    expect([401, 503]).toContain(response.status())
  })
})
