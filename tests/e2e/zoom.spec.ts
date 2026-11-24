import { expect, test } from '@playwright/test'

for (const [app, url] of [
  ['Vue', 'http://127.0.0.1:4173/demo/'],
  ['Nuxt', 'http://127.0.0.1:4174/nuxt-demo/'],
]) {
  for (const format of ['PDF', 'SVG']) {
    test(`${app} zooms and scrolls ${format} pages without changing their layout mode`, async ({
      page,
      isMobile,
      browserName,
    }) => {
      await page.goto(url + '?format=' + format.toLowerCase())
      const viewer = page.getByRole('region', { name: `${format}パンフレットビューアー` })
      const toolbar = viewer.getByRole('group', { name: 'ページ操作' })
      const zoomIn = toolbar.getByRole('button', { name: '拡大', exact: true })
      const zoomOut = toolbar.getByRole('button', { name: '縮小', exact: true })
      const reset = toolbar.getByRole('button', { name: /表示範囲に合わせる/ })
      const pageNumber = toolbar.getByRole('spinbutton')
      const book = viewer.locator('.vfb__book')
      const bookHeight = () => book.evaluate((element) => element.clientHeight)
      const cover = book.locator('[data-page="1"] .vfb__content')
      const canvasPixels = () =>
        cover.evaluate((canvas: HTMLCanvasElement) => canvas.width * canvas.height)
      await expect(viewer).toHaveAttribute('aria-busy', 'false')
      await expect(cover).toBeVisible()
      await expect(toolbar.getByText(/^(単ページ|見開き)$/)).toHaveCount(0)
      await expect(zoomOut).toBeDisabled()
      const mode = await viewer.getAttribute('data-mode')
      const fitHeight = await bookHeight()
      const fitPixels = format === 'PDF' ? await canvasPixels() : 0
      if (format === 'SVG')
        await cover.evaluate((image) => image.setAttribute('data-cached', 'true'))

      for (let step = 0; step < 4; step++) await zoomIn.click()
      await expect(reset).toHaveText('200%')
      await expect.poll(bookHeight).toBe(fitHeight * 2)
      await expect(viewer).toHaveAttribute('data-mode', mode!)
      await expect(pageNumber).toHaveValue('1')
      if (format === 'PDF') await expect.poll(canvasPixels).toBeGreaterThan(fitPixels)
      else await expect(cover).toHaveAttribute('data-cached', 'true')

      const scrollArea = viewer.getByRole('region', { name: '拡大したページをスクロール' })
      await expect(scrollArea).toHaveCSS('overflow', 'auto')
      if (!isMobile) {
        await scrollArea.hover()
        await page.mouse.wheel(0, 300)
      } else if (browserName === 'chromium') {
        await scrollArea.scrollIntoViewIfNeeded()
        const area = (await scrollArea.boundingBox())!
        const x = area.x + area.width / 2
        const y = area.y + area.height * 0.6
        const session = await page.context().newCDPSession(page)
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x, y }],
        })
        for (const offset of [40, 80, 120]) {
          await session.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: x - offset, y: y - offset }],
          })
        }
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await session.detach()
      } else {
        await scrollArea.evaluate((element) => element.scrollBy(100, 300))
      }
      await expect
        .poll(() => scrollArea.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)
      await expect
        .poll(() => scrollArea.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0)
      await expect(pageNumber).toHaveValue('1')

      await toolbar.getByRole('button', { name: '次のページ', exact: true }).click()
      await expect(pageNumber).toHaveValue('2')
      await expect.poll(() => scrollArea.evaluate((element) => element.scrollTop)).toBe(0)
      await expect(reset).toHaveText('200%')
      await zoomOut.click()
      await expect(reset).toHaveText('175%')
      await reset.click()
      await expect(reset).toHaveText('100%')
      await expect.poll(bookHeight).toBe(fitHeight)
      await expect(pageNumber).toHaveValue('2')

      await zoomIn.click()
      await expect(reset).toHaveText('125%')
      const nextFormat = format === 'PDF' ? 'SVG' : 'PDF'
      await page
        .getByRole('button', { name: nextFormat === 'SVG' ? 'SVGフォルダー' : 'サンプルPDF' })
        .click()
      const nextViewer = page.getByRole('region', { name: `${nextFormat}パンフレットビューアー` })
      await expect(nextViewer).toHaveAttribute('aria-busy', 'false')
      await expect(nextViewer.getByRole('button', { name: /表示範囲に合わせる/ })).toHaveText(
        '100%',
      )
    })
  }
}
