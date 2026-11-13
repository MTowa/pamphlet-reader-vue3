import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { svgDirectories } from '@your-org/vue-flipbook/vite'

export default defineConfig({
  plugins: [vue(), svgDirectories({ directories: ['pamphlet'] })],
  base: '/demo/',
})
