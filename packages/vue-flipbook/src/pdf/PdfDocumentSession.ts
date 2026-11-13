import { getDocument, PDFWorker } from 'pdfjs-dist'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import InlinePdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline'
import { EmbeddedBinaryDataFactory } from './embeddedAssets'
import type { PdfSource } from '../types'

export interface RenderedPage {
  canvas: HTMLCanvasElement
  release(): void
}

/** One worker per document. Loaded only inside the browser after mount. */
export class PdfDocumentSession {
  private port?: Worker
  private worker?: PDFWorker
  private loadingTask?: PDFDocumentLoadingTask
  private document?: PDFDocumentProxy
  private tasks = new Set<RenderTask>()
  private disposed = false
  private disposal?: Promise<void>

  async open(src: PdfSource, progress: (loaded: number, total: number | null) => void) {
    if (this.disposed) throw new DOMException('Document closed', 'AbortError')
    const input =
      typeof src === 'string' ? { url: src } : { data: new Uint8Array(await src.arrayBuffer()) }
    if (this.disposed) throw new DOMException('Document closed', 'AbortError')
    this.port = new InlinePdfWorker()
    this.worker = PDFWorker.create({ port: this.port })
    this.loadingTask = getDocument({
      ...input,
      worker: this.worker,
      BinaryDataFactory: EmbeddedBinaryDataFactory,
      useWorkerFetch: false,
      enableXfa: false,
    })
    this.loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (!this.disposed) progress(loaded, total > 0 ? total : null)
    }
    this.document = await this.loadingTask.promise
    const first = await this.document.getPage(1)
    const viewport = first.getViewport({ scale: 1 })
    first.cleanup()
    return { pageCount: this.document.numPages, aspectRatio: viewport.width / viewport.height }
  }

  async render(
    pageNumber: number,
    width: number,
    height: number,
    signal: AbortSignal,
  ): Promise<RenderedPage> {
    if (!this.document || this.disposed || signal.aborted)
      throw new DOMException('Cancelled', 'AbortError')
    const page = await this.document.getPage(pageNumber)
    if (this.disposed || signal.aborted) {
      page.cleanup()
      throw new DOMException('Cancelled', 'AbortError')
    }
    const original = page.getViewport({ scale: 1 })
    const density = Math.min(window.devicePixelRatio || 1, 2)
    const desired = Math.min(width / original.width, height / original.height) * density
    // Each canvas is capped at two million pixels (about 8 MB of RGBA memory).
    const scale = Math.min(desired, Math.sqrt(2_000_000 / (original.width * original.height)))
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))
    canvas.setAttribute('aria-hidden', 'true')
    const task = page.render({ canvas, viewport, background: '#ffffff' })
    this.tasks.add(task)
    const cancel = () => task.cancel()
    signal.addEventListener('abort', cancel, { once: true })
    try {
      await task.promise
      if (this.disposed || signal.aborted) throw new DOMException('Cancelled', 'AbortError')
      return {
        canvas,
        release: () => {
          canvas.width = 0
          canvas.height = 0
          page.cleanup()
        },
      }
    } catch (error) {
      canvas.width = 0
      canvas.height = 0
      throw error
    } finally {
      signal.removeEventListener('abort', cancel)
      this.tasks.delete(task)
      page.cleanup()
    }
  }

  destroy(): Promise<void> {
    if (this.disposal) return this.disposal
    this.disposed = true
    this.tasks.forEach((task) => task.cancel())
    this.disposal = (async () => {
      try {
        await Promise.allSettled([...this.tasks].map((task) => task.promise))
        await this.loadingTask?.destroy()
      } finally {
        this.worker?.destroy()
        this.port?.terminate()
        this.tasks.clear()
        this.document = undefined
        this.loadingTask = undefined
        this.worker = undefined
        this.port = undefined
      }
    })()
    return this.disposal
  }
}
