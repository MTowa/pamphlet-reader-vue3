export interface RenderedPage {
  element: HTMLElement
  release(): void
}

export interface PageRenderer {
  /** Vector pages do not need a fresh resource when the container grows. */
  readonly resolutionIndependent?: boolean
  render(page: number, width: number, height: number, signal: AbortSignal): Promise<RenderedPage>
}
