# Vue Flipbook

A reusable Vue 3 PDF and SVG flipbook. Supply a PDF URL/File or a directory of pre-generated SVG pages.

Vue 3向けのパンフレットビューアーです。PDFまたは事前に用意したSVGのフォルダーを指定して、ページめくり・見開き・スマートフォンでの単ページ表示を利用できます。

**Development preview / 開発版:** `@your-org/vue-flipbook` is a placeholder package name. This package has not been published to npm. Build and install a local tarball using the steps below.

## Quick start / 使い方

```vue
<script setup lang="ts">
import { FlipbookViewer } from '@your-org/vue-flipbook'
import '@your-org/vue-flipbook/style.css'
</script>

<template>
  <FlipbookViewer src="/pamphlet.pdf" />
</template>
```

No PDF-to-image conversion, CDN, manual worker configuration, backend, Tailwind, or Nuxt dependency is required. CSS is an explicit import for predictable SSR and bundler behavior. Public page numbers start at **1**.

For pre-generated SVG pages, register the public folder once with the Vite plugin or Nuxt module, then use `<FlipbookViewer svg-dir="/pamphlet/" />`. Page order is generated automatically from filenames; SVG-only viewers do not load PDF.js or a PDF worker. See [SVGフォルダーの設定と使い方](docs/svg.md).

## Develop / ローカルで試す

Use Node.js **24 LTS** (24.15+), or 22.22.3+, and pnpm **11.13.0**.

```sh
corepack enable
pnpm install
pnpm dev
# Vue playground: http://127.0.0.1:5173/demo/
pnpm dev:nuxt
# Nuxt playground: http://127.0.0.1:3000/nuxt-demo/
```

Original, redistributable PDF and SVG fixtures are included. Regenerate them with `pnpm fixtures`. The playground's 「SVGフォルダー」 button selects the SVG sample; `?format=svg` opens it directly.

## Install the built package / ビルド済みパッケージを使う

```sh
pnpm build
pnpm --filter @your-org/vue-flipbook pack --pack-destination ../../.artifacts
# In your own Vue or Nuxt project:
pnpm add /absolute/path/to/your-org-vue-flipbook-0.1.0.tgz
```

The `@your-org` name is intentionally reserved for renaming before an authorized npm release. See [release instructions](docs/releasing.md).

## Nuxt 4

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@your-org/vue-flipbook/style.css'],
})
```

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import { FlipbookViewer } from '@your-org/vue-flipbook'
</script>
<template>
  <FlipbookViewer src="/pamphlet.pdf" />
</template>
```

The component renders a loading placeholder on the server and creates its PDF worker after mount. `<ClientOnly>` is optional. For a deployment under a subpath, include your app base path in `src`.

## Features / 機能

- URL and local File inputs; loading, error, retry, and source replacement.
- SVG directory input with numeric filename ordering, automatically generated static index, and development file watching for Vite/Nuxt.
- Animated dragging, touch swipes, previous/next, page jump, optional single cover.
- Container-based responsive single-page and spread modes.
- Scoped keyboard navigation, labeled controls, fullscreen when supported.
- Six-page canvas window, two-million-pixel canvas limit, cancellable sequential rendering.
- Typed props, events, exposed methods; replaceable flip-engine adapter.
- Automatic embedded worker and on-demand PDF font/CMap/WASM assets.
- Vue and Nuxt playgrounds; unit tests and browser tests against installed tarballs.

## Documentation

- [API / Props・Events・公開メソッド](docs/api.md)
- [SVGフォルダーの設定と使い方](docs/svg.md)
- [Architecture, worker distribution, lifecycle](docs/architecture.md)
- [Verification and limitations / 検証と制限](docs/verification.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Checks

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:tooling
pnpm test:licenses
pnpm exec playwright install chromium
pnpm test:package
```

`test:package` builds and packs the actual npm artifact, installs it in independent Vue and Nuxt apps, builds both for production at non-root base paths, and runs Playwright against them. It does not publish anything.

## Scope and browser requirements

Current evergreen desktop/mobile browsers with module Workers, Canvas, ResizeObserver and the modern PDF.js APIs (including Promise.withResolvers). Fullscreen depends on browser support and user activation. Remote PDF servers must permit CORS. Strict CSP must allow `worker-src 'self' blob:`; PDF codecs may require `script-src 'wasm-unsafe-eval'`. See the architecture document for details.

This is a visual Canvas/image viewer, not a complete accessible document reader: text selection, search, annotations, password entry and screen-reader document text are not implemented. Provide the original document link or an HTML alternative alongside the viewer when needed. SVG uses image loading and AbortSignal.any; its host must permit the index under connect-src and page images under img-src. SVG-only use does not require PDF worker or WASM CSP permissions.

## License

Original project code: MIT © 2026 MTowa. Bundled third-party code, fonts and data retain their own licenses; the root MIT declaration does not relicense them. PDF.js is Apache-2.0, StPageFlip and QuickJS are MIT, and support assets also include BSD and SIL OFL terms.

The package includes `THIRD_PARTY_NOTICES.md` and the upstream texts and reviewed inventory in `dist/licenses/`. The source repository tracks these texts in `third-party/licenses/`, including the attribution for the StPageFlip patch. Builds check the inventory, and package tests verify the exact license bytes after installing the real tarball. See the [license review](https://github.com/MTowa/pamphlet-reader-vue3/tree/main/third-party) for provenance and maintenance.

When deploying an application that bundles this library, carry the applicable notices and license texts into the application distribution, together with notices for Vue and other application dependencies. All sample artwork is original and MIT licensed; user-supplied PDFs, SVGs and their contents keep their own rights.
