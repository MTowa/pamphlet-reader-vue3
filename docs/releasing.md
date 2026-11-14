# Release preparation

No automated publishing workflow is included. Publishing and Git tags require explicit repository-owner authorization.

Before the first npm release:

1. The chosen unscoped package name is `vue-leafbook`. Recheck its availability and the authorized npm account immediately before publishing; the name has not been reserved by this repository.
2. Set the approved version and changelog entry. Update the README and site's tarball filename if the version changes. Keep the pre-release notice until publication succeeds.
3. Run `pnpm install --frozen-lockfile` and `pnpm check`. Inspect the generated `vue-leafbook-<version>.tgz`, its package name/exports, `THIRD_PARTY_NOTICES.md` and `dist/licenses/`. Check `third-party/manifest.json` against the actual bundled versions/assets. Review any inventory drift before updating its hashes; both installed Vue/Nuxt consumers must pass the license-byte verification.
4. Push a work branch and submit a PR. Wait for owner approval before merging.
5. Perform npm publication or tag creation only when explicitly requested. Once publication succeeds, update the site's install command and the documentation to match the released package.

The package source remains in `packages/vue-flipbook/`; this internal directory is separate from the public npm name. Existing development consumers must replace `@your-org/vue-flipbook` with `vue-leafbook` in their dependency manifest and import/CSS/Vite/Nuxt paths. The component name, one-based page API and `flipbook.json` filename are unchanged. SVG indexes marked with the old generator name are recognized and regenerated with `vue-leafbook`; unrelated user files are still protected.

The package is ESM-only with TypeScript declarations, an explicit CSS export, Vue as a peer dependency, repository metadata, MIT-licensed original code and third-party materials under their respective terms. It does not ship node_modules or source fixtures. The distribution contains the compiled PDF.js/StPageFlip runtime, so consumers need only Vue. The full upstream texts also accompany the source archive in third-party/licenses/.

The test runner creates the real tgz via npm pack --ignore-scripts after an explicit typecheck and build. npm pack does not publish a package.
