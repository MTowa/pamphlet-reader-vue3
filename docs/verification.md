# Verification / 検証記録

## Reproduce

Use Node24 LTS and pnpm11.13.0.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm exec playwright install chromium
pnpm test:package
```

The package verifier builds a tgz, checks its exported files, installs it into new standalone directories outside the workspace, typechecks/builds both consumers, then runs Playwright. There is no source alias, workspace symlink, manual worker configuration, copied worker asset or CDN in these consumers. The Vue app is served under /demo/ and the Nuxt app under /nuxt-demo/.

The run writes per-command logs, the tarball's SHA-256 and consumer directory paths to .artifacts/. These machine-local results are ignored by Git. CI uploads logs and browser traces for inspection.

CI pins the hosted Ubuntu 24.04 image and uses its preinstalled Chromium runtime libraries. It downloads only Playwright's headless Chromium shell, avoiding an unnecessary apt update for supplementary fonts. All browser tests still run; a missing runtime dependency fails the check normally.

## Coverage

| Requirement                               | Evidence                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Load a real PDF and obtain its page count | Browser waits for rendered canvas, checks painted pixel and total6.                                          |
| A real worker is used                     | Browser observes a blob Worker; no fake-worker fallback is accepted.                                         |
| Missing PDF                               | Visible error, retry, then recovery by File input.                                                           |
| Previous/next and jump                    | Browser clicks controls, checks one-based values and displayed canvases.                                     |
| Cover numbering                           | Unit cases for both cover modes and final pages; browser checks cover1 → spread2–3.                          |
| Desktop spread / mobile single            | Chromium desktop and Pixel7 emulation; visible-page labels and mode checked.                                 |
| Responsive container                      | Browser changes width while on page40 and checks mode/page preservation.                                     |
| URL and File replacement                  | Browser loads six- and three-page PDFs; local File restores six-page PDF.                                    |
| Stale request during replacement          | A delayed original PDF response is released after a new source is ready.                                     |
| Keyboard and toolbar settings             | Unit test disables keyboard; browser checks Home/End, input scope and hiding toolbar.                        |
| Drag and touch                            | Mouse drag crosses the spine; Chromium receives native touch events for a swipe.                             |
| Fullscreen                                | User-action button enters and exits the Fullscreen API.                                                      |
| Long PDF                                  | 80-page fixture; jump to40; at most six canvases and two million pixels each.                                |
| Cleanup                                   | After unmount, tracked native workers and requestAnimationFrame callbacks both reach zero; remount succeeds. |
| SSR / Nuxt                                | HTTP response contains the loading placeholder; direct component hydration has no error.                     |
| PDF support assets                        | Unit test decodes Japanese CMap, TrueType font and OpenJPEG WASM data without network fetch.                 |
| Types and package integration             | Library and both consumers pass typechecking; production apps use the installed tarball.                     |

The unit suite has20 cases across page mapping, render scheduling, component API, SSR, lifecycle and support assets. The browser suite has18 cases across desktop and mobile Chromium conditions.

License verification adds four regression cases (`pnpm test:licenses`, after `pnpm build`): intact notices pass, while a missing QuickJS text, a truncated copyright/permission text, and an unreviewed bundled dependency fail. The build checks reviewed versions, asset filenames, upstream notices and license hashes against `third-party/manifest.json`. `pnpm test:package` additionally verifies all 18 reviewed license/notice texts byte for byte in both independent consumers installed from the actual tarball. Vite's module license report supplements the manual review of prebuilt PDF.js code, fonts, CMaps and WASM assets.

## Scope and known limitations

- Mobile tests emulate a Pixel7 in desktop Chromium. They do not prove behavior on a physical Android/iPhone device. Safari and Firefox are not part of this run.
- Sample PDFs are original6-,3-,80- and1-page documents. CMap/font/codec bytes are unit tested, but there is no exhaustive PDF-format compatibility corpus or real-device memory benchmark.
- Password input, PDF text selection/search, annotations, forms, zoom controls, right-to-left binding and text-layer screen-reader reading are outside this initial API. Password-protected documents report a load error.
- Fullscreen is hidden when unsupported. A remote URL must allow browser access/CORS.
- The canvas cache is bounded; the document byte buffer, shared PDF resources and one lightweight DOM node per page still consume memory.
- Automatic inline worker delivery requires blob workers under CSP and produces a comparatively large lazy PDF runtime chunk. Vite may warn about a chunk above500kB. This is a size warning, not a failed build.
- The package is ESM-only; a CommonJS require() API is not supplied.
- The npm name remains the placeholder @your-org/vue-flipbook. No npm release or Git tag is created by these checks.
