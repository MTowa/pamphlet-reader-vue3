<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import codeFrame from '../assets/code-frame.svg'
import codeSurface from '../assets/code-surface.svg'
import { ui } from '../i18n'

const props = withDefaults(
  defineProps<{ code: string; label: string; appearance?: 'hero' | 'plain' }>(),
  { appearance: 'hero' },
)
const codePanel = ref<HTMLElement>()
const codeText = ref<HTMLElement>()
const artworkScale = ref(1)
const copyStatus = ref<'' | 'copied' | 'copyFailed'>('')
let observer: ResizeObserver | undefined
let resetTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  // Keep the Figma artwork at its original dimensions and scale its wrapper.
  observer = new ResizeObserver(([entry]) => {
    if (entry) artworkScale.value = entry.contentRect.width / 800
  })
  if (codePanel.value && props.appearance === 'hero') observer.observe(codePanel.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(resetTimer)
})

async function copyCode() {
  clearTimeout(resetTimer)
  try {
    await navigator.clipboard.writeText(props.code)
    copyStatus.value = 'copied'
  } catch {
    // The visible example can still be copied when clipboard permission is denied.
    const selection = window.getSelection()
    if (codeText.value && selection) {
      const range = document.createRange()
      range.selectNodeContents(codeText.value)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    copyStatus.value = 'copyFailed'
  }
  resetTimer = setTimeout(() => (copyStatus.value = ''), 5000)
}
</script>

<template>
  <div
    class="code-example"
    :class="{ 'code-example-plain': appearance === 'plain' }"
    role="group"
    :aria-label="label"
  >
    <div ref="codePanel" class="code-panel">
      <div
        v-if="appearance === 'hero'"
        class="code-artwork"
        :style="{ transform: 'scaleX(' + artworkScale + ')' }"
        aria-hidden="true"
      >
        <img :src="codeFrame" alt="" width="800" height="150" />
        <img class="code-surface" :src="codeSurface" alt="" width="750" height="85" />
      </div>
      <button class="copy-button" type="button" @click="copyCode">{{ ui.copy }}</button>
      <pre><code ref="codeText">{{ code }}</code></pre>
    </div>
    <p class="copy-status" role="status">{{ copyStatus ? ui[copyStatus] : '' }}</p>
  </div>
</template>
