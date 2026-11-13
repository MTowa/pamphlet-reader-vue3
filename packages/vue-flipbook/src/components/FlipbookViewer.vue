<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFlipbook } from '../composables/useFlipbook'
import { cssSize } from '../utils/pages'
import type { FlipbookViewerEmits, FlipbookViewerExpose, FlipbookViewerProps } from '../types'

const props = withDefaults(defineProps<FlipbookViewerProps>(), {
  showToolbar: true,
  showCover: true,
  startPage: 1,
  flipDuration: 550,
  width: '100%',
  height: 'min(720px, 82svh)',
  mobileBreakpoint: 640,
  keyboardNavigation: true,
  showFullscreen: true,
})
const emit = defineEmits<FlipbookViewerEmits>()
const {
  root,
  stage,
  loading,
  failure,
  pageCount,
  currentPage,
  mode,
  shownPages,
  canNext,
  canPrevious,
  fullscreen,
  fullscreenSupported,
  nextPage,
  prevPage,
  goToPage,
  reload,
  onKeydown,
  toggleFullscreen,
} = useFlipbook(props, {
  ready: (payload) => emit('ready', payload),
  change: (payload) => emit('page-change', payload),
  loading: (payload) => emit('loading', payload),
  error: (error) => emit('error', error),
})
const jumpPage = ref(1)
watch(currentPage, (page) => {
  jumpPage.value = page
})
const range = computed(() => shownPages.value.join('–'))
function submitJump() {
  goToPage(Number(jumpPage.value))
  jumpPage.value = currentPage.value
}
defineExpose<FlipbookViewerExpose>({ nextPage, prevPage, goToPage, reload })
</script>

<template>
  <section
    ref="root"
    class="vfb"
    :style="{ width: cssSize(width), height: cssSize(height) }"
    :data-mode="mode"
    :aria-busy="loading"
    aria-label="PDFパンフレットビューアー"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="vfb__viewport">
      <div ref="stage" class="vfb__stage" :aria-hidden="loading || !!failure" />
      <div v-if="failure" class="vfb__message" role="alert">
        <span class="vfb__message-icon" aria-hidden="true">!</span>
        <p>{{ failure.message }}</p>
        <button type="button" class="vfb__retry" @click="reload">もう一度読み込む</button>
      </div>
      <div v-else-if="loading" class="vfb__message" role="status">
        <span class="vfb__spinner" aria-hidden="true" />
        <p>PDFを読み込んでいます…</p>
      </div>
    </div>
    <div v-if="showToolbar" class="vfb__toolbar" role="group" aria-label="ページ操作">
      <button
        type="button"
        class="vfb__button"
        aria-label="前のページ"
        title="前のページ"
        :disabled="!canPrevious || !!failure"
        @click="prevPage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
      </button>
      <form class="vfb__jump" @submit.prevent="submitJump">
        <input
          v-model="jumpPage"
          type="number"
          min="1"
          :max="pageCount || 1"
          :disabled="loading || !!failure"
          aria-label="移動先のページ番号"
        />
        <span class="vfb__total">/ {{ pageCount || '—' }}</span>
        <button
          class="vfb__jump-button"
          type="submit"
          :disabled="loading || !!failure"
          aria-label="指定ページへ移動"
        >
          移動
        </button>
      </form>
      <button
        type="button"
        class="vfb__button"
        aria-label="次のページ"
        title="次のページ"
        :disabled="!canNext || !!failure"
        @click="nextPage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
      </button>
      <span class="vfb__divider" aria-hidden="true" />
      <span class="vfb__mode">{{ mode === 'single' ? '単ページ' : '見開き' }}</span>
      <button
        v-if="showFullscreen && fullscreenSupported"
        class="vfb__button"
        type="button"
        :aria-label="fullscreen ? '全画面表示を終了' : '全画面表示'"
        :title="fullscreen ? '全画面表示を終了' : '全画面表示'"
        @click="toggleFullscreen"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
        </svg>
      </button>
    </div>
    <span class="vfb__sr-only" aria-live="polite" aria-atomic="true">{{
      pageCount && !loading ? `${range} / ${pageCount}ページ` : ''
    }}</span>
  </section>
</template>
