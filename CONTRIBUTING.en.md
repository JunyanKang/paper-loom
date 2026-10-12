<h1 align="center">Contributing</h1>

<p align="center"><a href="README.en.md">Home</a> · <a href="CONTRIBUTING.md">简体中文</a></p>

Contributions can start with a reproducible problem, a design improvement, or code. Describe the use case, OS, and full versions in [Issues](https://github.com/JunyanKang/paper-loom/issues). Use public samples without credentials or private full text.

## Build locally

Use Node.js 20+ and Python 3.10+. Building needs no npm dependencies.

```sh
npm test
npm run build
npm run verify
```

Packages and checksums appear in `dist/`. Test in a separate Zotero profile and keep a backup of your personal library.

## Code ownership

| Directory | Responsibility |
| --- | --- |
| `addon/shared` | Entry points, shared settings, layout, voice installation and runtime |
| `addon/voice` | PDF text processing, speech, captions, shortcuts |
| `addon/references` | Citations, abstracts, reading lists, networks, careers |
| `addon/catalogs` | Pinned voice resources by platform |
| `tests` | Unit tests and isolated Zotero interaction checks |

Translation providers, target language, and typography share one settings layer. Reuse controllers rather than duplicating state. Network tasks need cancellation, timeouts, and cleanup. Release observers, listeners, and timers when a view is destroyed.

## Interface conventions

Shared styles live in `addon/shared/design.js`. Interface labels use system fonts; reading fonts apply to source and translated content. Settings and the paper list share a 360 px width and 680 px height, capped by the viewport. Keep content scrollable in smaller windows.

Short labels remain on one line; longer explanations get their own text area. Check all five interface languages. Flags and voices need accessible names, and controls need keyboard access. Keep selected and hover states distinct. Preserve the surface during page switches and respect reduced motion.

## Validate changes

Run affected tests first, then the full suite. Exercise host APIs, audio, and windows in an isolated Zotero profile. Cover cancellation, closing, re-entry, and timeout behavior. Compare performance on identical inputs and record measurement conditions.

## Document and release

Keep Chinese and English documentation aligned. Capture current interfaces with complete borders, shadows, and breathing room. Identify demonstration data. Install `markdown2` and run `python3 scripts/check_docs.py` for local links and previews.

Build and compare the XPI with source before release. Update versions and release notes. `scripts/release_metadata.py` creates the SHA-512 update feed. Upload the versioned XPI before deploying the feed, then download the public asset, verify it, and test upgrading an earlier release.

Do not commit personal libraries, settings, credentials, engines, caches, or runtime logs. Preserve third-party licenses and attribution.
