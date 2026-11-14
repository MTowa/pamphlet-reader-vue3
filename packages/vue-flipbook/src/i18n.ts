import type { FlipbookErrorCode } from './types'

const messages = {
  ja: {
    pdfViewer: 'PDFパンフレットビューアー',
    svgViewer: 'SVGパンフレットビューアー',
    retry: 'もう一度読み込む',
    pdfLoading: 'PDFを読み込んでいます…',
    svgLoading: 'SVGを読み込んでいます…',
    controls: 'ページ操作',
    previous: '前のページ',
    next: '次のページ',
    pageInput: '移動先のページ番号',
    jump: '指定ページへ移動',
    go: '移動',
    single: '単ページ',
    spread: '見開き',
    fullscreen: '全画面表示',
    exitFullscreen: '全画面表示を終了',
    pdfError: 'PDFを読み込めませんでした。ファイルとURL、配信元のアクセス設定を確認してください。',
    svgError:
      'SVGを読み込めませんでした。フォルダーのパスとページ一覧の生成設定を確認してください。',
    renderError: 'ページを描画できませんでした。もう一度読み込んでください。',
    fullscreenError: '全画面表示を開始できませんでした。',
    page: (format: string, page: number) => `${format} ${page}ページ`,
    range: (range: string, total: number) => `${range} / ${total}ページ`,
  },
  en: {
    pdfViewer: 'PDF pamphlet viewer',
    svgViewer: 'SVG pamphlet viewer',
    retry: 'Try again',
    pdfLoading: 'Loading PDF…',
    svgLoading: 'Loading SVG…',
    controls: 'Page controls',
    previous: 'Previous page',
    next: 'Next page',
    pageInput: 'Page number',
    jump: 'Go to page',
    go: 'Go',
    single: 'Single page',
    spread: 'Spread',
    fullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    pdfError: 'Could not load the PDF. Check the file, URL and server access settings.',
    svgError: 'Could not load the SVG pages. Check the folder path and page index configuration.',
    renderError: 'Could not render the page. Please try again.',
    fullscreenError: 'Could not enter fullscreen.',
    page: (format: string, page: number) => `${format} page ${page}`,
    range: (range: string, total: number) => `Pages ${range} of ${total}`,
  },
}

export function viewerMessages(locale: 'ja' | 'en' = 'ja') {
  return messages[locale]
}
export function viewerError(code: FlipbookErrorCode, svg: boolean, locale: 'ja' | 'en' = 'ja') {
  const text = viewerMessages(locale)
  if (code === 'load') return svg ? text.svgError : text.pdfError
  return code === 'fullscreen' ? text.fullscreenError : text.renderError
}
