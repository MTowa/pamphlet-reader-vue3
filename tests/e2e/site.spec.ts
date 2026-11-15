import { test, expect } from '@playwright/test'
import { copiedText, prepareClipboard } from './browser-helpers'
import packageInfo from '../../packages/vue-flipbook/package.json' with { type: 'json' }

const siteURL = 'http://127.0.0.1:4173/demo/'
const installCommand = `pnpm add ${packageInfo.name}`

test('pauses the background motion and respects reduced-motion preferences', async ({ page }) => {
  await page.goto(siteURL)
  const light = page.locator('.ambient-light-one')
  await expect
    .poll(() => light.evaluate((element) => element.getAnimations()[0]?.playState))
    .toBe('running')
  await page.getByRole('button', { name: '背景の動きを止める' }).click()
  await expect(page.getByRole('button', { name: '背景の動きを再開' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect
    .poll(() => light.evaluate((element) => element.getAnimations()[0]?.playState))
    .toBe('paused')
  await page.getByRole('button', { name: '背景の動きを再開' }).click()
  await expect
    .poll(() => light.evaluate((element) => element.getAnimations()[0]?.playState))
    .toBe('running')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() =>
      page
        .locator('.hero-backdrop')
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    )
    .toBe(0)
  await expect(page.getByRole('button', { name: '背景の動きを止める' })).toHaveCount(0)
  await page.getByRole('link', { name: 'デモを試す' }).click()
  await expect(page.getByRole('heading', { name: 'デモ', exact: true })).toBeInViewport()
})

test('copies install and usage code and links to documentation, issues and author', async ({
  page,
  context,
  browserName,
}) => {
  await prepareClipboard(page, context, browserName)
  await page.goto(siteURL)
  const install = page.getByRole('group', { name: 'インストールコマンド' })
  await install.getByRole('button', { name: 'コピー', exact: true }).click()
  await expect(install.getByRole('status')).toHaveText('コピーしました')
  expect(await copiedText(page, browserName)).toBe(installCommand)
  await expect(page.getByRole('link', { name: 'npmで見る' })).toHaveAttribute(
    'href',
    `https://www.npmjs.com/package/${packageInfo.name}`,
  )
  const usage = page.getByRole('group', { name: '使用コード' })
  await usage.getByRole('button', { name: 'コピー', exact: true }).click()
  await expect(usage.getByRole('status')).toHaveText('コピーしました')
  expect(await copiedText(page, browserName)).toBe(await usage.locator('code').textContent())
  await expect(page.getByText('検証用コントロール', { exact: true })).toHaveCount(0)
  await page.getByText('表示設定', { exact: true }).click()
  await page.getByLabel('操作バーを表示').uncheck()
  await expect(page.getByRole('group', { name: 'ページ操作' })).toHaveCount(0)
  await page.getByLabel('操作バーを表示').check()
  await expect(page.getByRole('group', { name: 'ページ操作' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'GitHubでソースコードを見る' })).toHaveAttribute(
    'href',
    'https://github.com/MTowa/pamphlet-reader-vue3',
  )
  await expect(page.getByRole('link', { name: /作者： MTowa/ })).toHaveAttribute(
    'href',
    'https://github.com/MTowa',
  )
  for (const [name, path] of [
    ['Nuxtでの使い方', '#nuxt-4'],
    ['API・設定一覧', '/blob/main/docs/api.md'],
    ['ブラウザーの検証範囲・制限', '/blob/main/docs/verification.md#scope-and-known-limitations'],
    ['不具合を報告', '/issues'],
  ]) {
    await expect(page.getByRole('link', { name })).toHaveAttribute(
      'href',
      'https://github.com/MTowa/pamphlet-reader-vue3' + path,
    )
  }
})

test('selects code for manual copying when clipboard permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    })
  })
  await page.goto(siteURL)
  const install = page.getByRole('group', { name: 'インストールコマンド' })
  await install.getByRole('button', { name: 'コピー', exact: true }).click()
  await expect(install.getByRole('status')).toContainText('自動コピーできませんでした')
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(installCommand)
})

test('keeps copy buttons inside their frames in both languages at narrow widths', async ({
  page,
  isMobile,
}, testInfo) => {
  const widths = isMobile ? [320, 390] : [320, 390, 768, 1440]
  for (const lang of ['ja', 'en']) {
    await page.goto(siteURL + '?lang=' + lang)
    await expect(page).toHaveTitle('vue-leafbook')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('vue-leafbook')
    const favicon = await page.locator('link[rel="icon"]').getAttribute('href')
    expect(favicon).toBe('/demo/favicon.svg')
    const iconResponse = await page.request.get(new URL(favicon!, siteURL).href)
    expect(iconResponse.ok()).toBe(true)
    expect(iconResponse.headers()['content-type']).toContain('image/svg+xml')
    await expect(page.locator('.vfb')).toHaveAttribute('aria-busy', 'false')
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 })
      await expect(page.locator('.vfb')).toHaveAttribute(
        'data-mode',
        width < 640 ? 'single' : 'spread',
      )
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await expect
        .poll(() =>
          page.locator('.github-mark').evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBe(98)
      for (const panel of await page.locator('.code-panel').all()) {
        await panel.evaluate((element) =>
          Promise.all(element.getAnimations().map((animation) => animation.finished)),
        )
        const frame = (await panel.boundingBox())!
        const button = (await panel.getByRole('button').boundingBox())!
        const code = panel.locator('pre')
        // Transformed bounds in Firefox can round 44px down by a fraction of a pixel.
        expect(button.height).toBeGreaterThanOrEqual(44 - 0.01)
        expect(button.x).toBeGreaterThanOrEqual(frame.x)
        expect(button.y).toBeGreaterThanOrEqual(frame.y)
        expect(button.x + button.width).toBeLessThanOrEqual(frame.x + frame.width + 1)
        expect(button.y + button.height).toBeLessThanOrEqual(
          (await panel.locator('code').boundingBox())!.y + 1,
        )
        expect(await code.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
          true,
        )
      }
      const header = (await page.locator('.site-header').boundingBox())!
      const github = (await page.locator('.github-link').boundingBox())!
      expect(github.x + github.width).toBeLessThanOrEqual(header.x + header.width + 1)
      for (const item of await page
        .locator('.feature-list > div, .support-list > div, .documentation-links a, .site-footer a')
        .all()) {
        const bounds = (await item.boundingBox())!
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1)
      }
    }
    await page.screenshot({
      path: testInfo.outputPath('introduction-' + lang + '.png'),
      fullPage: true,
    })
  }
})

test('opens in English and switches language without reloading the document', async ({
  page,
  context,
  browserName,
}) => {
  await prepareClipboard(page, context, browserName)
  let pdfRequests = 0
  page.on('request', (request) => {
    if (request.url().endsWith('/sample.pdf')) pdfRequests++
  })
  await page.goto(siteURL + '?lang=en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('region', { name: 'Features', exact: true })).toContainText(
    'No manual worker setup',
  )
  await expect(page.getByRole('region', { name: 'Compatibility & limits' })).toContainText(
    'Not yet supported',
  )
  await expect(page.getByRole('link', { name: 'Report an issue' })).toHaveAttribute(
    'href',
    'https://github.com/MTowa/pamphlet-reader-vue3/issues',
  )
  await expect(
    page.getByRole('region', { name: 'PDF pamphlet viewer', exact: true }),
  ).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'Page number' })).toHaveValue('2')
  const usage = page.getByRole('group', { name: 'Usage example' })
  await usage.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(usage.getByRole('status')).toHaveText('Copied')
  expect(await copiedText(page, browserName)).toContain('locale="en"')
  const before = pdfRequests
  await page.getByRole('button', { name: '日本語に切り替える' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await expect(page.getByRole('region', { name: '特徴', exact: true })).toContainText(
    'Workerの手動設定不要',
  )
  await expect(page.getByRole('region', { name: '対応範囲', exact: true })).toContainText(
    '未対応の機能',
  )
  await expect(page.getByRole('link', { name: 'Report an issue' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '不具合を報告' })).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: '移動先のページ番号' })).toHaveValue('2')
  expect(pdfRequests).toBe(before)
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page).toHaveURL(/lang=en/)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeVisible()
})

for (const format of ['pdf', 'svg']) {
  test('shows an English loading error and retry for ' + format, async ({ page }) => {
    const pattern = format === 'svg' ? '**/pamphlet/flipbook.json' : '**/sample.pdf'
    await page.route(pattern, (route) => route.fulfill({ status: 404, body: 'missing' }))
    await page.goto(siteURL + '?lang=en&format=' + format)
    await expect(page.getByRole('alert')).toContainText('Could not load')
    await page.unroute(pattern)
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(page.locator('.vfb')).toHaveAttribute('aria-busy', 'false')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}
