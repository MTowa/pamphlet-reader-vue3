import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import FlipbookViewer from '../../packages/vue-flipbook/src/components/FlipbookViewer.vue'
import type { FlipEngineOptions } from '../../packages/vue-flipbook/src/adapters/FlipEngine'
import { visiblePages } from '../../packages/vue-flipbook/src/utils/pages'

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  disconnect: vi.fn(),
  next: vi.fn(),
  goTo: vi.fn(),
}))
vi.mock('../../packages/vue-flipbook/src/pdf/PdfDocumentSession', () => ({
  PdfDocumentSession: class {
    async open() {
      return { pageCount: 6, aspectRatio: 0.7 }
    }
    async render() {
      return { canvas: document.createElement('canvas'), release: vi.fn() }
    }
    destroy() {
      mocks.destroy()
      return Promise.resolve()
    }
  },
}))
vi.mock('../../packages/vue-flipbook/src/adapters/stPageFlip', () => ({
  createFlipEngine(options: FlipEngineOptions) {
    options.onPageChange(options.startPage)
    return {
      next: mocks.next,
      previous: vi.fn(),
      goTo: (page: number) => {
        mocks.goTo(page)
        options.onPageChange(page)
      },
      destroy: vi.fn(),
    }
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {
        mocks.disconnect()
      }
    },
  )
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 900,
    height: 600,
  } as DOMRect)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('component API', () => {
  it('emits ready and loading events and uses a one-based startPage', async () => {
    const wrapper = mount(FlipbookViewer, { props: { src: '/sample.pdf', startPage: 5 } })
    await flushPromises()
    expect(wrapper.emitted('ready')?.[0]?.[0]).toMatchObject({
      page: 4,
      pageCount: 6,
      visiblePages: [4, 5],
    })
    expect(wrapper.emitted('loading')?.[0]?.[0]).toMatchObject({ loading: true })
    expect(wrapper.emitted('loading')?.at(-1)?.[0]).toMatchObject({ loading: false })
    expect(visiblePages(5, 6, 'spread', true)).toEqual([4, 5])
    wrapper.unmount()
    await flushPromises()
    expect(mocks.destroy).toHaveBeenCalledOnce()
    expect(mocks.disconnect).toHaveBeenCalledOnce()
  })
  it('can disable keyboard and toolbar, and reloads when src changes', async () => {
    const wrapper = mount(FlipbookViewer, {
      props: { src: '/first.pdf', keyboardNavigation: false, showToolbar: false },
    })
    await flushPromises()
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(mocks.next).not.toHaveBeenCalled()
    expect(wrapper.find('[aria-label="ページ操作"]').exists()).toBe(false)
    await wrapper.setProps({ src: '/second.pdf' })
    await flushPromises()
    expect(mocks.destroy).toHaveBeenCalledOnce()
    expect(wrapper.emitted('ready')).toHaveLength(2)
    wrapper.unmount()
  })
})
