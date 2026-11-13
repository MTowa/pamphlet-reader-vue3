# Architecture and distribution

## Boundaries

- FlipbookViewer.vue: public props, typed events, toolbar, error/loading states, keyboard and fullscreen controls.
- useFlipbook.ts: component lifecycle, source-change generations, container measurement and imperative page DOM.
- PdfDocumentSession.ts: one PDF.js loading task and dedicated Worker per document; cancellable Canvas rendering.
- SvgDocumentSession.ts: static index validation, abortable image loading and SVG image release; no PDF imports.
- rendering/types.ts: common page renderer contract returning a DOM element and a release callback.
- PageRenderQueue.ts: serial rendering, nearby-page priority, bounded cache and eviction.
- FlipEngine.ts / stPageFlip.ts: replaceable animation engine contract. Only this adapter knows StPageFlip's zero-based API.
- pages.ts: deterministic one-based page and spread mapping.

Vue owns the outer component. The engine owns a manually created subtree, avoiding conflict between Vue's DOM updates and StPageFlip's moving/cloned page elements.

## Worker delivery

The library build uses Vite's worker-and-inline import. It produces a self-contained worker embedded in the lazy PDF module. Each document constructs a dedicated Worker, passes its port to PDFWorker.create, and passes that PDFWorker to getDocument.

This avoids a host-specific public path, workerSrc mutation, external CDN version matching, or client configuration. PDF.js and StPageFlip are loaded after mount; the package's top-level import is safe on the server. Vue remains an external peer dependency.

Tradeoff: the PDF runtime chunk includes the worker and is comparatively large (approximately 1.7 MB uncompressed before consumer minification). It is only loaded when a viewer opens a PDF. SVG opens a separate small image renderer; the flip engine and page queue are shared. The worker requires a Content Security Policy allowing **worker-src 'self' blob:**. This initial release has no separate worker URL override.

## SVG directory integration

The separate `/vite` and `/nuxt` package exports run in Node during development/build. They discover SVG files under the host's public directory and write `flipbook.json` with natural numeric filename order. The browser fetches this static index and loads nearby pages as images. A watcher regenerates the index and reloads the development app on page changes. There is no directory-listing endpoint, dynamic server dependency or Node tooling in the browser export. The generator refuses unrelated existing manifests, empty directories and SVG symlinks.

SVG markup is never injected into the DOM. `<img>` keeps scripts inactive; external dependencies inside SVG may not load. The cache reuses images at every display size and releases evicted images; first-page dimensions determine the paper ratio. No PDF.js, worker or PDF support assets are requested in an SVG-only session. Changing formats uses the same source-generation guard and destroys the previous document. Index fetches and image loads respond to cancellation. See [SVG usage and asset constraints](svg.md).

## Font, CMap and image assets

PDF.js 5.7.284 is pinned because its BinaryDataFactory interface and worker protocol are version-specific. CMaps, standard fonts and WASM assets are built into individual lazy chunks containing data URLs. A custom BinaryDataFactory imports and decodes only the requested data. No additional public-directory copy or external fetch is needed. Unembedded fonts can still depend on browser/system fallback fonts.

WASM image codecs may require **script-src 'wasm-unsafe-eval'** under CSP. PDF files themselves must be permitted by connect-src; embedded PDF font loading can require **font-src 'self' blob: data:**. The package does not configure the hosting application's CSP.

## Rendering budget

The cache contains at most six page canvases: the visible page(s), then the nearest two pages on either side. Pages render serially, visible pages first. Device pixel ratio is capped at2 and each canvas is capped at2,000,000 pixels. Approximately48 MB is the maximum steady-state pixel backing store for six full-size RGBA canvases; a replacement render can temporarily add one canvas. This is not a total browser-memory limit: PDF bytes, decoded resources, fonts and engine DOM are additional.

Every PDF page has a lightweight DOM placeholder, so DOM use is O(page count). The included stress fixture has80 pages. Thousands-page performance is not claimed.

ResizeObserver responds to the actual container. Resize events are debounced for100ms; identical geometry does nothing. Smaller or slightly enlarged page areas reuse cached canvases. Larger increases trigger fresh rendering. Changes during a flip wait for the engine to return to its idle state.

## Cleanup and races

A monotonically increasing source generation discards results from replaced documents. Resource teardown destroys the render queue, cancels RenderTasks, destroys the PDF loading task, destroys the PDFWorker wrapper, terminates the dedicated native Worker, clears canvases and destroys the flip engine. Unmount also disconnects ResizeObserver, clears resize timers and removes fullscreen listeners.

StPageFlip2.0.7 does not cancel its requestAnimationFrame loop when destroyed. The pnpm patch additionally cancels that frame, clears initialization/touch timers and releases page references. Its upstream MIT license and modification notice are distributed. An adapter lifecycle test checks the scheduled frame; the browser suite checks that no tracked frames or document workers remain after unmount.

## Sources

- [PDF.js examples and Canvas rendering](https://mozilla.github.io/pdf.js/examples/)
- [PDF.js project](https://github.com/mozilla/pdf.js)
- [Vite worker imports](https://vite.dev/guide/features#web-workers)
- [StPageFlip settings](https://nodlik.github.io/StPageFlip/docs/interfaces/flipsetting.html)
- [Nuxt ClientOnly](https://nuxt.com/docs/4.x/api/components/client-only)

The Nuxt demo deliberately avoids ClientOnly to exercise direct SSR imports and client hydration. Explicit CSS import ensures styles remain available in either setup.
