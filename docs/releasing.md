# Release preparation

No automated publishing workflow is included. Publishing and Git tags require explicit repository-owner authorization.

Before the first npm release:

1. Choose an available npm package name and authorized npm scope. The current @your-org/vue-flipbook name is a placeholder.
2. Replace that exact package name in packages/vue-flipbook/package.json, workspace scripts, both playground manifests/imports, README, API docs and Nuxt CSS configuration.
3. Run pnpm install to update the lockfile; do not manually rewrite dependency resolutions.
4. Set the approved version and changelog entry.
5. Run pnpm check and inspect the generated tarball contents, THIRD_PARTY_NOTICES.md and dist/licenses/. Check third-party/manifest.json against the actual bundled versions/assets. Review any inventory drift before updating its hashes; both installed Vue/Nuxt consumers must pass the license-byte verification.
6. Push a feature branch and submit a PR. Wait for owner approval before merging.
7. Perform npm publication or tag creation only when explicitly requested.

The package is ESM-only with TypeScript declarations, an explicit CSS export, Vue as a peer dependency, repository metadata, MIT-licensed original code and third-party materials under their respective terms. It does not ship node_modules or source fixtures. The distribution contains the compiled PDF.js/StPageFlip runtime, so consumers need only Vue. The full upstream texts also accompany the source archive in third-party/licenses/.

The test runner creates the real tgz via npm pack --ignore-scripts after an explicit typecheck and build. npm pack does not publish a package.
