import type { PageRenderer, RenderedPage } from './types'
interface CacheEntry {
  result: RenderedPage
  width: number
  height: number
}

/** Sequential rendering bounds nearby images/canvases and avoids overlapping tasks. */
export class PageRenderQueue {
  private cache = new Map<number, CacheEntry>()
  private wanted: number[] = []
  private width = 1
  private height = 1
  private active?: { page: number; abort: AbortController }
  private running = false
  private disposed = false
  private version = 0
  private failed = new Set<number>()

  constructor(
    private renderer: PageRenderer,
    private attach: (page: number, element: HTMLElement) => void,
    private detach: (page: number) => void,
    private onError: (error: unknown) => void,
  ) {}

  update(pages: number[], width: number, height: number) {
    if (this.disposed) return
    this.wanted = [...new Set(pages)].slice(0, 6)
    this.width = Math.max(1, width)
    this.height = Math.max(1, height)
    this.version++
    this.failed.clear()
    for (const [page, cached] of this.cache) {
      if (!this.wanted.includes(page)) {
        this.detach(page)
        cached.result.release()
        this.cache.delete(page)
      }
    }
    if (this.active && !this.wanted.includes(this.active.page)) this.active.abort.abort()
    void this.pump()
  }

  /** Used when the flip engine is rebuilt; cached page elements are moved, not copied. */
  reattach() {
    for (const [page, cached] of this.cache) this.attach(page, cached.result.element)
  }

  private sufficient(page: number) {
    const entry = this.cache.get(page)
    // Small resizes and shrinking reuse the existing canvas.
    return (
      entry &&
      (this.renderer.resolutionIndependent ||
        (entry.width >= this.width * 0.85 && entry.height >= this.height * 0.85))
    )
  }

  private async pump() {
    if (this.running || this.disposed) return
    this.running = true
    try {
      while (!this.disposed) {
        const page = this.wanted.find((value) => !this.sufficient(value) && !this.failed.has(value))
        if (page === undefined) break
        const abort = new AbortController()
        this.active = { page, abort }
        const width = this.width,
          height = this.height,
          version = this.version
        try {
          const result = await this.renderer.render(page, width, height, abort.signal)
          if (this.disposed || abort.signal.aborted || !this.wanted.includes(page)) {
            result.release()
          } else {
            this.cache.get(page)?.result.release()
            this.cache.set(page, { result, width, height })
            this.attach(page, result.element)
          }
        } catch (error) {
          if (!this.disposed && !abort.signal.aborted) {
            this.failed.add(page)
            if (version === this.version) this.onError(error)
          }
        } finally {
          this.active = undefined
        }
      }
    } finally {
      this.running = false
    }
  }

  destroy() {
    this.disposed = true
    this.active?.abort.abort()
    for (const [page, entry] of this.cache) {
      this.detach(page)
      entry.result.release()
    }
    this.cache.clear()
    this.wanted = []
  }
}
