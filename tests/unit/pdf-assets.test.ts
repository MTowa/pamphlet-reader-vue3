import { describe, expect, it } from 'vitest'
import { EmbeddedBinaryDataFactory } from '../../packages/vue-flipbook/src/pdf/embeddedAssets'

describe('self-contained PDF support assets', () => {
  it('decodes Japanese CMaps, standard fonts and WASM without network fetches', async () => {
    const factory = new EmbeddedBinaryDataFactory()
    const cmap = await factory.fetch({ kind: 'cMapUrl', filename: 'UniJIS-UCS2-H.bcmap' })
    expect(cmap.byteLength).toBeGreaterThan(20_000)
    const font = await factory.fetch({
      kind: 'standardFontDataUrl',
      filename: 'LiberationSans-Regular.ttf',
    })
    expect([...font.subarray(0, 4)]).toEqual([0, 1, 0, 0])
    const wasm = await factory.fetch({ kind: 'wasmUrl', filename: 'openjpeg.wasm' })
    expect([...wasm.subarray(0, 4)]).toEqual([0, 97, 115, 109])
  })
})
