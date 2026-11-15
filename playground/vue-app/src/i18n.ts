import { computed, ref, watch } from 'vue'

export type SiteLocale = 'ja' | 'en'
export const siteName = 'vue-leafbook'
export const locale = ref<SiteLocale>(
  new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ja',
)
const messages = {
  ja: {
    description: 'Vue 3向けのPDF・SVGビューアー。',
    navigation: 'ページ内ナビゲーション',
    github: 'GitHubでソースコードを見る',
    language: 'Switch to English',
    languageButton: 'English',
    usage: '使い方',
    demo: 'デモ',
    tryDemo: 'デモを試す',
    copy: 'コピー',
    copied: 'コピーしました',
    copyFailed: '自動コピーできませんでした。コードを選択してコピーしてください。',
    pause: '背景の動きを止める',
    resume: '背景の動きを再開',
    usageLines: [
      'コンポーネントとCSSを読み込み、資料の場所を指定します。',
      'PDFのURL、または用意したSVGのフォルダーを指定します。',
      '画面の幅に合わせて、見開き・単ページ表示を切り替えます。',
    ],
    installCode: 'インストールコマンド',
    exampleCode: '使用コード',
    installNote: 'Vue 3.5以降のプロジェクトで実行してください。',
    packageSteps: 'npmで見る',
    author: '作者：',
    gettingStarted: '導入手順',
    svgDocs: 'SVGの設定・命名規則',
    demoHeading: 'デモ',
    demoHint: 'ページをドラッグ、またはスワイプしてめくれます。',
    thirdParty: '第三者ライセンス',
    sources: 'デモの資料',
    samplePdf: 'サンプルPDF',
    svgFolder: 'SVGフォルダー',
    openPdf: '手元のPDFを開く',
    choosePdf: 'PDFファイルを選択',
    privacy: '選んだPDFはブラウザー内で処理されます。',
    demoViewer: 'デモビューアー',
    unmounted: 'ビューアーを取り外しました。',
    settings: '表示設定',
    showCover: '表紙を単独で表示',
    showToolbar: '操作バーを表示',
    rules: 'ファイル名・ページ順のルール',
    pdfRule: 'PDFの名前は自由です。PDF内のページ順で表示します。',
    svgRule:
      'SVGは1ファイルが1ページです。表紙から001.svg、002.svg、003.svgと名前を付ける方法を推奨します。',
    ruleItems: [
      '数字を考慮してファイル名順に並べます。1 → 2 → 10の順です。',
      '番号が飛んでも空白ページは作りません。画面のページ番号は1から順に付けます。',
      '表紙・裏表紙という名前は自動判定しません。連番の先頭と末尾に配置してください。',
      '登録先の直下にあるSVGがすべて対象です。サブフォルダー内は読み込みません。',
    ],
    localSvgBefore: '手元のSVGは、このサイトをローカルで起動し、',
    localSvgAfter: 'に配置して試せます。元のサンプルは別のフォルダーへ退避してください。',
    svgFolderNote: '「SVGフォルダー」は、この登録済みフォルダーを表示するボタンです。',
    diagnostics: '検証用コントロール',
    alternatePdf: '別のPDF（3ページ）',
    longPdf: '長いPDF（80ページ）',
    singlePdf: '1ページPDF',
    missingPdf: '存在しないPDF',
    unmount: '取り外す',
    remount: '再マウント',
    reload: '再読み込み',
    jumpFive: 'APIで5ページへ',
    states: { preparing: '準備中', loading: '読み込み中', ready: '読み込み完了', error: 'エラー' },
  },
  en: {
    description: 'A PDF and SVG viewer for Vue 3.',
    navigation: 'Page navigation',
    github: 'View source on GitHub',
    language: '日本語に切り替える',
    languageButton: '日本語',
    usage: 'How to use',
    demo: 'Demo',
    tryDemo: 'Try the demo',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Automatic copying failed. Select the code and copy it manually.',
    pause: 'Pause background motion',
    resume: 'Resume background motion',
    usageLines: [
      'Import the component and its CSS, then point it to your document.',
      'Provide a PDF URL or a folder of prepared SVG pages.',
      'The viewer switches between spreads and single pages to fit its width.',
    ],
    installCode: 'Install command',
    exampleCode: 'Usage example',
    installNote: 'Run this command in a Vue 3.5+ project.',
    packageSteps: 'View on npm',
    author: 'By',
    gettingStarted: 'Get started',
    svgDocs: 'SVG setup & file naming',
    demoHeading: 'Demo',
    demoHint: 'Drag or swipe a page to turn it.',
    thirdParty: 'Third-party licenses',
    sources: 'Demo documents',
    samplePdf: 'Sample PDF',
    svgFolder: 'SVG folder',
    openPdf: 'Open your PDF',
    choosePdf: 'Choose a PDF file',
    privacy: 'Your PDF is processed in your browser.',
    demoViewer: 'Demo viewer',
    unmounted: 'The viewer has been unmounted.',
    settings: 'Display settings',
    showCover: 'Show the cover on its own',
    showToolbar: 'Show the toolbar',
    rules: 'File names & page order',
    pdfRule: 'PDF files can have any name. Pages follow their order in the PDF.',
    svgRule:
      'Each SVG file is one page. We recommend naming them 001.svg, 002.svg, 003.svg, starting with the cover.',
    ruleItems: [
      'Files are sorted by name, taking numbers into account: 1 → 2 → 10.',
      'Gaps in file numbers do not create blank pages. Displayed page numbers start at 1.',
      'Cover and back-cover names are not detected automatically. Put them first and last in the sequence.',
      'All SVG files directly inside the registered folder are included. Subfolders are not read.',
    ],
    localSvgBefore: 'To try your own SVGs, run this site locally and place them in',
    localSvgAfter: 'Move the original samples to a separate folder first.',
    svgFolderNote: 'The “SVG folder” button opens this registered folder.',
    diagnostics: 'Test controls',
    alternatePdf: 'Another PDF (3 pages)',
    longPdf: 'Long PDF (80 pages)',
    singlePdf: 'Single-page PDF',
    missingPdf: 'Missing PDF',
    unmount: 'Unmount',
    remount: 'Remount',
    reload: 'Reload',
    jumpFive: 'Go to page 5 via API',
    states: { preparing: 'Preparing', loading: 'Loading', ready: 'Ready', error: 'Error' },
  },
}
export const ui = computed(() => messages[locale.value])

watch(
  locale,
  () => {
    document.documentElement.lang = locale.value
    document.title = siteName
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', ui.value.description)
  },
  { immediate: true },
)

export function toggleLocale() {
  locale.value = locale.value === 'ja' ? 'en' : 'ja'
  const url = new URL(window.location.href)
  if (locale.value === 'en') url.searchParams.set('lang', 'en')
  else url.searchParams.delete('lang')
  window.history.replaceState(null, '', url)
}

export function usageCode(language: SiteLocale) {
  return `<script setup>
import { FlipbookViewer } from 'vue-leafbook'
import 'vue-leafbook/style.css'
</script>

<template>
  <FlipbookViewer src="/pamphlet.pdf"${language === 'en' ? ' locale="en"' : ''} />
</template>`
}
