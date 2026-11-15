<script setup lang="ts">
import { computed, ref } from 'vue'
import ReaderDemo from './components/ReaderDemo.vue'
import CopyCode from './components/CopyCode.vue'
import githubMark from './assets/github-mark.svg'
import packageInfo from 'vue-leafbook/package.json'
import { locale, siteName, ui, toggleLocale, usageCode } from './i18n'

const repo = 'https://github.com/MTowa/pamphlet-reader-vue3'
const snippet = computed(() => usageCode(locale.value))
const installCommand = `pnpm add ./${packageInfo.name}-${packageInfo.version}.tgz`
const motionPaused = ref(false)
</script>

<template>
  <div id="top" class="site" :data-motion-paused="motionPaused">
    <div class="hero-backdrop" aria-hidden="true">
      <div class="ambient-light ambient-light-one" />
      <div class="ambient-light ambient-light-two" />
      <div class="background-grid" />
      <div class="paper-fan paper-fan-left">
        <span v-for="leaf in 5" :key="leaf" class="paper-leaf" :style="{ '--leaf': leaf }" />
      </div>
      <div class="paper-fan paper-fan-right">
        <span v-for="leaf in 5" :key="leaf" class="paper-leaf" :style="{ '--leaf': leaf }" />
      </div>
    </div>
    <header class="site-header">
      <nav class="header-links" :aria-label="ui.navigation">
        <a href="#usage">{{ ui.usage }}</a>
        <a href="#demo">{{ ui.demo }}</a>
      </nav>
      <button class="language-toggle" type="button" :aria-label="ui.language" @click="toggleLocale">
        {{ ui.languageButton }}
      </button>
      <a class="github-link" :href="repo" :aria-label="ui.github" :title="ui.github">
        <img class="github-mark" :src="githubMark" alt="" width="98" height="96" />
      </a>
    </header>
    <main>
      <section class="hero" aria-labelledby="site-title">
        <h1 id="site-title">{{ siteName }}</h1>
        <p class="hero-description">{{ ui.description }}</p>
        <a class="demo-link" href="#demo">{{ ui.tryDemo }} <span aria-hidden="true">↓</span></a>
        <CopyCode :code="installCommand" :label="ui.installCode" />
        <p class="install-note">
          {{ ui.installNote }}
          <a :href="repo + '#install-the-built-package--ビルド済みパッケージを使う'"
            >{{ ui.packageSteps }} <span aria-hidden="true">↗</span></a
          >
        </p>
        <button
          class="motion-toggle"
          type="button"
          :aria-pressed="motionPaused"
          :aria-label="motionPaused ? ui.resume : ui.pause"
          :title="motionPaused ? ui.resume : ui.pause"
          @click="motionPaused = !motionPaused"
        >
          <span :class="motionPaused ? 'play-icon' : 'pause-icon'" aria-hidden="true" />
        </button>
      </section>
      <section id="usage" class="usage content-width" aria-labelledby="usage-heading">
        <h2 id="usage-heading">{{ ui.usage }}</h2>
        <div class="usage-body">
          <p v-for="line in ui.usageLines" :key="line">{{ line }}</p>
          <CopyCode :code="snippet" :label="ui.exampleCode" appearance="plain" />
          <div class="documentation-links">
            <a :href="repo + '#quick-start--使い方'"
              >{{ ui.gettingStarted }} <span aria-hidden="true">↗</span></a
            >
            <a :href="repo + '/blob/main/docs/svg.md'">
              {{ ui.svgDocs }} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
      <section id="demo" class="demo-section content-width" aria-labelledby="demo-heading">
        <div class="section-intro">
          <h2 id="demo-heading">{{ ui.demoHeading }}</h2>
          <p>{{ ui.demoHint }}</p>
        </div>
        <ReaderDemo />
      </section>
    </main>
    <footer class="site-footer content-width">
      <a :href="repo + '/blob/main/LICENSE'">MIT License</a>
      <a :href="repo + '/tree/main/third-party'">{{ ui.thirdParty }}</a>
      <a class="author-link" href="https://github.com/MTowa"
        >{{ ui.author }} MTowa <span aria-hidden="true">↗</span></a
      >
    </footer>
  </div>
</template>
