export default defineNuxtConfig({
  compatibilityDate: '2026-11-11',
  devtools: { enabled: false },
  modules: [['vue-leafbook/nuxt', { directories: ['pamphlet'] }]],
  css: ['vue-leafbook/style.css'],
  app: {
    baseURL: '/nuxt-demo/',
    head: { htmlAttrs: { lang: 'ja' }, title: 'vue-leafbook — Nuxt 4' },
  },
})
