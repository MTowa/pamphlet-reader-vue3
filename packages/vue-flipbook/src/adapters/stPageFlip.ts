import { PageFlip } from 'page-flip'
import type { FlipEngine, FlipEngineOptions } from './FlipEngine'

export function createFlipEngine(options: FlipEngineOptions): FlipEngine {
  const engine = new PageFlip(options.host, {
    width: options.pageWidth,
    height: options.pageHeight,
    size: 'fixed',
    autoSize: false,
    usePortrait: options.mode === 'single',
    showCover: options.showCover,
    startPage: options.startPage - 1,
    flippingTime: Math.max(100, options.duration),
    maxShadowOpacity: 0.22,
    mobileScrollSupport: false,
    swipeDistance: 24,
    showPageCorners: true,
    clickEventForward: false,
  })
  let destroyed = false
  engine.on('flip', (event: { data: number }) => options.onPageChange(Number(event.data) + 1))
  engine.on('changeState', (event: { data: string }) =>
    options.onStateChange(event.data !== 'read'),
  )
  engine.loadFromHTML(options.pages)

  return {
    next: () => {
      if (!destroyed) engine.flipNext()
    },
    previous: () => {
      if (!destroyed) engine.flipPrev()
    },
    goTo: (page) => {
      if (!destroyed) engine.turnToPage(page - 1)
    },
    destroy: () => {
      if (destroyed) return
      destroyed = true
      engine.off('flip')
      engine.off('changeState')
      engine.destroy()
    },
  }
}
