# API reference / APIリファレンス

Import the component and its CSS explicitly. All public page numbers are **one-based**.

## Props

| Prop               | Type             | Default             | Behavior / 内容                                                              |
| ------------------ | ---------------- | ------------------- | ---------------------------------------------------------------------------- |
| src                | string or File   | required            | PDFのURLまたはFile。変更すると旧PDFを破棄して読み直す。                      |
| showToolbar        | boolean          | true                | 操作バーの表示。非表示でも公開メソッドとキーボードは使用可能。               |
| showCover          | boolean          | true                | 最初のページを単独表示。末尾に相手ページがない場合も単独表示。               |
| startPage          | number           | 1                   | 読み込み開始時のページ。読み込み後の変更はgoToPageと同等。                   |
| flipDuration       | number           | 550                 | アニメーション時間（ms）。エンジンの最小値は100ms。                          |
| width              | number or string | '100%'              | 全体幅。数値はpx、文字列はCSSの長さ。                                        |
| height             | number or string | 'min(720px, 82svh)' | 操作バーを含む全体高さ。数値はpx。最小高さ240px。                            |
| mobileBreakpoint   | number           | 640                 | コンテナーの幅がこのpx値未満なら単ページ。ウィンドウ全体の幅ではない。       |
| keyboardNavigation | boolean          | true                | ビューアー自身にフォーカス中のキー操作。入力やボタン上のキー操作を奪わない。 |
| showFullscreen     | boolean          | true                | Fullscreen API対応環境でボタンを表示。                                       |

Page dimensions follow the first PDF page. Pages with a different aspect ratio fit inside the same paper area without stretching or cropping.

見開きでは「指定ページを含む見開き」へ移動し、その見開きの先頭ページを現在ページとして通知します。表紙ありで5を指定すると、4–5ページを表示し、pageは4になります。これはページ番号のずれではなく、見開きの表現です。

## Events

| Event       | Payload            | Timing                                                                     |
| ----------- | ------------------ | -------------------------------------------------------------------------- |
| ready       | FlipbookReady      | 最初の可視ページすべてをCanvasに描画した時。PDFの読み直しごとに1回。       |
| page-change | FlipbookPageChange | 表示ページ・見開きが変化した時。初期配置とリサイズによる再配置時にも発火。 |
| loading     | FlipbookLoading    | 読み込み開始、取得進捗、完了・失敗時。                                     |
| error       | FlipbookError      | 読み込み・描画・全画面切替の失敗。                                         |

```ts
interface FlipbookPageChange {
  page: number
  pageCount: number
  visiblePages: number[]
  mode: 'single' | 'spread'
}
interface FlipbookReady extends FlipbookPageChange {
  aspectRatio: number // first-page width / height
}
interface FlipbookLoading {
  loading: boolean
  loaded: number // bytes reported by PDF.js
  total: number | null
}
// FlipbookError extends Error:
// code: 'load' | 'render' | 'fullscreen', message: string, cause?: unknown
```

The final loading=false event resets byte counters; it signals readiness, not a separate download measurement. A fullscreen error is nonfatal and does not close the document. Loading/rendering errors display a retry UI.

## Exposed methods

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FlipbookViewer } from '@your-org/vue-flipbook'
import type { FlipbookViewerExpose } from '@your-org/vue-flipbook'
import '@your-org/vue-flipbook/style.css'

const viewer = ref<FlipbookViewerExpose>()
</script>
<template>
  <FlipbookViewer ref="viewer" src="/pamphlet.pdf" />
  <button @click="viewer?.goToPage(5)">5ページを開く</button>
</template>
```

- nextPage(): next spread on desktop, next page in single-page mode.
- prevPage(): previous spread/page.
- goToPage(page): immediately displays the requested page or containing spread. Out-of-range numbers are clamped; nonfinite numbers become1; fractions are rounded down.
- reload(): Promise<void>; reloads the current source. Resolves after loading and layout setup; listen for ready to know that visible canvases have finished rendering. Errors are emitted and shown instead of rejecting this promise.

Navigation before readiness or during an active flip is ignored. Repeated calls do not queue animations.

## Keyboard / キーボード

Focus the viewer with Tab or programmatically.

- ArrowRight / PageDown: next.
- ArrowLeft / PageUp: previous.
- Home / End: first / last.
- Form fields, buttons, links, editable regions, and modified shortcuts retain native behavior.

The controls are labeled and keyboard accessible. Canvas content has a page label but no PDF text layer. Provide an original PDF link or HTML alternative for access to the document's full text.

## Local files

```ts
import { shallowRef } from 'vue'
import type { PdfSource } from '@your-org/vue-flipbook'

const src = shallowRef<PdfSource>('/pamphlet.pdf')
function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) src.value = file
}
```

The File stays in the browser. No upload or temporary object URL is needed.

## Theme / CSSカスタムプロパティ

Override properties on the viewer element or a parent:

```css
.my-reader {
  --vfb-background: #eae9e4;
  --vfb-toolbar-background: #fffefa;
  --vfb-button-color: #303c38;
  --vfb-accent: #316451;
  --vfb-text: #303c38;
  --vfb-muted: #717770;
  --vfb-shadow: 0 12px 32px #1f342326;
  --vfb-radius: 16px;
}
```

Library selectors use the vfb prefix; the internal StPageFlip elements use its stf prefix. No global reset or Tailwind dependency is included.
