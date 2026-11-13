# Contributing

Use Node24 LTS and pnpm11.13.0. Install with pnpm install. Start the Vue demo with pnpm dev, or Nuxt with pnpm dev:nuxt. Both import the built library, so rerun pnpm build after library changes.

## GitHub Flow

1. Start from the current main branch.
2. Create a feature branch: feat/description, fix/description or docs/description.
3. Make focused changes and run the checks below.
4. Push the working branch and open a pull request targeting main.
5. Wait for the repository owner's review and explicit approval before merging.

Do not push directly to main. Do not publish to npm, create Git tags, or force-rewrite existing history without explicit authorization.

## Checks

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm exec playwright install chromium
pnpm test:package
```

The package test installs an actual tarball into temporary standalone Vue and Nuxt projects. It uses the network to install dependencies and leaves logs/report metadata in .artifacts/. Browser traces and screenshots are stored under test-results/ and playwright-report/.

When changing PDF or flip lifecycle behavior, include a regression test for replacement/unmount. Preserve one-based page numbering. Keep rendering separate from the animation engine. The bundled StPageFlip patch is documented in docs/architecture.md; update both the patched source and its shipped bundles when changing it.

Original sample PDFs are generated with pnpm fixtures and are MIT licensed. Do not commit third-party PDFs without redistribution permission.
