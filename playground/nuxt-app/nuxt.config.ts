export default defineNuxtConfig({
  compatibilityDate: '2026-11-11',
  devtools: { enabled: false },
  modules: [['@your-org/vue-flipbook/nuxt', { directories: ['pamphlet'] }]],
  css: ['@your-org/vue-flipbook/style.css'],
  app: {
    baseURL: '/nuxt-demo/',
    head: { htmlAttrs: { lang: 'ja' }, title: 'Vue Flipbook — Nuxt 4' },
  },
})
