<h1 align="center">Paper Loom</h1>
<p align="center"><strong>Read a paper, follow its references, and keep the research moving in Zotero.</strong></p>

<p align="center">
  <a href="docs/images/hero-en.png"><img src="docs/images/hero-en.png" alt="Paper Loom: stay with the paper" width="768"></a>
</p>

<p align="center"><a href="https://github.com/JunyanKang/paper-loom/releases/latest"><strong>Download</strong></a> · <a href="docs/INSTALL.en.md">Install</a> · <a href="docs/GUIDE.en.md">Listening & translation</a> · <a href="docs/ASSISTANT.en.md">AI assistant</a> · <a href="README.md">简体中文</a></p>

Paper Loom is an open-source Zotero plugin that brings **offline speech, translation, reference previews, author networks, and AI research conversations** beside your papers. Listen to a difficult passage, inspect the study behind a citation, follow an author’s work, and turn the questions that remain into research notes.

Start with a selection, the PDF you have open, or a few papers from your library. The source material stays connected to the question.

## From reading to research

| When you want to… | Continue in Paper Loom |
| --- | --- |
| Read a long passage in another way | Listen by sentence, selection, paragraph or full text; adjust speed and repeat |
| Understand another language while keeping the original | Compare a nearby translation; use one target language across passages and abstracts |
| Check the research behind a statement | Hover over a citation, read its abstract or translation, then open or save it for later |
| Find connections among authors | Explore co-authors in your collection and inspect their public careers |
| Understand a result or plan the next experiment | Discuss papers and figures with Loom, follow the sources, and save a note |

## Open your first paper

1. Download the **`.xpi`** from [Releases](https://github.com/JunyanKang/paper-loom/releases/latest). Do not unzip it. In Zotero, choose **Tools → Plugins → gear → Install Plugin From File**.
2. Open a PDF and hover over the book to reveal the panel. Its four navigation entries open the assistant, author network, paper list, and settings.
3. Start with a question: select a passage for translation, hover over a citation, or open the assistant. Selecting text alone does not start playback.
4. To listen, install voices under **Speech environment** in Settings. To chat with Loom, configure your own model under **Research assistant**.

Voices and model connections are optional. Translation, reference cards and author networks do not require the voice package. Assistant credentials are stored separately from those used for model-based translation.

Declared compatibility is Zotero **10.x from 10.0.5-beta.1, and 11.x**. Automatic voice packages are available for Apple Silicon Macs running macOS 14+ and Windows x64. They include the runtime, so no separate Python installation is needed. See [Installation](docs/INSTALL.en.md) for platform details, disk space and migration.

## Let the paper follow your pace

<p align="center">
  <a href="docs/images/caption-controls-en.png"><img src="docs/images/caption-controls-en.png" alt="Translation and listening controls with the assistant entry" width="493"></a>
</p>

Choose **Sentence** to hear a term in context, **Selection** for a passage you picked, **Paragraph** to keep the surrounding argument, or **Full text** to continue reading. The default is one paragraph, once. Repeat sentences and paragraphs independently, and choose a speed from 0.5× to 2×.

Hover over the current passage, translation or controls to pause at the end of the sentence. Move away to continue. A manual pause stays paused until you resume.

After installing the voice package, synthesis runs locally and works offline. There are 14 voices across English, Mandarin Chinese, Japanese and French, including US and UK English. Keep a translation beside the original or listen to the translation in a supported voice.

## Read a translation without losing the original

<p align="center">
  <a href="docs/images/selection-translation-en.png"><img src="docs/images/selection-translation-en.png" alt="Selection translation with the research assistant entry" width="320"></a>
</p>

Selections, reading captions and abstracts share a translation target. Compare an unfamiliar method with the original sentence, or switch an abstract between original, translated and bilingual views. Abstract titles are translated along with the text.

Choose a translation service in Settings or connect your own model. **Interface language, translation target and speaking voice are separate settings.** Changing button labels does not alter the paper, and a language supported for translation may not have an offline voice.

[Listening and translation guide →](docs/GUIDE.en.md)

## Follow a citation while the question is fresh

<p align="center">
  <a href="docs/images/references-en.png"><img src="docs/images/references-en.png" alt="Reference card and abstract window" width="876"></a>
</p>

Hover over a recognized in-text citation to inspect its title, authors, year, library status and abstract. Open a local attachment or DOI, copy a formatted reference, or add the paper to **Read later**.

The paper list keeps a route back to further reading. Abstracts and their translations share the same reference card. Confirmed sources in the assistant’s answers use these cards too, so a conversation can lead straight back to the literature.

Scans need OCR; unusual columns or text encodings can affect recognition. Unmatched citations can be found manually in the list. If a source provides no abstract, Paper Loom leaves it missing.

## See the authors behind your collection

<p align="center">
  <a href="docs/images/network-en.png"><img src="docs/images/network-en.png" alt="Author network built from a demonstration library" width="784"></a>
</p>

Authors & careers connects co-authors and papers from your Zotero library or collection. Move from the overview into a local network, inspect an author’s papers, then explore education, employment and works in their public ORCID record.

The graph reflects **the relationships covered by your collection**. Use it to find connections and decide what to read next. Verify same-name authors against their papers and ORCID. The screenshot uses a demonstration library.

[Explore author networks →](docs/NETWORK.en.md)

## Loom: a conversation with the paper in view

<p align="center">
  <a href="docs/images/assistant-en.png"><img src="docs/images/assistant-en.png" alt="Loom conversation with a table, source page and in-message activity" width="384"></a>
  <br><sub>Current interface with demonstration conversation content.</sub>
</p>

Loom is Paper Loom’s research assistant. It takes a question from your reading and keeps the answer connected to sources you can revisit.

**Start with the right context.** Open the assistant in a PDF to discuss that paper. Enter from a selection or reading controls to bring the passage, translation and page. Select 2–8 papers in the library to compare their questions, methods and findings. Existing conversations keep their original research scope.

**Find material as the question develops.** Loom can retrieve relevant passages, indexed text, annotations and notes from the selected papers. A vision-capable model can inspect PDF pages or an image you attach. Current literature searches use Europe PMC and Crossref; optional Brave configuration adds general web search.

**Bring the answer back into your work.** Page links return to the PDF, while confirmed literature citations open reference cards on hover. External sources appear first and local page links are grouped by paper. Ask follow-up questions, preview an answer before saving it as a Zotero child note, or return to a conversation through the calendar.

Text, tables, images and short activity updates stay inside their message bubbles. Type Markdown or paste formatted text and attach images, keep figures as thumbnails, and click to enlarge or download. Choose 2× or 3× chat width for wider tables.

Answers depend on the model, accessible text and image clarity. Reading excerpts is not the same as reading the whole paper; retrieving an abstract does not verify a conclusion. Use Loom to develop understanding and questions, then check important judgments against the sources.

**[Start using Loom: setup, questions, images and sources →](docs/ASSISTANT.en.md)**

## Make it fit your workspace

<p align="center">
  <a href="docs/images/appearance-en.png"><img src="docs/images/appearance-en.png" alt="Paper Loom appearance and settings illustration" width="384"></a>
</p>

Appearance, interface language, shortcuts, translation typography, citation style and model connections live in main Settings. Workspaces share themes and backgrounds. Update, Guide, Privacy and Feedback remain at the bottom.

[Settings guide →](docs/SETTINGS.en.md)

## What stays local, and what connects online

| Feature | Where data goes |
| --- | --- |
| Offline speech, PDF text processing, conversation history | Processed or stored locally; downloading voices initially needs a connection |
| Translation | Text goes to your selected translation provider |
| Paper, abstract and author queries | Relevant query information goes to the online source |
| Research chat and vision | After Send, needed context and images go to the separately configured assistant model |

Paper Loom requires no plugin account and adds no telemetry or usage analytics. Model providers may require an account, API key and payment. Local conversations and images do not automatically sync with Zotero. See [Privacy & data](docs/PRIVACY.en.md).

## Find the guide you need

| Guide | What it covers |
| --- | --- |
| [Installation & updates](docs/INSTALL.en.md) | The plugin, voices, updates and migration |
| [Listening & translation](docs/GUIDE.en.md) | Reading scope, speed, repetition, captions and reference cards |
| [Loom assistant](docs/ASSISTANT.en.md) | Models, paper context, images, search, sources, history and notes |
| [Settings](docs/SETTINGS.en.md) | Appearance, shortcuts, translation and assistant connections |
| [Authors & careers](docs/NETWORK.en.md) | Network scope, nodes, identity and public careers |
| [FAQ](docs/FAQ.en.md) | Speech, recognition, translation and common questions |
| [Release notes](CHANGELOG.en.md) | Changes by version |

The source is [MIT licensed](LICENSE). Voice dependencies and third-party resources retain [their own licenses](NOTICE.md). [Report a problem](https://github.com/JunyanKang/paper-loom/issues) or [contribute](CONTRIBUTING.en.md).
