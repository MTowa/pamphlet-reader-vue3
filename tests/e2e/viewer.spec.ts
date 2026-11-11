import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import path from 'node:path'

const vueURL = 'http://127.0.0.1:4173/demo/'
const nuxtURL = 'http://127.0.0.1:4174/nuxt-demo/'
const viewer = (page: Page) => page.getByRole('region', { name: 'PDFパンフレットビューアー' })
const number = (page: Page) => page.getByRole('spinbutton', { name: '移動先のページ番号' })
async function ready(page: Page) {
  await expect(viewer(page)).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('.vfb canvas').first()).toBeVisible()
}
async function diagnostics(page: Page) {
  await page.getByText('検証用コントロール', { exact: true }).click()
}
async function jump(page: Page, target: number) {
  await number(page).fill(String(target))
  await page.getByRole('button', { name: '指定ページへ移動' }).click()
}

test('turns pages by dragging or a real touch swipe', async ({ page, isMobile }) => {
  await page.goto(vueURL)
  await ready(page)
  await page.locator('.vfb__book').scrollIntoViewIfNeeded()
  const bounds = await page.locator('[data-page="1"]').boundingBox()
  expect(bounds).not.toBeNull()
  const startX = bounds!.x + bounds!.width - 10
  // A completed drag passes the book's spine; stopping on its right returns the page.
  const endX = Math.max(1, bounds!.x - (isMobile ? 15 : bounds!.width * 0.55))
  const y = bounds!.y + bounds!.height * 0.5
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y }],
    })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: endX, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  } else {
    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(endX, y, { steps: 15 })
    await page.mouse.up()
  }
  await expect(number(page)).toHaveValue('2')
})

test('enters and exits fullscreen from its toolbar', async ({ page }) => {
  await page.goto(vueURL)
  await ready(page)
  await page.getByRole('button', { name: '全画面表示', exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.classList.contains('vfb')))
    .toBe(true)
  await page.getByRole('button', { name: '全画面表示を終了', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true)
  await ready(page)
})

test('ignores a stale PDF response after src changes during loading', async ({ page }) => {
  let release!: () => void
  const delayed = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/sample.pdf', async (route) => {
    await delayed
    await route
      .fulfill({ path: path.resolve('tests/fixtures/sample.pdf'), contentType: 'application/pdf' })
      .catch(() => {})
  })
  await page.goto(vueURL)
  await diagnostics(page)
  await page.getByRole('button', { name: '別のPDF（3ページ）' }).click()
  await expect(page.locator('.vfb__total')).toHaveText('/ 3')
  await ready(page)
  release()
  await page.waitForTimeout(200)
  await expect(page.locator('.vfb__total')).toHaveText('/ 3')
})

test('loads real PDF in a worker and flips with correct cover numbering', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = []
  const workers: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('worker', (worker) => workers.push(worker.url()))
  await page.goto(vueURL)
  await ready(page)
  await expect(number(page)).toHaveValue('1')
  await expect(viewer(page)).toHaveAttribute('data-mode', isMobile ? 'single' : 'spread')
  await expect(page.locator('.vfb__total')).toHaveText('/ 6')
  const pixels = await page
    .locator('.vfb canvas')
    .first()
    .evaluate((element: HTMLCanvasElement) => {
      const data = element.getContext('2d')!.getImageData(10, 10, 1, 1).data
      return [...data]
    })
  expect(pixels[3]).toBe(255)
  expect(pixels[0]).toBeLessThan(100)
  expect(workers.some((url) => url.startsWith('blob:'))).toBe(true)
  await page.getByRole('button', { name: '次のページ', exact: true }).click()
  await expect(number(page)).toHaveValue('2')
  await page.waitForTimeout(650)
  if (!isMobile) {
    await expect(page.locator('.vfb__page[aria-hidden="false"]')).toHaveCount(2)
    await expect(page.locator('[data-page="2"] canvas')).toBeVisible()
    await expect(page.locator('[data-page="3"] canvas')).toBeVisible()
  }
  await page.getByRole('button', { name: '前のページ', exact: true }).click()
  await expect(number(page)).toHaveValue('1')
  await page.waitForTimeout(650)
  await jump(page, 5)
  await expect(number(page)).toHaveValue(isMobile ? '5' : '4')
  expect(errors).toEqual([])
  await page.screenshot({
    path: 'test-results/' + (isMobile ? 'mobile' : 'desktop') + '-viewer.png',
    fullPage: true,
  })
})

test('changes source, handles missing PDF, retries and accepts File input', async ({ page }) => {
  await page.goto(vueURL)
  await ready(page)
  await diagnostics(page)
  await page.getByRole('button', { name: '別のPDF（3ページ）' }).click()
  await expect(page.locator('.vfb__total')).toHaveText('/ 3')
  await ready(page)
  await page.getByRole('button', { name: '存在しないPDF', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('PDFを読み込めませんでした')
  await page.getByRole('button', { name: 'もう一度読み込む' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page
    .getByLabel('PDFファイルを選択')
    .setInputFiles(path.resolve('tests/fixtures/sample.pdf'))
  await ready(page)
  await expect(page.locator('.vfb__total')).toHaveText('/ 6')
})

test('single-page document, cover toggle, keyboard scope and toolbar', async ({
  page,
  isMobile,
}) => {
  await page.goto(vueURL)
  await ready(page)
  await page.getByLabel('表紙を単独で表示').uncheck()
  await page.waitForTimeout(200)
  if (!isMobile) await expect(page.locator('.vfb__page[aria-hidden="false"]')).toHaveCount(2)
  await viewer(page).focus()
  await page.keyboard.press('End')
  await expect(number(page)).toHaveValue(isMobile ? '6' : '5')
  await viewer(page).focus()
  await page.keyboard.press('Home')
  await expect(number(page)).toHaveValue('1')
  await number(page).focus()
  await page.keyboard.press('ArrowRight')
  await expect(number(page)).toHaveValue('1')
  await page.getByLabel('操作バーを表示').uncheck()
  await expect(page.getByRole('group', { name: 'ページ操作' })).toHaveCount(0)
  await page.getByLabel('操作バーを表示').check()
  await diagnostics(page)
  await page.getByRole('button', { name: '1ページPDF' }).click()
  await ready(page)
  await expect(page.locator('.vfb__total')).toHaveText('/ 1')
  await expect(page.getByRole('button', { name: '次のページ', exact: true })).toBeDisabled()
})

test('bounds canvas memory for an 80-page PDF and changes responsive mode', async ({
  page,
  isMobile,
}) => {
  await page.goto(vueURL)
  await ready(page)
  await diagnostics(page)
  await page.getByRole('button', { name: '長いPDF（80ページ）' }).click()
  await expect(page.locator('.vfb__total')).toHaveText('/ 80')
  await ready(page)
  await jump(page, 40)
  await expect(number(page)).toHaveValue('40')
  await expect(page.locator('[data-page="40"] canvas')).toBeVisible()
  expect(await page.locator('.vfb canvas').count()).toBeLessThanOrEqual(6)
  expect(await page.locator('[data-page="1"] canvas').count()).toBe(0)
  const pixels = await page
    .locator('.vfb canvas')
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLCanvasElement).width * (node as HTMLCanvasElement).height),
    )
  expect(Math.max(...pixels)).toBeLessThanOrEqual(2_000_000)
  if (!isMobile) {
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(viewer(page)).toHaveAttribute('data-mode', 'single')
    await expect(number(page)).toHaveValue('40')
    await page.setViewportSize({ width: 1440, height: 1100 })
    await expect(viewer(page)).toHaveAttribute('data-mode', 'spread')
  }
})

test('destroys worker and animation loop, then remounts cleanly', async ({ page }) => {
  await page.addInitScript(() => {
    const stats = { workers: 0, terminated: 0, frames: new Set<number>() }
    Object.assign(window, { __flipbookStats: stats })
    const OriginalWorker = window.Worker
    window.Worker = class extends OriginalWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options)
        stats.workers++
      }
      terminate() {
        stats.terminated++
        super.terminate()
      }
    }
    const request = window.requestAnimationFrame.bind(window)
    const cancel = window.cancelAnimationFrame.bind(window)
    window.requestAnimationFrame = (callback) => {
      const id = request((time) => {
        stats.frames.delete(id)
        callback(time)
      })
      stats.frames.add(id)
      return id
    }
    window.cancelAnimationFrame = (id) => {
      stats.frames.delete(id)
      cancel(id)
    }
  })
  await page.goto(vueURL)
  await ready(page)
  await diagnostics(page)
  await page.getByRole('button', { name: '取り外す', exact: true }).click()
  await expect(viewer(page)).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const stats = (
          window as unknown as {
            __flipbookStats: { workers: number; terminated: number; frames: Set<number> }
          }
        ).__flipbookStats
        return { liveWorkers: stats.workers - stats.terminated, frames: stats.frames.size }
      }),
    )
    .toEqual({ liveWorkers: 0, frames: 0 })
  await page.getByRole('button', { name: '再マウント', exact: true }).click()
  await ready(page)
  await expect(number(page)).toHaveValue('1')
})

test('Nuxt production SSR imports and hydrates installed package', async ({
  page,
  request,
  isMobile,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text())
  })
  const response = await request.get(nuxtURL)
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('PDFを読み込んでいます')
  await page.goto(nuxtURL)
  await ready(page)
  await expect(viewer(page)).toHaveAttribute('data-mode', isMobile ? 'single' : 'spread')
  await expect(page.getByTestId('metadata')).toHaveText('6 pages')
  await page.getByRole('button', { name: '次のページ', exact: true }).click()
  await expect(number(page)).toHaveValue('2')
  await page.getByRole('button', { name: '別のPDF', exact: true }).click()
  await expect(page.getByTestId('metadata')).toHaveText('3 pages')
  await ready(page)
  expect(errors).toEqual([])
})
