import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import FlipbookViewer from '../../packages/vue-flipbook/src/components/FlipbookViewer.vue'

describe('SSR', () => {
  it('renders a stable placeholder without loading PDF.js or creating a Worker', async () => {
    const html = await renderToString(createSSRApp(FlipbookViewer, { src: '/sample.pdf' }))
    expect(html).toContain('PDFを読み込んでいます')
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain('<canvas')
  })
})
