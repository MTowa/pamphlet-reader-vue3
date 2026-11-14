import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { svgDirectories } from 'vue-leafbook/vite'

export default defineConfig({
  plugins: [vue(), svgDirectories({ directories: ['pamphlet'] })],
  base: '/demo/',
  build: {
    assetsInlineLimit: 0,
    license: { fileName: 'licenses/application-dependencies.json' },
  },
})
