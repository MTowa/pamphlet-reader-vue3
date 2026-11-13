<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { FlipbookViewer } from '@your-org/vue-flipbook'
import type {
  FlipbookReady,
  FlipbookPageChange,
  FlipbookViewerExpose,
  PdfSource,
} from '@your-org/vue-flipbook'
import '@your-org/vue-flipbook/style.css'

const base = import.meta.env.BASE_URL
const format = ref(
  new URLSearchParams(window.location.search).get('format') === 'svg' ? 'svg' : 'pdf',
)
const src = shallowRef<PdfSource>(base + 'sample.pdf')
const viewer = ref<FlipbookViewerExpose>()
const showCover = ref(true)
const showToolbar = ref(true)
const mounted = ref(true)
const metadata = ref<FlipbookReady>()
const page = ref<FlipbookPageChange>()
const state = ref('準備中')
const example = computed(() =>
  format.value === 'svg'
    ? '<FlipbookViewer\n  svg-dir="/pamphlet/"\n/>'
    : '<FlipbookViewer\n  src="/pamphlet.pdf"\n/>',
)
function onReady(value: FlipbookReady) {
  metadata.value = value
  state.value = '読み込み完了'
  performance.mark('flipbook-ready')
}
const filename = computed(() =>
  format.value === 'svg'
    ? 'pamphlet/ (SVG)'
    : typeof src.value === 'string'
      ? src.value.split('/').at(-1)
      : src.value.name,
)
function select(name: string) {
  format.value = 'pdf'
  src.value = base + name + '.pdf'
  metadata.value = undefined
  page.value = undefined
}
function selectSvg() {
  format.value = 'svg'
  metadata.value = undefined
  page.value = undefined
}
function chooseFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    format.value = 'pdf'
    src.value = file
    metadata.value = undefined
    page.value = undefined
  }
}
</script>

<template>
  <div class="demo">
    <header class="demo-header">
      <a class="brand" href="https://github.com/MTowa/pamphlet-reader-vue3"
        ><span class="brand-icon">▥</span> vue flipbook <span class="brand-tag">PLAYGROUND</span></a
      >
      <a class="repo-link" href="https://github.com/MTowa/pamphlet-reader-vue3">GitHub ↗</a>
    </header>
    <main>
      <div class="intro">
        <div>
          <p class="eyebrow">A PDF. A FEW PAGES. A NEW PERSPECTIVE.</p>
          <h1>読む時間に、紙の心地よさを。</h1>
          <p class="description">
            PDFもSVGも、めくれる一冊へ。ページをドラッグして、読み進めてみてください。
          </p>
        </div>
        <span class="framework-badge"><i /> Vue 3 + TypeScript</span>
      </div>
      <div class="workspace">
        <section class="reader-area" aria-label="デモビューアー">
          <div class="reader-heading">
            <span><span class="file-dot" /> {{ filename }}</span
            ><span class="status" data-testid="status">{{ state }}</span>
          </div>
          <FlipbookViewer
            v-if="mounted"
            ref="viewer"
            :src="format === 'pdf' ? src : undefined"
            :svg-dir="format === 'svg' ? base + 'pamphlet/' : undefined"
            :show-cover="showCover"
            :show-toolbar="showToolbar"
            height="min(740px, 78svh)"
            @ready="onReady"
            @page-change="page = $event"
            @loading="state = $event.loading ? '読み込み中' : '読み込み完了'"
            @error="state = 'エラー'"
          />
          <div v-else class="unmounted-message">ビューアーを取り外しました。</div>
          <div class="reader-footer">
            <span>↔ ドラッグ・スワイプでページめくり</span
            ><span>フォーカスして ← → キーでも操作できます</span>
          </div>
        </section>
        <aside class="sidebar">
          <section>
            <p class="panel-number">01 / DOCUMENT</p>
            <h2>資料を選ぶ</h2>
            <p>PDFとSVGのサンプル、またはお手元のPDFで試せます。</p>
            <button
              class="sample-choice"
              :class="{ selected: filename === 'sample.pdf' }"
              @click="select('sample')"
            >
              <span>▤</span
              ><span><strong>Fieldnotes</strong><small>オリジナルサンプル · 6ページ</small></span
              ><span>↗</span>
            </button>
            <button
              class="sample-choice"
              :class="{ selected: format === 'svg' }"
              @click="selectSvg"
            >
              <span>▤</span
              ><span><strong>SVGフォルダー</strong><small>Fieldnotes · 6ページ</small></span
              ><span>↗</span>
            </button>
            <label class="file-label"
              >＋ PDFを開く<input
                type="file"
                accept="application/pdf,.pdf"
                aria-label="PDFファイルを選択"
                @change="chooseFile"
            /></label>
            <span class="privacy-note">選んだファイルはブラウザー内で処理されます。</span>
            <details class="input-guide">
              <summary>ファイル名・ページ順のルール</summary>
              <p>PDFの名前は自由です。PDF内のページ順で表示します。</p>
              <p>
                SVGは1ファイルが1ページです。表紙から
                <code>001.svg</code>、<code>002.svg</code>、<code>003.svg</code>
                と名前を付ける方法を推奨します。
              </p>
              <ul>
                <li>数字を考慮してファイル名順に並べます。1 → 2 → 10の順です。</li>
                <li>番号が飛んでも空白ページは作りません。画面のページ番号は1から順に付けます。</li>
                <li>
                  表紙・裏表紙という名前は自動判定しません。連番の先頭と末尾に配置してください。
                </li>
                <li>登録先の直下にあるSVGがすべて対象です。サブフォルダー内は読み込みません。</li>
              </ul>
              <p>
                手元のSVGは <code>playground/vue-app/public/pamphlet/</code>
                に配置して試せます。元のサンプルは別のフォルダーへ退避してください。
              </p>
              <p>「SVGフォルダー」は、この登録済みフォルダーを表示するボタンです。</p>
            </details>
          </section>
          <section>
            <p class="panel-number">02 / PREFERENCES</p>
            <h2>表示設定</h2>
            <label class="setting"
              >表紙を単独で表示<input v-model="showCover" type="checkbox"
            /></label>
            <label class="setting"
              >操作バーを表示<input v-model="showToolbar" type="checkbox"
            /></label>
          </section>
          <section class="integration">
            <p class="panel-number">03 / INTEGRATION</p>
            <h2>{{ format === 'svg' ? 'フォルダーを指定。' : 'PDFを指定するだけ。' }}</h2>
            <pre><code>{{ example }}</code></pre>
            <p>
              {{
                format === 'svg'
                  ? '初回にフォルダーを登録すれば、ページ一覧を自動生成します。'
                  : '画像への事前変換も、Workerの設定も不要です。'
              }}
            </p>
          </section>
          <details class="diagnostics">
            <summary>検証用コントロール</summary>
            <div class="test-actions">
              <button @click="select('alternate')">別のPDF（3ページ）</button
              ><button @click="select('long')">長いPDF（80ページ）</button
              ><button @click="select('single')">1ページPDF</button
              ><button @click="select('missing')">存在しないPDF</button
              ><button @click="mounted = !mounted">{{ mounted ? '取り外す' : '再マウント' }}</button
              ><button @click="viewer?.reload()">再読み込み</button
              ><button @click="viewer?.goToPage(5)">APIで5ページへ</button>
            </div>
            <output data-testid="metadata">{{
              metadata ? metadata.pageCount + ' pages' : '—'
            }}</output
            ><output data-testid="page-event">{{
              page ? page.page + ':' + page.visiblePages.join(',') + ':' + page.mode : '—'
            }}</output>
          </details>
        </aside>
      </div>
    </main>
    <footer class="demo-footer">
      <span>VUE FLIPBOOK <span class="muted">/ OPEN SOURCE · MIT LICENSE</span></span
      ><span>PDF.js × StPageFlip</span>
    </footer>
  </div>
</template>
