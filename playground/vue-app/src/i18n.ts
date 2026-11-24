import { computed, ref, watch } from 'vue'

export type SiteLocale = 'ja' | 'en'
export const siteName = 'vue-leafbook'
export const locale = ref<SiteLocale>(
  new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ja',
)
const messages = {
  ja: {
    description: 'Vue 3向け、PDF・SVG対応のページめくりビューアー。',
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
    featuresHeading: '特徴',
    features: [
      {
        title: 'Workerの手動設定不要',
        description:
          'PDFの表示に必要なWorkerを自動で読み込みます。別ファイルの配置やCDNの設定は不要です。',
      },
      {
        title: 'SVGはフォルダーで指定',
        description:
          '用意したSVGのフォルダーを一度登録すると、ファイル名からページ順を自動で作成します。',
      },
      {
        title: 'Vue・Nuxtで利用可能',
        description:
          'Vue + Vite、Nuxt 4で動作確認済み。SSRでも使え、ブラウザーで資料の読み込みを開始します。',
      },
    ],
    usageLines: [
      'コンポーネントとCSSを読み込み、資料の場所を指定します。',
      'PDFのURL、または用意したSVGのフォルダーを指定します。',
    ],
    installCode: 'インストールコマンド',
    exampleCode: '使用コード',
    pdfLocation: 'この例では、アプリの public/pamphlet.pdf にPDFを置きます。',
    installNote: 'Vue 3.5以降のプロジェクトで実行してください。',
    packageSteps: 'npmで見る',
    author: '作者：',
    gettingStarted: '導入手順',
    svgDocs: 'SVGの設定・命名規則',
    nuxtDocs: 'Nuxtでの使い方',
    apiDocs: 'API・設定一覧',
    supportHeading: '対応範囲',
    supportItems: [
      {
        title: '動作環境',
        description:
          'Vue 3.5以降が必要です。現行のデスクトップ・モバイルブラウザー向けです。ブラウザーごとの検証範囲は下のリンクをご確認ください。',
      },
      {
        title: 'SVGの準備',
        description:
          '公開前に1ページ1ファイルのSVGを用意し、001.svg、002.svgのように並べて公開フォルダーに置きます。ViteプラグインまたはNuxtモジュールへの登録が必要です。PDFからSVGへ変換する機能は含みません。',
      },
      {
        title: '未対応の機能',
        description:
          '本文検索、目次の自動生成・表示、文字選択、注釈、パスワード入力は未対応です。ページ番号を指定して移動するAPIは利用できます。本文の読み上げが必要な場合は、HTML版などを併設してください。',
      },
    ],
    browserSupport: 'ブラウザーの検証範囲・制限',
    reportIssue: '不具合を報告',
    demoHeading: 'デモ',
    demoHint:
      'ドラッグやスワイプでページをめくれます。＋・−で拡大縮小し、倍率を押すと元の大きさに戻ります。',
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
    description: 'A page-turning PDF and SVG viewer for Vue 3.',
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
    featuresHeading: 'Features',
    features: [
      {
        title: 'No manual worker setup',
        description:
          'The PDF worker loads automatically. No separate worker file or CDN configuration is needed.',
      },
      {
        title: 'Load SVG pages from a folder',
        description:
          'Register a folder of prepared SVGs once. Page order is generated automatically from file names.',
      },
      {
        title: 'Works with Vue and Nuxt',
        description:
          'Verified with Vue + Vite and Nuxt 4. Supports SSR and starts loading documents in the browser.',
      },
    ],
    usageLines: [
      'Import the component and its CSS, then point it to your document.',
      'Provide a PDF URL or a folder of prepared SVG pages.',
    ],
    installCode: 'Install command',
    exampleCode: 'Usage example',
    pdfLocation: 'For this example, place your PDF at public/pamphlet.pdf in your app.',
    installNote: 'Run this command in a Vue 3.5+ project.',
    packageSteps: 'View on npm',
    author: 'By',
    gettingStarted: 'Get started',
    svgDocs: 'SVG setup & file naming',
    nuxtDocs: 'Using Nuxt',
    apiDocs: 'API & options',
    supportHeading: 'Compatibility & limits',
    supportItems: [
      {
        title: 'Requirements',
        description:
          'Requires Vue 3.5+. Designed for current desktop and mobile browsers. See the link below for browser test coverage.',
      },
      {
        title: 'Preparing SVG pages',
        description:
          'Prepare one SVG per page before deployment, name them 001.svg, 002.svg, and place them in a public folder. Register it with the Vite plugin or Nuxt module. PDF-to-SVG conversion is not included.',
      },
      {
        title: 'Not yet supported',
        description:
          'Full-text search, automatic table of contents or a contents panel, text selection, annotations and password input are not supported. An API for jumping to a page number is available. Provide an HTML alternative when screen-reader access to document text is needed.',
      },
    ],
    browserSupport: 'Browser test coverage & limitations',
    reportIssue: 'Report an issue',
    demoHeading: 'Demo',
    demoHint:
      'Drag or swipe to turn a page. Use + and − to zoom, and select the percentage to fit the pages to the viewer.',
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
