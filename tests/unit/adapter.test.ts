import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFlipEngine } from '../../packages/vue-flipbook/src/adapters/stPageFlip'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})
describe('StPageFlip lifecycle patch', () => {
  it('cancels the scheduled frame and removes resize listeners on destroy', () => {
    const request = vi.fn(() => 77)
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', request)
    vi.stubGlobal('cancelAnimationFrame', cancel)
    const remove = vi.spyOn(window, 'removeEventListener')
    const host = document.createElement('div')
    document.body.append(host)
    const pages = Array.from({ length: 6 }, () => document.createElement('div'))
    host.append(...pages)
    const engine = createFlipEngine({
      host,
      pages,
      pageWidth: 300,
      pageHeight: 400,
      mode: 'spread',
      showCover: true,
      startPage: 1,
      duration: 300,
      onPageChange: vi.fn(),
      onStateChange: vi.fn(),
    })
    expect(request).toHaveBeenCalledOnce()
    engine.destroy()
    engine.destroy()
    expect(cancel).toHaveBeenCalledWith(77)
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(host.isConnected).toBe(false)
  })
})
