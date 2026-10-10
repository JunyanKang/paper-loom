# Contributing

[Home](README.en.md) · [简体中文](CONTRIBUTING.md)

Report reproducible problems or propose an improvement in [Issues](https://github.com/JunyanKang/paper-loom/issues). Include the OS, architecture, Zotero and Paper Loom versions, steps, and expected behavior. Share only non-sensitive examples.

## Build

Requirements: Node.js 20+ and Python 3.10+. No npm dependency installation is required.

```sh
npm test
npm run build
npm run verify
```

The XPI and checksums are written to `dist/`. Install the XPI into a dedicated Zotero profile for development. Do not develop against your only copy of a personal library.

`addon/shared` provides product navigation, settings, and runtime management. `addon/voice` handles speech and PDF reading; `addon/references` handles citations, authors, and careers. `addon/catalogs` pins downloadable resources. A build is self-contained and does not require a sibling project.

## Documentation and releases

Keep Chinese and English pages aligned. Screenshots must come from the current product UI and match the documented language. Label demo data. Check local links with `python3 scripts/check_docs.py` (requires `markdown2`).

Release XPI assets are immutable versioned files. `scripts/release_metadata.py` creates the Zotero update feed with SHA-512 verification. Publish the release asset before deploying its update feed. The workflow tests the package; native validation uses separate test profiles. A successful compile alone does not verify sound output or UI behavior.

Do not commit profiles, library contents, API keys, downloaded runtimes, generated caches, or diagnostic logs.
