import { describe, expect, it, vi } from 'vitest'
import { PageRenderQueue } from '../../packages/vue-flipbook/src/rendering/PageRenderQueue'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
function result() {
  return { element: document.createElement('canvas'), release: vi.fn() }
}

describe('bounded PDF render queue', () => {
  it('reuses resolution-independent SVG images when resized and releases them on eviction', async () => {
    const first = { element: document.createElement('img'), release: vi.fn() }
    const render = vi.fn(async () => first)
    const queue = new PageRenderQueue(
      { render, resolutionIndependent: true },
      vi.fn(),
      vi.fn(),
      vi.fn(),
    )
    queue.update([1], 200, 300)
    await tick()
    queue.update([1], 1000, 1500)
    await tick()
    expect(render).toHaveBeenCalledOnce()
    queue.update([], 1000, 1500)
    expect(first.release).toHaveBeenCalledOnce()
    queue.destroy()
  })
  it('renders in priority order, reuses smaller sizes, and evicts offscreen canvases', async () => {
    const results = Array.from({ length: 10 }, result)
    const render = vi.fn(async (page: number) => results[page - 1]!)
    const attach = vi.fn(),
      detach = vi.fn()
    const queue = new PageRenderQueue({ render }, attach, detach, vi.fn())
    queue.update([4, 5, 6, 3, 7, 2], 400, 600)
    await tick()
    expect(render.mock.calls.map(([page]) => page)).toEqual([4, 5, 6, 3, 7, 2])
    queue.update([4, 5, 6, 3, 7, 2], 390, 580)
    await tick()
    expect(render).toHaveBeenCalledTimes(6)
    queue.update([8, 9, 10, 7, 6], 390, 580)
    await tick()
    expect(results[1]!.release).toHaveBeenCalledOnce()
    expect(detach).toHaveBeenCalledWith(2)
    queue.destroy()
    expect(results[9]!.release).toHaveBeenCalledOnce()
  })
  it('cancels stale work and never attaches a late result after destroy', async () => {
    let complete!: (value: ReturnType<typeof result>) => void
    let signal!: AbortSignal
    const render = vi.fn((_page, _width, _height, abort: AbortSignal) => {
      signal = abort
      return new Promise<ReturnType<typeof result>>((resolve) => {
        complete = resolve
      })
    })
    const attach = vi.fn()
    const queue = new PageRenderQueue({ render }, attach, vi.fn(), vi.fn())
    queue.update([1], 300, 400)
    queue.destroy()
    expect(signal.aborted).toBe(true)
    const late = result()
    complete(late)
    await tick()
    expect(attach).not.toHaveBeenCalled()
    expect(late.release).toHaveBeenCalledOnce()
  })
  it('does not loop forever when a renderer fails', async () => {
    const error = vi.fn()
    const render = vi.fn().mockRejectedValue(new Error('bad PDF'))
    const queue = new PageRenderQueue({ render }, vi.fn(), vi.fn(), error)
    queue.update([1, 2], 300, 400)
    await tick()
    expect(render).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalledTimes(2)
    queue.destroy()
  })
})
