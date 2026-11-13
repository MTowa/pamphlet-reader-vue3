export type PdfSource = string | File
export type FlipbookViewMode = 'single' | 'spread'

export interface FlipbookViewerProps {
  src: PdfSource
  showToolbar?: boolean
  showCover?: boolean
  startPage?: number
  flipDuration?: number
  width?: number | string
  height?: number | string
  mobileBreakpoint?: number
  keyboardNavigation?: boolean
  showFullscreen?: boolean
}

export interface FlipbookPageChange {
  /** All public page numbers are one-based. In a spread, page is its first page. */
  page: number
  pageCount: number
  visiblePages: number[]
  mode: FlipbookViewMode
}

export interface FlipbookReady extends FlipbookPageChange {
  /** Width divided by height of the first PDF page. */
  aspectRatio: number
}

export interface FlipbookLoading {
  loading: boolean
  loaded: number
  /** null means the server did not provide Content-Length. */
  total: number | null
}

export type FlipbookErrorCode = 'load' | 'render' | 'fullscreen'

export class FlipbookError extends Error {
  readonly code: FlipbookErrorCode
  constructor(code: FlipbookErrorCode, message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'FlipbookError'
    this.code = code
  }
}

export interface FlipbookViewerEmits {
  ready: [payload: FlipbookReady]
  'page-change': [payload: FlipbookPageChange]
  loading: [payload: FlipbookLoading]
  error: [error: FlipbookError]
}

export interface FlipbookViewerExpose {
  nextPage(): void
  prevPage(): void
  goToPage(page: number): void
  reload(): Promise<void>
}
