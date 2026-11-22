import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Foundation screenshots (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('vocab Matter & molecules section renders without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab')
      const section = page.locator('#matter')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Matter & molecules')
      await page.evaluate(() => document.fonts.ready)
      await section.screenshot({ path: path.join(SCREEN_DIR, `vocab-matter-${scheme}.png`) })

      expect(errors).toEqual([])
    })

    test('dev controls page renders every primitive and both Check modes', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/dev/controls')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Controls and Checks')
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: path.join(SCREEN_DIR, `dev-controls-${scheme}.png`),
        fullPage: true,
      })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Check behaviour', () => {
  test('a wrong answer invites a retry, then two tries reveal the explanation', async ({ page }) => {
    await page.goto('/dev/controls')
    const check = page.locator('section[data-status]').first()
    await check.getByRole('radio', { name: /Proton/ }).check({ force: true })
    await check.getByRole('button', { name: 'Check' }).click()
    await expect(check).toHaveAttribute('data-status', 'wrong')
    await expect(check.getByText(/Not quite/)).toBeVisible()

    await check.getByRole('button', { name: 'Try again' }).click()
    await check.getByRole('radio', { name: /Neutron/ }).check({ force: true })
    await check.getByRole('button', { name: 'Check' }).click()
    await expect(check).toHaveAttribute('data-status', 'revealed')
    await expect(check.getByText(/Electrons carry a negative charge/)).toBeVisible()
  })

  test('the right answer is confirmed and recorded in the browser\'s Progress', async ({ page }) => {
    await page.goto('/dev/controls')
    const check = page.locator('section[data-status]').nth(1)
    await check.getByRole('spinbutton').fill('0.405')
    await check.getByRole('button', { name: 'Check' }).click()
    await expect(check).toHaveAttribute('data-status', 'correct')
    await expect(check.getByText('Correct.')).toBeVisible()

    await expect(check.getByText('Answered')).toBeVisible()
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('progress:v1') ?? '{}'))
    expect(Object.keys(stored.answered)).toEqual(['controls:dev-numeric'])
  })
})

test.describe('Unit navigation', () => {
  test('the Unit page lists Sections and links into them', async ({ page }) => {
    await page.goto('/class-11/unit-2')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Structure of Atom')
    const row = page.getByRole('link', { name: /Bohr's Model for Hydrogen Atom/ })
    await expect(row).toBeVisible()
    await row.click()
    await expect(page).toHaveURL(/\/class-11\/unit-2\/2-4-bohr-model$/)
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Unit 2')
  })

  test('a Unit with no Sections yet shows a calm empty state', async ({ page }) => {
    await page.goto('/class-12/unit-5')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coordination Compounds')
    await expect(page.getByText('The Sections of this Unit are being written.')).toBeVisible()
  })

  test('Class 12 Unit 6 lists its twelve Sections in order', async ({ page }) => {
    await page.goto('/class-12/unit-6')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Haloalkanes and Haloarenes')
    const links = page.locator('a[href^="/class-12/unit-6/"]')
    await expect(links).toHaveCount(12)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '12-6-1-classification',
      '12-6-2-nomenclature',
      '12-6-3-nature-of-the-c-x-bond',
      '12-6-4-preparation-of-haloalkanes',
      '12-6-5-preparation-of-haloarenes',
      '12-6-6-physical-properties',
      '12-6-7-1-nucleophilic-substitution',
      '12-6-7-1-sn2-and-sn1-mechanisms',
      '12-6-7-1-stereochemistry-of-substitution',
      '12-6-7-1-elimination-and-reactions-with-metals',
      '12-6-7-2-reactions-of-haloarenes',
      '12-6-8-polyhalogen-compounds',
    ])
  })

  test('Class 12 Unit 4 lists its eleven Sections in order', async ({ page }) => {
    await page.goto('/class-12/unit-4')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The d- and f-Block Elements')
    const links = page.locator('a[href^="/class-12/unit-4/"]')
    await expect(links).toHaveCount(11)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '12-4-1-position-and-electronic-configurations',
      '12-4-3-1-physical-properties-and-atomic-sizes',
      '12-4-3-3-ionisation-enthalpies',
      '12-4-3-4-oxidation-states',
      '12-4-3-5-electrode-potentials-and-reactivity',
      '12-4-3-9-magnetic-properties',
      '12-4-3-10-colour-complexes-catalysis-and-alloys',
      '12-4-4-potassium-dichromate-and-permanganate',
      '12-4-5-the-lanthanoids',
      '12-4-6-the-actinoids',
      '12-4-7-applications-of-d-and-f-block-elements',
    ])
  })

  test('Class 12 Unit 3 lists its ten Sections in order', async ({ page }) => {
    await page.goto('/class-12/unit-3')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chemical Kinetics')
    const links = page.locator('a[href^="/class-12/unit-3/"]')
    await expect(links).toHaveCount(10)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '12-3-1-rate-of-a-chemical-reaction',
      '12-3-2-rate-law-and-rate-constant',
      '12-3-2-3-order-of-a-reaction',
      '12-3-2-4-molecularity',
      '12-3-3-1-zero-order-reactions',
      '12-3-3-2-first-order-reactions',
      '12-3-3-3-half-life',
      '12-3-4-temperature-and-arrhenius',
      '12-3-4-1-effect-of-catalyst',
      '12-3-5-collision-theory',
    ])
  })

  test('Class 12 Unit 2 lists its ten Sections in order', async ({ page }) => {
    await page.goto('/class-12/unit-2')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Electrochemistry')
    const links = page.locator('a[href^="/class-12/unit-2/"]')
    await expect(links).toHaveCount(10)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '12-2-1-electrochemical-cells',
      '12-2-2-galvanic-cells',
      '12-2-3-nernst-equation',
      '12-2-3-1-equilibrium-constant-and-gibbs-energy',
      '12-2-4-conductance-of-electrolytic-solutions',
      '12-2-4-2-variation-of-conductivity-with-concentration',
      '12-2-5-electrolytic-cells-and-electrolysis',
      '12-2-5-1-products-of-electrolysis',
      '12-2-6-batteries',
      '12-2-7-fuel-cells-and-corrosion',
    ])
  })

  test('Class 12 Unit 1 lists its eight Sections in order', async ({ page }) => {
    await page.goto('/class-12/unit-1')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Solutions')
    const links = page.locator('a[href^="/class-12/unit-1/"]')
    await expect(links).toHaveCount(8)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '12-1-1-types-of-solutions',
      '12-1-2-expressing-concentration',
      '12-1-3-solubility',
      '12-1-4-vapour-pressure-liquid-solutions',
      '12-1-5-ideal-and-non-ideal-solutions',
      '12-1-6-1-vapour-boiling-freezing',
      '12-1-6-4-osmosis-and-reverse-osmosis',
      '12-1-7-abnormal-molar-masses',
    ])
  })

  test('Unit 9 lists its fifteen Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-9')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hydrocarbons')
    const links = page.locator('a[href^="/class-11/unit-9/"]')
    await expect(links).toHaveCount(15)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '9-1-classification',
      '9-2-alkanes-nomenclature-isomerism',
      '9-2-2-preparation-of-alkanes',
      '9-2-3-properties-of-alkanes',
      '9-2-4-conformations',
      '9-3-alkenes-structure-isomerism',
      '9-3-4-preparation-of-alkenes',
      '9-3-5-addition-reactions-of-alkenes',
      '9-3-5-oxidation-ozonolysis-polymerisation',
      '9-4-alkynes-structure-preparation',
      '9-4-4-properties-of-alkynes',
      '9-5-aromatic-hydrocarbons',
      '9-5-5-properties-of-arenes',
      '9-5-6-directive-influence',
      '9-6-carcinogenicity-and-toxicity',
    ])
  })

  test('Unit 6 lists its fourteen Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-6')
    const links = page.locator('a[href^="/class-11/unit-6/"]')
    await expect(links).toHaveCount(14)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '6-1-equilibrium-in-physical-processes',
      '6-2-dynamic-equilibrium',
      '6-3-law-of-chemical-equilibrium',
      '6-4-homogeneous-equilibria',
      '6-5-heterogeneous-equilibria',
      '6-6-applications-of-equilibrium-constants',
      '6-7-k-q-and-gibbs-energy',
      '6-8-factors-affecting-equilibria',
      '6-9-ionic-equilibrium-in-solution',
      '6-10-acids-bases-and-salts',
      '6-11-1-ionization-kw-and-ph',
      '6-11-3-weak-acids-and-weak-bases',
      '6-11-8-common-ion-salt-hydrolysis-buffers',
      '6-13-solubility-equilibria-of-sparingly-soluble-salts',
    ])
  })

  test('Unit 7 lists its seven Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-7')
    const links = page.locator('a[href^="/class-11/unit-7/"]')
    await expect(links).toHaveCount(7)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '7-1-classical-idea-of-redox-reactions',
      '7-2-redox-reactions-in-terms-of-electron-transfer',
      '7-3-oxidation-number',
      '7-3-1-types-of-redox-reactions',
      '7-3-2-balancing-of-redox-reactions',
      '7-3-3-redox-reactions-as-the-basis-for-titrations',
      '7-4-redox-reactions-and-electrode-processes',
    ])
  })

  test('Unit 8 lists its thirteen Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-8')
    const links = page.locator('a[href^="/class-11/unit-8/"]')
    await expect(links).toHaveCount(13)
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.map((h) => h?.split('/').pop())).toEqual([
      '8-1-general-introduction',
      '8-2-tetravalence-of-carbon-shapes-of-organic-compounds',
      '8-3-structural-representations',
      '8-4-classification-of-organic-compounds',
      '8-5-nomenclature-alkanes',
      '8-5-3-functional-naming',
      '8-6-isomerism',
      '8-7-1-reaction-mechanisms',
      '8-7-4-electron-displacement-effects',
      '8-8-purification-methods',
      '8-8-5-chromatography',
      '8-9-qualitative-analysis',
      '8-10-quantitative-analysis',
    ])
  })

  test('Unit 5 lists its seven Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-5')
    const links = page.locator('a[href^="/class-11/unit-5/"]')
    await expect(links).toHaveCount(7)
    await expect(links.first()).toHaveAttribute('href', /5-1-thermodynamic-terms$/)
    await expect(links.last()).toHaveAttribute('href', /5-7-gibbs-energy-and-equilibrium$/)
  })

  test('Unit 4 lists its eight Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-4')
    const links = page.locator('a[href^="/class-11/unit-4/"]')
    await expect(links).toHaveCount(8)
    await expect(links.first()).toHaveAttribute('href', /4-1-kossel-lewis-approach$/)
    await expect(links.last()).toHaveAttribute('href', /4-9-hydrogen-bonding$/)
  })

  test('Unit 3 lists its six Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-3')
    const links = page.locator('a[href^="/class-11/unit-3/"]')
    await expect(links).toHaveCount(6)
    await expect(links.first()).toHaveAttribute('href', /3-1-classifying-elements-and-genesis$/)
    await expect(links.last()).toHaveAttribute('href', /3-7-chemical-properties-and-reactivity$/)
  })

  test('Unit 1 lists all ten Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-1')
    const links = page.locator('a[href^="/class-11/unit-1/"]')
    await expect(links).toHaveCount(10)
    await expect(links.first()).toHaveAttribute('href', /1-1-importance-of-chemistry$/)
    await expect(links.last()).toHaveAttribute('href', /1-10-stoichiometry$/)
  })
})
