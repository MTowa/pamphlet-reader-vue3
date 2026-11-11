<script setup lang="ts">
import { ref } from 'vue'
import { FlipbookViewer } from '@your-org/vue-flipbook'
import type { FlipbookReady } from '@your-org/vue-flipbook'
const source = ref('/nuxt-demo/sample.pdf')
const metadata = ref<FlipbookReady>()
</script>

<template>
  <main class="nuxt-demo">
    <p class="eyebrow">VUE FLIPBOOK / NUXT 4</p>
    <h1>Nuxtでも、PDFを指定するだけ。</h1>
    <p>SSRで読み込めるコンポーネント。PDFとWorkerはブラウザー内で起動します。</p>
    <nav>
      <button @click="source = '/nuxt-demo/sample.pdf'">サンプルPDF</button
      ><button @click="source = '/nuxt-demo/alternate.pdf'">別のPDF</button
      ><button @click="source = '/nuxt-demo/missing.pdf'">存在しないPDF</button>
    </nav>
    <!-- Deliberately no ClientOnly: verifies SSR-safe imports and hydration. -->
    <FlipbookViewer :src="source" height="min(760px, 78svh)" @ready="metadata = $event" />
    <output data-testid="metadata">{{
      metadata ? metadata.pageCount + ' pages' : '準備中'
    }}</output>
  </main>
</template>

<style>
body {
  margin: 0;
  background: #f5f4ef;
  color: #263c33;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
.nuxt-demo {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px;
}
.nuxt-demo .eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #6a7d62;
}
.nuxt-demo h1 {
  font-size: clamp(20px, 3vw, 32px);
  font-weight: 500;
}
.nuxt-demo p {
  font-size: 13px;
  line-height: 1.9;
}
.nuxt-demo nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 24px 0;
}
.nuxt-demo button {
  padding: 10px 15px;
  border: 1px solid #cad4c5;
  border-radius: 7px;
  background: #fffefa;
  color: #315641;
  cursor: pointer;
}
.nuxt-demo output {
  display: block;
  font-size: 12px;
  padding: 15px 0;
}
</style>
