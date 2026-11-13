import type { RenderedPage } from '../rendering/types'

const manifestName = 'flipbook.json'

export function parseSvgManifest(value: unknown, directory: URL): string[] {
  const data = value as { version?: unknown; pages?: unknown } | null
  if (data?.version !== 1 || !Array.isArray(data.pages) || !data.pages.length)
    throw new Error('SVG page list is missing or empty. Run the SVG directory integration.')
  const names = data.pages as unknown[]
  if (
    names.some(
      (name) =>
        typeof name !== 'string' ||
        !/\.svg$/i.test(name) ||
        /[/\\]/.test(name) ||
        [...name].some((character) => character.charCodeAt(0) < 32),
    )
  )
    throw new Error('SVG page entries must be filenames within the registered directory.')
  if (new Set(names).size !== names.length) throw new Error('Duplicate SVG page filenames.')
  return (names as string[]).map((name) => new URL(encodeURIComponent(name), directory).href)
}

/** SVG is loaded as an image, never injected as executable HTML/SVG markup. */
export class SvgDocumentSession {
  readonly resolutionIndependent = true
  private abort = new AbortController()
  private pages: string[] = []
  private first?: RenderedPage

  async open(source: string) {
    const directory = new URL(source, document.baseURI)
    if (!['http:', 'https:'].includes(directory.protocol) || directory.search || directory.hash)
      throw new Error('svgDir must be an HTTP(S) directory URL without a query or fragment.')
    if (!directory.pathname.endsWith('/')) directory.pathname += '/'
    const response = await fetch(new URL(manifestName, directory), {
      signal: this.abort.signal,
      cache: 'no-cache',
    })
    if (!response.ok) throw new Error(`SVG page list: HTTP ${response.status}`)
    this.pages = parseSvgManifest(await response.json(), directory)
    this.first = await this.loadImage(this.pages[0]!, this.abort.signal)
    const image = this.first.element as HTMLImageElement
    return { pageCount: this.pages.length, aspectRatio: image.naturalWidth / image.naturalHeight }
  }

  async render(
    page: number,
    _width: number,
    _height: number,
    signal: AbortSignal,
  ): Promise<RenderedPage> {
    const combined = AbortSignal.any([signal, this.abort.signal])
    combined.throwIfAborted()
    if (this.first) {
      const first = this.first
      this.first = undefined
      if (page === 1) return first
      first.release()
    }
    const url = this.pages[page - 1]
    if (!url) throw new Error('SVG page is outside the document.')
    return this.loadImage(url, combined)
  }

  private loadImage(url: string, signal: AbortSignal): Promise<RenderedPage> {
    return new Promise((resolve, reject) => {
      signal.throwIfAborted()
      const image = new Image()
      image.alt = ''
      image.draggable = false
      image.decoding = 'async'
      const release = () => {
        image.remove()
        image.removeAttribute('src')
      }
      const cleanup = () => {
        image.onload = null
        image.onerror = null
        signal.removeEventListener('abort', cancel)
      }
      const fail = (error: unknown) => {
        cleanup()
        release()
        reject(error)
      }
      const cancel = () => fail(new DOMException('SVG load cancelled', 'AbortError'))
      signal.addEventListener('abort', cancel, { once: true })
      image.onerror = () => fail(new Error(`SVG image could not be loaded: ${url}`))
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) {
          fail(new Error('SVG needs a nonzero intrinsic size or viewBox.'))
          return
        }
        cleanup()
        resolve({ element: image, release })
      }
      image.src = url
    })
  }

  async destroy() {
    this.abort.abort()
    this.first?.release()
    this.first = undefined
    this.pages = []
  }
}
