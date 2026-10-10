# Privacy & data

[Home](../README.en.md) · [简体中文](PRIVACY.md)

Paper Loom requires no account and adds no telemetry or usage analytics. Some features contact external services, as described below.

| Activity | Data handling |
| --- | --- |
| PDF listening | Text extraction and speech synthesis run locally; installed voices do not upload text to a speech service |
| Translation and model connection tests | Send the selected text or test text to your chosen translation/model provider |
| Paper and author information | Relevant views may automatically enrich the current paper, sending its DOI, title, authors, or other bibliographic query fields to public services |
| Basic author graph | Computed from local library items; identity enrichment and online lookups contact public services |
| ORCID careers | Send the selected ORCID to the public ORCID API; public responses are cached locally |
| Journal metrics | Read compatible local data or download a public metrics package; displayed source and year govern interpretation |
| Plugin, voices, and model-catalog updates | Download from GitHub / GitHub Pages; servers can receive normal request information such as your IP address |

Translation services include Tencent, Microsoft, Google, or your chosen model provider. Public lookups use relevant sources such as Crossref, OpenAlex, Semantic Scholar, and ORCID. Each provider’s own privacy policy applies. Paper Loom does not automatically upload an entire PDF to these services. Before translating sensitive text, choose an appropriate provider.

## Local storage

- `paper-loom` under the Zotero data directory: reading list, metadata caches, author-network indexes, public career caches, appearance settings, and backgrounds.
- `paper-loom` under the Zotero application-data directory: voice download caches and installed engines. **Engine location** in voice settings shows the active engine path.
- Zotero preferences: reading progress, shortcuts, voices, translation settings, and update preferences.
- Zotero’s login manager: model API keys, identified by `Paper Loom API`; keys are not written into voice packages.

Plugin records are separate from Zotero items and are not guaranteed to sync to other computers through Zotero Sync. Back up Zotero data and preferences before moving computers; download matching voices again on the new system.

## Offline use and cleanup

You can listen offline without online translation or information views. In a fully offline environment, metadata enrichment is unavailable or uses existing caches. To prevent all plugin network activity, disable the plugin or enforce an OS-level network policy.

Removing the plugin does not automatically remove voices or local records. Before a complete cleanup, back up your data and quit Zotero. Delete only the **paper-loom subdirectories** described above, never the Zotero data directory itself. Use Zotero’s Config Editor to remove `extensions.paperLoom.voice.*` and `extensions.zotero.paperLoom.shared.*` preferences. Remove API keys in the plugin’s model settings first. Do not delete other plugins or attachments.

## Feedback

Remove keys, private full text, and personal information before sharing screenshots or logs. Report issues at [GitHub Issues](https://github.com/JunyanKang/paper-loom/issues).
