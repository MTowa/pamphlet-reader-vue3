import type { FlipbookViewMode } from '../types'

export function clampPage(page: number, count: number): number {
  return Math.min(Math.max(1, Math.floor(Number.isFinite(page) ? page : 1)), Math.max(1, count))
}

export function visiblePages(
  page: number,
  count: number,
  mode: FlipbookViewMode,
  cover: boolean,
): number[] {
  const current = clampPage(page, count)
  if (mode === 'single' || (cover && current === 1)) return [current]
  const first = cover ? current - (current % 2) : current - ((current - 1) % 2)
  return [first, first + 1].filter((value) => value >= 1 && value <= count)
}

/** Visible pages first, then two pages either side. At most six canvases. */
export function renderWindow(pages: number[], count: number): number[] {
  if (!pages.length) return []
  const first = pages[0]!
  const last = pages[pages.length - 1]!
  return [...new Set([...pages, last + 1, first - 1, last + 2, first - 2])].filter(
    (page) => page >= 1 && page <= count,
  )
}

export function cssSize(value: string | number): string {
  return typeof value === 'number' ? `${Math.max(1, value)}px` : value
}
