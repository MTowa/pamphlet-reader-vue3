<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ui } from '../i18n'

const props = withDefaults(
  defineProps<{ code: string; label: string; appearance?: 'hero' | 'plain' }>(),
  { appearance: 'hero' },
)
const codeText = ref<HTMLElement>()
const copyStatus = ref<'' | 'copied' | 'copyFailed'>('')
let resetTimer: ReturnType<typeof setTimeout> | undefined

onBeforeUnmount(() => {
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
    <div class="code-panel">
      <div class="code-header">
        <span class="code-language">
          <svg v-if="appearance === 'hero'" viewBox="0 0 20 20" aria-hidden="true">
            <path d="m4 5 5 5-5 5m8 0h4" />
          </svg>
          {{ appearance === 'hero' ? 'pnpm' : 'Vue' }}
        </span>
        <button class="copy-button" type="button" @click="copyCode">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path v-if="copyStatus === 'copied'" d="m4 10 4 4 8-8" />
            <template v-else>
              <rect x="7" y="7" width="10" height="10" rx="2" />
              <path d="M12 4V3H3v9h1" />
            </template>
          </svg>
          {{ ui.copy }}
        </button>
      </div>
      <div class="code-body">
        <span v-if="appearance === 'hero'" class="command-prompt" aria-hidden="true">$</span>
        <pre><code ref="codeText">{{ code }}</code></pre>
      </div>
    </div>
    <p class="copy-status" role="status">{{ copyStatus ? ui[copyStatus] : '' }}</p>
  </div>
</template>
