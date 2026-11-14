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
import { locale, ui } from '../i18n'

const base = import.meta.env.BASE_URL
const testing = new URLSearchParams(window.location.search).get('testing') === 'true'
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
const state = ref<'preparing' | 'loading' | 'ready' | 'error'>('preparing')
function onReady(value: FlipbookReady) {
  metadata.value = value
  state.value = 'ready'
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
  <div class="reader-demo">
    <div class="source-controls" role="group" :aria-label="ui.sources">
      <button
        class="source-button"
        :aria-pressed="format === 'pdf' && filename === 'sample.pdf'"
        @click="select('sample')"
      >
        {{ ui.samplePdf }}
      </button>
      <button class="source-button" :aria-pressed="format === 'svg'" @click="selectSvg">
        {{ ui.svgFolder }}
      </button>
      <label class="file-label">
        {{ ui.openPdf }}
        <input
          type="file"
          accept="application/pdf,.pdf"
          :aria-label="ui.choosePdf"
          @change="chooseFile"
        />
      </label>
    </div>
    <p class="privacy-note">{{ ui.privacy }}</p>
    <section class="reader-area" :aria-label="ui.demoViewer">
      <div class="reader-heading">
        <span class="filename">{{ filename }}</span>
        <span data-testid="status">{{ ui.states[state] }}</span>
      </div>
      <FlipbookViewer
        v-if="mounted"
        ref="viewer"
        :locale="locale"
        :src="format === 'pdf' ? src : undefined"
        :svg-dir="format === 'svg' ? base + 'pamphlet/' : undefined"
        :show-cover="showCover"
        :show-toolbar="showToolbar"
        height="min(740px, 78svh)"
        @ready="onReady"
        @page-change="page = $event"
        @loading="state = $event.loading ? 'loading' : 'ready'"
        @error="state = 'error'"
      />
      <div v-else class="unmounted-message">{{ ui.unmounted }}</div>
    </section>
    <div class="demo-options">
      <details class="display-settings" :open="testing">
        <summary>{{ ui.settings }}</summary>
        <label class="setting"
          >{{ ui.showCover }}<input v-model="showCover" type="checkbox"
        /></label>
        <label class="setting"
          >{{ ui.showToolbar }}<input v-model="showToolbar" type="checkbox"
        /></label>
      </details>
      <details class="input-guide">
        <summary>{{ ui.rules }}</summary>
        <p>{{ ui.pdfRule }}</p>
        <p>{{ ui.svgRule }}</p>
        <ul>
          <li v-for="rule in ui.ruleItems" :key="rule">{{ rule }}</li>
        </ul>
        <p>
          {{ ui.localSvgBefore }} <code>playground/vue-app/public/pamphlet/</code>
          {{ ui.localSvgAfter }}
        </p>
        <p>{{ ui.svgFolderNote }}</p>
      </details>
    </div>
    <details v-if="testing" class="diagnostics">
      <summary>{{ ui.diagnostics }}</summary>
      <div class="test-actions">
        <button @click="select('alternate')">{{ ui.alternatePdf }}</button>
        <button @click="select('long')">{{ ui.longPdf }}</button>
        <button @click="select('single')">{{ ui.singlePdf }}</button>
        <button @click="select('missing')">{{ ui.missingPdf }}</button>
        <button @click="mounted = !mounted">{{ mounted ? ui.unmount : ui.remount }}</button>
        <button @click="viewer?.reload()">{{ ui.reload }}</button>
        <button @click="viewer?.goToPage(5)">{{ ui.jumpFive }}</button>
      </div>
      <output data-testid="metadata">{{ metadata ? metadata.pageCount + ' pages' : '—' }}</output>
      <output data-testid="page-event">{{
        page ? page.page + ':' + page.visiblePages.join(',') + ':' + page.mode : '—'
      }}</output>
    </details>
  </div>
</template>
