import { expect } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'

export async function turnPageByDrag(page: Page, isMobile: boolean, browserName: string) {
  await page.locator('.vfb__book').scrollIntoViewIfNeeded()
  const box = (await page.locator('[data-page="1"]').boundingBox())!
  const startX = box.x + box.width - 10
  const endX = Math.max(1, box.x - (isMobile ? 15 : box.width * 0.55))
  const y = box.y + box.height * 0.5
  if (!isMobile) {
    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(endX, y, { steps: 15 })
    await page.mouse.up()
  } else if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y }],
    })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: endX, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  } else {
    // WebKit has no CDP touch injection. These DOM events exercise the engine's
    // touch handlers; physical iOS scrolling/gesture arbitration needs a device.
    const target = page.locator('[data-page="1"]')
    const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))
    const point = (x: number) => ({
      identifier: 1,
      clientX: x,
      clientY: y,
      pageX: x + scroll.x,
      pageY: y + scroll.y,
    })
    const start = point(startX),
      end = point(endX)
    await target.dispatchEvent('touchstart', {
      touches: [start],
      changedTouches: [start],
      targetTouches: [start],
    })
    await target.dispatchEvent('touchmove', {
      touches: [end],
      changedTouches: [end],
      targetTouches: [end],
    })
    await target.dispatchEvent('touchend', {
      touches: [],
      changedTouches: [end],
      targetTouches: [],
    })
  }
}

export async function checkFullscreen(page: Page) {
  const enter = page.getByRole('button', { name: '全画面表示', exact: true })
  if (!(await page.evaluate(() => document.fullscreenEnabled === true))) {
    await expect(enter).toHaveCount(0)
    return
  }
  const bookSize = () =>
    page.locator('.vfb__book').evaluate((book) => ({
      width: book.clientWidth,
      height: book.clientHeight,
    }))
  const initialSize = await bookSize()
  await enter.click()
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.classList.contains('vfb')))
    .toBe(true)
  await page.getByRole('button', { name: '全画面表示を終了', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true)
  // fullscreenchange precedes the debounced book layout. Wait for restoration
  // before a subsequent viewport resize can overlap that pending layout.
  await expect.poll(bookSize).toEqual(initialSize)
}

export async function prepareClipboard(page: Page, context: BrowserContext, browserName: string) {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  // Retain the real write operation. Firefox/WebKit cannot grant Chromium's
  // clipboard-read permission; record only text whose native write succeeded.
  await page.addInitScript(() => {
    const write = navigator.clipboard.writeText.bind(navigator.clipboard)
    navigator.clipboard.writeText = async (value: string) => {
      await write(value)
      Object.assign(window, { __copiedText: value })
    }
  })
}

export async function copiedText(page: Page, browserName: string) {
  return browserName === 'chromium'
    ? page.evaluate(() => navigator.clipboard.readText())
    : page.evaluate(() => (window as unknown as { __copiedText?: string }).__copiedText)
}
