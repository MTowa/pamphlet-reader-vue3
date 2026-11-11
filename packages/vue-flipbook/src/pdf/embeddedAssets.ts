/**
 * Vite turns each lazy import into a separate chunk containing an inlined asset.
 * No public-directory copy, CDN URL, or host-specific asset base is required.
 */
const assets = import.meta.glob<string>(
  [
    '../../node_modules/pdfjs-dist/cmaps/*.bcmap',
    '../../node_modules/pdfjs-dist/standard_fonts/*.{pfb,ttf}',
    '../../node_modules/pdfjs-dist/wasm/*.wasm',
  ],
  { query: '?url&inline', import: 'default' },
)

const folders: Record<string, string> = {
  cMapUrl: 'cmaps',
  standardFontDataUrl: 'standard_fonts',
  wasmUrl: 'wasm',
}

export class EmbeddedBinaryDataFactory {
  async fetch({ kind, filename }: { kind: string; filename: string }): Promise<Uint8Array> {
    const load = assets[`../../node_modules/pdfjs-dist/${folders[kind]}/${filename}`]
    if (!load) throw new Error(`PDF support asset unavailable: ${kind}/${filename}`)
    const url = await load()
    // Decode locally: avoids a data: fetch and needs no connect-src data: policy.
    const encoded = url.slice(url.indexOf(',') + 1)
    const binary = atob(encoded)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  }
}
