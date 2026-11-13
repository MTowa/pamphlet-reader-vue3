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
const src = shallowRef<PdfSource>(base + 'sample.pdf')
const viewer = ref<FlipbookViewerExpose>()
const showCover = ref(true)
const showToolbar = ref(true)
const mounted = ref(true)
const metadata = ref<FlipbookReady>()
const page = ref<FlipbookPageChange>()
const state = ref('準備中')
const filename = computed(() =>
  typeof src.value === 'string' ? src.value.split('/').at(-1) : src.value.name,
)
function select(name: string) {
  src.value = base + name + '.pdf'
  metadata.value = undefined
  page.value = undefined
}
function chooseFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
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
            PDFをそのまま、めくれる一冊へ。ページをドラッグして、読み進めてみてください。
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
            :src="src"
            :show-cover="showCover"
            :show-toolbar="showToolbar"
            height="min(740px, 78svh)"
            @ready="
              (value) => {
                metadata = value
                state = '読み込み完了'
              }
            "
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
            <h2>PDFを選ぶ</h2>
            <p>サンプル、またはお手元のPDFで試せます。</p>
            <button
              class="sample-choice"
              :class="{ selected: filename === 'sample.pdf' }"
              @click="select('sample')"
            >
              <span>▤</span
              ><span><strong>Fieldnotes</strong><small>オリジナルサンプル · 6ページ</small></span
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
            <h2>PDFを指定するだけ。</h2>
            <pre><code>&lt;FlipbookViewer
  src="/pamphlet.pdf"
/&gt;</code></pre>
            <p>画像への事前変換も、Workerの設定も不要です。</p>
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
