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

## Interface rules

Define shared rules in `addon/shared/design.js`, including embedded settings documents. Use the system UI font for controls; reserve user-selected reading fonts for captions and article content. The type scale is 17 px for window titles, 13 px for settings and controls, and 12 px for supporting text. Use 400 weight for labels and 600 for headings.

Listening, references, and settings use the shared 360 px width, 20 px content gutters, and a bottom-right anchor. Settings rows use a 38 px minimum height and grow with translated text. Put long compound controls on a second row. Keep scrolling available without visible scrollbars. Language and service menus use 24 px icons in a 48 px column aligned to the trigger icon; selection uses a soft tint, with accessible names for all icons and hover names for providers only. Workspace switching preserves opacity; only opening and collapsing use the dock animation.

## Documentation and releases

Keep Chinese and English pages aligned. Screenshots must come from the current product UI and match the documented language. Label demo data. Check local links with `python3 scripts/check_docs.py` (requires `markdown2`).

Release XPI assets are immutable versioned files. `scripts/release_metadata.py` creates the Zotero update feed with SHA-512 verification. Publish the release asset before deploying its update feed. The workflow tests the package; native validation uses separate test profiles. A successful compile alone does not verify sound output or UI behavior.

Do not commit profiles, library contents, API keys, downloaded runtimes, generated caches, or diagnostic logs.
