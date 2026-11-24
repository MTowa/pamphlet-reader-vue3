<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFlipbook } from '../composables/useFlipbook'
import { cssSize } from '../utils/pages'
import { viewerMessages, viewerError } from '../i18n'
import type { FlipbookViewerEmits, FlipbookViewerExpose, FlipbookViewerProps } from '../types'

const props = withDefaults(defineProps<FlipbookViewerProps>(), {
  locale: 'ja',
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
  zoom,
  zoomed,
  canZoomIn,
  canZoomOut,
  changeZoom,
  resetZoom,
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
const text = computed(() => viewerMessages(props.locale))
const failureMessage = computed(() =>
  failure.value ? viewerError(failure.value.code, !!props.svgDir, props.locale) : '',
)
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
    :lang="locale"
    :style="{ width: cssSize(width), height: cssSize(height) }"
    :data-mode="mode"
    :aria-busy="loading"
    :aria-label="svgDir ? text.svgViewer : text.pdfViewer"
    :data-source="svgDir ? 'svg' : 'pdf'"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="vfb__viewport">
      <div
        ref="stage"
        class="vfb__stage"
        :class="{ 'vfb__stage--zoomed': zoomed }"
        :tabindex="zoomed && !failure ? 0 : undefined"
        :role="zoomed ? 'region' : undefined"
        :aria-label="zoomed ? text.zoomedPage : undefined"
        :aria-hidden="loading || !!failure"
      />
      <div v-if="failure" class="vfb__message" role="alert">
        <span class="vfb__message-icon" aria-hidden="true">!</span>
        <p>{{ failureMessage }}</p>
        <button type="button" class="vfb__retry" @click="reload">{{ text.retry }}</button>
      </div>
      <div v-else-if="loading" class="vfb__message" role="status">
        <span class="vfb__spinner" aria-hidden="true" />
        <p>{{ svgDir ? text.svgLoading : text.pdfLoading }}</p>
      </div>
    </div>
    <div v-if="showToolbar" class="vfb__toolbar" role="group" :aria-label="text.controls">
      <div class="vfb__control-group">
        <button
          type="button"
          class="vfb__button"
          :aria-label="text.previous"
          :title="text.previous"
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
            :aria-label="text.pageInput"
          />
          <span class="vfb__total">/ {{ pageCount || '—' }}</span>
          <button
            class="vfb__jump-button"
            type="submit"
            :disabled="loading || !!failure"
            :aria-label="text.jump"
          >
            {{ text.go }}
          </button>
        </form>
        <button
          type="button"
          class="vfb__button"
          :aria-label="text.next"
          :title="text.next"
          :disabled="!canNext || !!failure"
          @click="nextPage"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
        </button>
      </div>
      <div class="vfb__control-group">
        <button
          class="vfb__button"
          type="button"
          :aria-label="text.zoomOut"
          :title="text.zoomOut"
          :disabled="!canZoomOut"
          @click="changeZoom(-1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <button
          class="vfb__button vfb__zoom-reset"
          type="button"
          :aria-label="text.resetZoom(zoom)"
          :title="text.fitPage"
          :disabled="loading || !!failure"
          @click="resetZoom"
        >
          {{ zoom }}%
        </button>
        <button
          class="vfb__button"
          type="button"
          :aria-label="text.zoomIn"
          :title="text.zoomIn"
          :disabled="!canZoomIn"
          @click="changeZoom(1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
        </button>
        <button
          v-if="showFullscreen && fullscreenSupported"
          class="vfb__button"
          type="button"
          :aria-label="fullscreen ? text.exitFullscreen : text.fullscreen"
          :title="fullscreen ? text.exitFullscreen : text.fullscreen"
          @click="toggleFullscreen"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
          </svg>
        </button>
      </div>
      <span class="vfb__sr-only" role="status">{{ text.zoomLevel(zoom) }}</span>
    </div>
    <span class="vfb__sr-only" aria-live="polite" aria-atomic="true">{{
      pageCount && !loading ? text.range(range, pageCount) : ''
    }}</span>
  </section>
</template>
