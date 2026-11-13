declare module 'page-flip' {
  export class PageFlip {
    constructor(host: HTMLElement, settings: Record<string, string | number | boolean>)
    on(event: 'flip', callback: (event: { data: number }) => void): this
    on(event: 'changeState', callback: (event: { data: string }) => void): this
    off(event: string): void
    loadFromHTML(pages: HTMLElement[]): void
    flipNext(): void
    flipPrev(): void
    turnToPage(page: number): void
    destroy(): void
  }
}
