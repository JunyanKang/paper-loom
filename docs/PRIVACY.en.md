<h1 align="center">Privacy &amp; data</h1>

<p align="center"><a href="../README.en.md">Home</a> · <a href="PRIVACY.md">简体中文</a></p>

Listening runs on your computer. Translation and information lookups contact external services when those features are used. Paper Loom requires no account and adds no telemetry or usage analytics.

## What goes online

| Activity | Data handling |
| --- | --- |
| PDF listening | Text extraction and speech synthesis run locally; installed voices do not upload text to a speech service |
| Translation and model connection tests | Send the selected text or test text to your chosen translation/model provider |
| Paper and author information | Relevant views may automatically enrich the current paper, sending its DOI, title, authors, or other bibliographic query fields to public services |
| Basic author graph | Computed from local library items; identity enrichment and online lookups contact public services |
| ORCID careers | Send the selected ORCID to the public ORCID API; public responses are cached locally |
| Journal metrics | Read compatible local data or download a public metrics package; displayed source and year govern interpretation |
| Plugin, voices, and model-catalog updates | Download from GitHub / GitHub Pages; servers can receive normal request information such as your IP address |

Translation services include Tencent, Microsoft, Google, or your chosen model provider. Public lookups use relevant sources such as Crossref, PubMed/PMC, Europe PMC, Semantic Scholar, and ORCID. Each provider’s own privacy policy applies. Paper Loom does not automatically upload an entire PDF to these services. Before translating sensitive text, choose an appropriate provider.

## Local storage

- `paper-loom` under the Zotero data directory: reading list, metadata caches, author-network indexes, public career caches, appearance settings, and backgrounds.
- `paper-loom` under the Zotero application-data directory: voice download caches and installed engines.
- Zotero preferences: reading progress, shortcuts, voices, and translation settings.
- Zotero’s login manager: model API keys, identified by `Paper Loom API`; keys are not written into voice packages.

These records are separate from Zotero library items and do not all travel through Zotero Sync. Back up your data and preferences before moving to another computer. You can install the matching voice package again on the new system.

## Offline use

You can listen offline without online translation or information views. In a fully offline environment, metadata enrichment is unavailable or uses existing caches. To prevent all plugin network activity, disable the plugin or enforce an OS-level network policy.

## Uninstalling and removing data

Uninstalling preserves voice packages and local records so you can use them again later. To remove them as well:

1. Remove API keys in the model settings, then back up anything you want to keep.
2. Quit Zotero and delete only the **paper-loom subdirectories** described above. Keep the Zotero data directory, attachments, and other plugins intact.
3. Use Zotero’s Config Editor to remove `extensions.paperLoom.voice.*` and `extensions.zotero.paperLoom.shared.*` preferences.

## Feedback

Remove keys, private full text, and personal information before sharing screenshots or logs. Report issues at [GitHub Issues](https://github.com/JunyanKang/paper-loom/issues).

## Research assistant

Sending a message submits the question, needed conversation history, paper metadata and retrieved excerpts to the separately configured model. After image support is confirmed in Settings, the assistant may request and send relevant PDF page images. Literature search is available by default; when used, queries go to Europe PMC, Crossref or configured Brave Search; reading a public page contacts that site. Model providers handle content under their own policies.

Conversations and source records stay in `paper-loom/assistant/` inside the Zotero data directory and do not automatically sync. Assistant and search credentials use the separate `Paper Loom Assistant API` login realm. The model cannot modify or delete library items. Saving papers or adding them to the reading list through citation cards remains a user action.

The local calendar index stores daily question counts and the last question summary; short question summaries also support local search.

Selected-paper conversations send metadata and abstracts for the pinned papers. When needed, the model can request indexed text excerpts, annotations and child notes from those papers. Selecting papers or opening the assistant sends nothing; model requests begin when you send a question. Include only papers you intend to discuss.

Answers that you preview and save become ordinary Zotero child notes and follow the library’s sync settings, unlike local-only chat history. Saving does not overwrite existing notes.

References within a paper are matched locally using bibliography data from open PDFs. Matched titles, authors, years and other citation details are saved locally with the conversation. Opening a card or abstract may still contact the bibliographic and translation services described above.

An attached image is sent to the assistant provider with that question. Thumbnails and size-limited images are stored beside the conversation and removed when it is deleted. Remote images in model text do not load automatically; opening an external image link visits its website in the browser.

See the [Loom assistant guide](ASSISTANT.en.md) for attachments, history, exports and usage.
