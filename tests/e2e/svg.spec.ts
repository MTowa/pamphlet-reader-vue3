import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const vueURL = 'http://127.0.0.1:4173/demo/'
const nuxtURL = 'http://127.0.0.1:4174/nuxt-demo/'
const viewer = (page: Page) => page.getByRole('region', { name: 'SVGパンフレットビューアー' })
const number = (page: Page) => page.getByRole('spinbutton', { name: '移動先のページ番号' })
async function ready(page: Page) {
  await expect(viewer(page)).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('.vfb img').first()).toBeVisible()
  expect(
    await page
      .locator('.vfb img')
      .first()
      .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
  ).toBe(true)
}
function track(page: Page) {
  const requests: string[] = [],
    workers: string[] = [],
    errors: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('worker', (worker) => workers.push(worker.url()))
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text())
  })
  return { requests, workers, errors }
}

for (const [app, url] of [
  ['Vue', vueURL],
  ['Nuxt', nuxtURL],
]) {
  test(`${app} starts with SVG without PDF runtime or worker and navigates pages`, async ({
    page,
    request,
    isMobile,
  }) => {
    const seen = track(page)
    if (app === 'Nuxt') {
      const response = await request.get(url + '?format=svg')
      expect(response.status()).toBe(200)
      expect(await response.text()).toContain('SVGを読み込んでいます')
    }
    await page.goto(url + '?format=svg')
    await ready(page)
    await expect(viewer(page)).toHaveAttribute('data-mode', isMobile ? 'single' : 'spread')
    await expect(page.locator('.vfb__total')).toHaveText('/ 6')
    await expect(page.locator('.vfb canvas')).toHaveCount(0)
    expect(seen.workers).toEqual([])
    expect(
      seen.requests.filter((url) =>
        /PdfDocumentSession|pdfjs|\.pdf(?:$|\?)|\.wasm(?:$|\?)/i.test(url),
      ),
    ).toEqual([])
    expect(seen.requests.some((url) => url.endsWith('/pamphlet/flipbook.json'))).toBe(true)
    await page.getByRole('button', { name: '次のページ', exact: true }).click()
    await expect(number(page)).toHaveValue('2')
    await expect(page.locator('[data-page="2"] img')).toBeVisible()
    if (!isMobile) await expect(page.locator('[data-page="3"] img')).toBeVisible()
    await page.waitForTimeout(650)
    await number(page).fill('6')
    await page.getByRole('button', { name: '指定ページへ移動' }).click()
    await expect(number(page)).toHaveValue('6')
    await expect(page.locator('[data-page="6"] img')).toBeVisible()
    expect(await page.locator('.vfb img').count()).toBeLessThanOrEqual(6)
    await expect(page.locator('[data-page="1"] img')).toHaveCount(0)
    expect(seen.errors).toEqual([])
    if (app === 'Vue')
      await page.screenshot({
        path: 'test-results/' + (isMobile ? 'mobile' : 'desktop') + '-svg.png',
        fullPage: true,
      })
  })
}

test('SVG supports drag/touch, fullscreen and responsive resizing', async ({ page, isMobile }) => {
  await page.goto(vueURL + '?format=svg')
  await ready(page)
  await page.locator('.vfb__book').scrollIntoViewIfNeeded()
  const box = (await page.locator('[data-page="1"]').boundingBox())!
  const start = box.x + box.width - 10,
    end = Math.max(1, box.x - (isMobile ? 15 : box.width * 0.55)),
    y = box.y + box.height * 0.5
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: start, y }],
    })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: end, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  } else {
    await page.mouse.move(start, y)
    await page.mouse.down()
    await page.mouse.move(end, y, { steps: 15 })
    await page.mouse.up()
  }
  await expect(number(page)).toHaveValue('2')
  await page.waitForTimeout(650)
  await page.getByRole('button', { name: '全画面表示', exact: true }).click()
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
  await page.getByRole('button', { name: '全画面表示を終了', exact: true }).click()
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
  if (!isMobile) {
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(viewer(page)).toHaveAttribute('data-mode', 'single')
    await page.setViewportSize({ width: 1440, height: 1100 })
    await expect(viewer(page)).toHaveAttribute('data-mode', 'spread')
  }
  await expect(number(page)).toHaveValue('2')
  await expect(page.locator('[data-page="2"] img')).toBeVisible()
})

test('switches SVG to PDF and back, releases the worker, and remounts', async ({ page }) => {
  const seen = track(page)
  await page.goto(vueURL + '?format=svg')
  await ready(page)
  await page.getByRole('button', { name: /Fieldnotes オリジナルサンプル/ }).click()
  await expect(page.locator('.vfb canvas').first()).toBeVisible()
  await expect(page.locator('.vfb')).toHaveAttribute('aria-busy', 'false')
  expect(seen.workers.length).toBe(1)
  await page.getByRole('button', { name: /SVGフォルダー/ }).click()
  await ready(page)
  await expect.poll(() => page.workers().length).toBe(0)
  await expect(page.locator('.vfb canvas')).toHaveCount(0)
  await page.getByText('検証用コントロール', { exact: true }).click()
  await page.getByRole('button', { name: '取り外す', exact: true }).click()
  await expect(page.locator('.vfb img')).toHaveCount(0)
  await page.getByRole('button', { name: '再マウント', exact: true }).click()
  await ready(page)
  expect(seen.errors).toEqual([])
})

for (const failingFile of ['flipbook.json', '001.svg', '002.svg']) {
  test(`reports missing ${failingFile} and recovers on retry`, async ({ page }) => {
    const pattern = '**/pamphlet/' + failingFile
    await page.route(pattern, (route) => route.fulfill({ status: 404, body: 'missing' }))
    await page.goto(vueURL + '?format=svg')
    await expect(page.getByRole('alert')).toContainText(
      failingFile === '002.svg' ? 'ページを描画できませんでした' : 'SVGを読み込めませんでした',
    )
    await page.unroute(pattern)
    await page.getByRole('button', { name: 'もう一度読み込む' }).click()
    await ready(page)
  })
}

test('discards a delayed SVG index after switching to a PDF', async ({ page }) => {
  let release!: () => void
  const delayed = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/pamphlet/flipbook.json', async (route) => {
    await delayed
    await route.fulfill({ json: { version: 1, pages: ['001.svg'] } }).catch(() => {})
  })
  await page.goto(vueURL + '?format=svg')
  await page.getByText('検証用コントロール', { exact: true }).click()
  await page.getByRole('button', { name: '別のPDF（3ページ）' }).click()
  await expect(page.locator('.vfb canvas').first()).toBeVisible()
  release()
  await page.waitForTimeout(200)
  await expect(page.locator('.vfb')).toHaveAttribute('data-source', 'pdf')
  await expect(page.locator('.vfb__total')).toHaveText('/ 3')
  await expect(page.locator('.vfb img')).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('unmounts while the first SVG image is still loading', async ({ page }) => {
  const seen = track(page)
  let release!: () => void
  const delayed = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/pamphlet/001.svg', async (route) => {
    await delayed
    await route
      .fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
      })
      .catch(() => {})
  })
  await page.goto(vueURL + '?format=svg')
  await expect.poll(() => seen.requests.some((url) => url.endsWith('/001.svg'))).toBe(true)
  await page.getByText('検証用コントロール', { exact: true }).click()
  await page.getByRole('button', { name: '取り外す', exact: true }).click()
  release()
  await page.waitForTimeout(200)
  await expect(page.locator('.vfb')).toHaveCount(0)
  expect(seen.errors).toEqual([])
  expect(seen.workers).toEqual([])
})

test('records cold PDF and SVG transfer and first-ready timings for the same sample', async ({
  browser,
  isMobile,
}, testInfo) => {
  test.skip(isMobile, 'One descriptive desktop measurement; not a performance threshold.')
  const samples = []
  for (const format of ['pdf', 'svg']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
    const page = await context.newPage()
    await page.goto(vueURL + '?format=' + format)
    await expect(page.locator('.vfb')).toHaveAttribute('aria-busy', 'false')
    await expect(page.getByRole('alert')).toHaveCount(0)
    await page.waitForTimeout(300)
    samples.push(
      await page.evaluate((format) => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        return {
          format,
          firstReadyMs: performance.getEntriesByName('flipbook-ready')[0]!.startTime,
          encodedResourceBytes: resources.reduce(
            (total, entry) => total + entry.encodedBodySize,
            0,
          ),
          resources: resources.map((entry) => ({ url: entry.name, bytes: entry.encodedBodySize })),
        }
      }, format),
    )
    await context.close()
  }
  await testInfo.attach('cold-load-comparison', {
    body: JSON.stringify(samples, null, 2),
    contentType: 'application/json',
  })
})
