# User guide

[Home](../README.en.md) · [简体中文](GUIDE.md)

## Open and collapse

Click the book in the library toolbar or a PDF to open Settings. The bottom icons switch between authors, papers, and settings. Click outside the workspace or click the book again to collapse it. Drag the book to reposition it.

Each document shows one expanded panel at a time. Switching between settings, references, and the network keeps the navigation anchored and does not stop reading. PDF tabs and separate reader windows retain their own panel state.

![Settings](images/voices-en.png)

## Choose a reading scope

The default is one paragraph, read once. Selecting text does not start playback automatically; click the headphones to begin.

| Mode | How to use it |
| --- | --- |
| Selection | Select PDF text; release to start listening if automatic reading is enabled |
| Sentence | Select text within a sentence to hear the complete sentence; replay it as needed |
| Paragraph | Select within a paragraph to hear the full paragraph and set repeats |
| Full text | Read from the beginning, a selected position, or saved progress |

Hover over the translation caption or the currently spoken source sentence for two rows of controls. The first contains sentence and paragraph navigation, pause/resume, and Stop. The second has all four reading modes, the current language, and a translation-display toggle. Text-translation flags expand upward in two columns. Spoken translation uses portrait flags with US and UK English separated; hover a language to choose other voices on its left. Click the flag to toggle translated audio. The eye button or a double-click on the flag toggles caption display. Speed and voice remain in Settings; mode and repeats are in the caption toolbar.

Hover over sentence or paragraph replay to choose 1, 3, 5, or ∞ repetitions. The two loop icons control the complete current sentence or paragraph, with one repetition by default. Entering the currently spoken source sentence, caption, or controls pauses reading at the end of the current sentence; moving away resumes it automatically. A manual pause stays paused. Controls close about 0.7 seconds after you leave; moving back cancels dismissal. If a paper card, abstract window, or new selection popup overlaps the caption, the caption and controls fade out and return when the overlap ends.

The PDF must contain extractable text. OCR scanned pages first. Complex tables, equations, and unusual layouts may not read as expected. Text processing handles citation markers and running headers; figure-caption reading is configurable.

Language choices use flags; translation services and model providers use logos. Hover over a provider logo for its name. Select the LLM service and use the gear beside its logo to configure your provider and model. The LLM symbol changes to your provider logo after configuration. In Settings, the four category icons open reading and translation, voices, shortcuts, and appearance. Update options are at the bottom of Appearance.

## Compare a translation

Translation display is enabled by default. Hover over the language icon to choose a target directly. Click the current language icon once to toggle **Read translation**. The eye button marks caption display; the flag background marks translated audio. Both icons remain available when disabled. With spoken translation enabled, the language list contains only supported voice languages; turn it off to restore all text-translation languages. The translation target and interface language are separate choices. Targets without a bundled voice can still be displayed. Online translation requires connectivity; built-in services may rate-limit requests, or you can use your own model provider.

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

Abstracts, selection translations, and reading captions share the target language. A single headphones button follows the display mode: original text, translated text, or alternating original and translated sentences. If the target has no supported voice, translated mode disables listening; bilingual mode skips translations and reads only the original. Switching original, translated, or bilingual display keeps the abstract open.

Once selection-started audio begins playing, its launch popup and original selection clear. A different selection made during preparation remains intact.
