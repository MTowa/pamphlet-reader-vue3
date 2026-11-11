import type { FlipbookViewMode } from '../types'

/** The only module contract a replacement flip engine needs to implement. */
export interface FlipEngine {
  next(): void
  previous(): void
  goTo(page: number): void
  destroy(): void
}

export interface FlipEngineOptions {
  host: HTMLElement
  pages: HTMLElement[]
  pageWidth: number
  pageHeight: number
  mode: FlipbookViewMode
  showCover: boolean
  startPage: number
  duration: number
  onPageChange(page: number): void
  onStateChange(busy: boolean): void
}
