# User guide

[Home](../README.en.md) · [简体中文](GUIDE.md)

## Open and collapse

Click the book in the library toolbar or a PDF to open Settings. The bottom icons switch between authors, papers, and settings. Click outside the workspace or click the book again to collapse it. Drag the book to reposition it.

Each document shows one expanded panel at a time. Switching between settings, references, and the network keeps the navigation anchored and does not stop reading. PDF tabs and separate reader windows retain their own panel state.

![Settings](images/voices-en.png)

## Choose a reading scope

| Mode | How to use it |
| --- | --- |
| Selection | Select PDF text; release to start listening if automatic reading is enabled |
| Sentence | Select text within a sentence to hear the complete sentence; replay it as needed |
| Paragraph | Select within a paragraph to hear the full paragraph and set repeats |
| Full text | Read from the beginning, a selected position, or saved progress |

Hover over a translation caption to reveal two rows below it. The first contains sentence and paragraph navigation, pause/resume, and Stop. The second shows all four modes and one current language flag. The active mode is highlighted. Hover over the flag for an upward column of languages; click to toggle translated audio, or double-click to toggle translation. Pause keeps your position; Stop ends the task. Reading mode, repeats (1, 2, 3, 5, 10, ∞), document starting point, speed, and voice are in Settings → Voices & engine. The floating book opens Settings without a hover toolbar.

The PDF must contain extractable text. OCR scanned pages first. Complex tables, equations, and unusual layouts may not read as expected. Text processing handles citation markers and running headers; figure-caption reading is configurable.

Language choices use flags; translation services and model providers use logos. Hover over a provider logo for its name. Select the LLM service and use the gear beside its logo to configure your provider and model. The LLM symbol changes to your provider logo after configuration. In Settings, the four category icons open reading and translation, voices, shortcuts, and appearance. Update options are at the bottom of Appearance.

## Compare a translation

Translation display is enabled by default. Hover over the language icon to choose a target directly. Click the current language icon once to toggle **Read translation**. Double-click to toggle translation display: a soft background marks the enabled state, and the icon remains available when disabled. With spoken translation enabled, the language list contains only supported voice languages; turn it off to restore all text-translation languages. The translation target and interface language are separate choices. Targets without a bundled voice can still be displayed. Online translation requires connectivity; built-in services may rate-limit requests, or you can use your own model provider.

The selection translation card has a flag synchronized with the caption controls. Changing it refreshes the translation. Three scope icons select sentence, selection, or paragraph; hovering over the headphones button reveals four equal mode areas. Click Sentence, Selection, Paragraph, or Document to start one reading; Document starts at the selected passage.

![Translation caption controls](images/caption-controls-en.png)

## Inspect in-text citations

Hover over supported numeric or author–year citations to inspect the referenced paper. Locate occurrences, open a local paper or DOI, or copy a formatted citation. Recognition depends on the PDF’s text structure. If it fails, open the reference panel or search by DOI/title.

Click or hover a paper title to expand its abstract. Abstracts support translation, source comparison, and listening. If an abstract is missing locally, query online metadata where offered. Paper Loom does not invent an abstract when a source has none.

![Reference abstract](images/references-en.png)

## Read later and save

Add interesting papers to **Read later** and return to the list directly from your library, without opening a PDF. Open papers, inspect abstracts, copy citations, or save entries to Zotero. Check the title, authors, year, and DOI before saving: similar candidates are not necessarily the same paper.

Removing an entry from Read later does not delete the corresponding Zotero paper. Full-text access still depends on publisher permissions; Paper Loom does not bypass paywalls or sign-in requirements.

Continue with [Settings](SETTINGS.en.md), [Authors & careers](NETWORK.en.md), or the [FAQ](FAQ.en.md).
