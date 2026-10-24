<h1 align="center">User guide</h1>

<p align="center"><a href="../README.en.md">Home</a> · <a href="GUIDE.md">简体中文</a></p>

## Open a paper

Hover over the book to open Settings on first use, or return to your last workspace. The bottom navigation opens authors, papers, the research assistant, and settings. Moving away from both the book and workspace closes it after a brief delay; crossing the gap or moving back keeps it open. Press Esc to close it, or drag the book to move it. Switching workspaces does not interrupt audio.

## Choose how much to read

Select text and click the headphones. Hover over the headphones to choose one of four modes. The default is one paragraph, read once; selecting text alone does not start playback.

| Mode | Scope |
| --- | --- |
| Sentence | The sentence at the selected position |
| Selection | The selected text |
| Paragraph | The paragraph at the selected position |
| Full text | Continue from the selected position or reading progress |

When audio starts, the launch popup and its original selection clear. A newer selection made while audio was preparing remains intact.

## Keep the controls beside the text

<p align="center">
  <a href="images/caption-controls-en.png"><img src="images/caption-controls-en.png" alt="Listening controls" width="493"></a>
</p>

Hover over the current source passage, its translation, or the area below it. The first row controls sentences, paragraphs, pause, and stop. The second holds modes, speed, language, and translation visibility.

- Hover over replay to choose **1, 3, 5, or ∞** repeats, separately for sentences and paragraphs.
- Choose **0.5×, 0.75×, 1×, 1.25×, 1.5×, or 2×**. The new speed applies to subsequent synthesis.
- Hovering pauses at the end of the sentence; moving away resumes. A manual pause remains paused until you resume it.
- Controls close about **180 ms** after the pointer leaves. Move back to keep using them.

When a reference, abstract, or new selection popup overlaps the listening caption, the caption fades out and returns when the obstruction clears. With translations hidden, controls can still appear beneath the current source passage.

## Choose a language and voice

The current flag represents the translation target. Click it to toggle translated speech. Use the eye to show or hide the translation; double-clicking the flag also toggles visibility. Changing the target updates passage, selection, and abstract translation together.

When translated speech is enabled, the menu offers supported speech languages. A small portrait on the flag identifies the voice. US and UK English are separate; hover for other voices. Unsupported speech languages can still be translated, but do not offer an active translated voice.

Source and translated voice preferences are retained separately. Interface language changes labels, not the translation target.

## Follow a citation

<p align="center">
  <a href="images/references-en.png"><img src="images/references-en.png" alt="Paper details and abstract" width="876"></a>
</p>

Hover over a recognized numeric or author–year citation. Locate its occurrences, open a local attachment or DOI, or copy a formatted citation. Abstracts offer original, translated, and bilingual views without a listening action.

Add promising papers to **Read later** and return through the paper list without reopening the source PDF. Check title, authors, year, and DOI before saving to Zotero. Removing a reading-list entry does not delete an existing Zotero item.

## Work with difficult PDFs

Scans need OCR first. Columns, equations, tables, and unusual encoding can affect reading order and reference recognition. Try a smaller selection or look up the reference in the paper list. Full-text access still depends on your publisher or institutional permissions.

[Settings](SETTINGS.en.md) · [Authors](NETWORK.en.md) · [FAQ](FAQ.en.md)

## Discuss research

### Start from what you are reading

The assistant icon beside a selection or reading caption carries its source text, translation and page into chat. The main assistant tab links the current paper. Configure its model in main Settings. Opening chat sends nothing; Send submits your question, relevant paper excerpts and required conversation history.

### Follow the sources

You can follow up, stop generation, rename or delete conversations, and export Markdown. Literature research is available by default. After image support is confirmed in main Settings, the model can request PDF page images when needed. Page references navigate to the PDF. Hover over literature citations for the existing reference card, abstracts, abstract translation, saving and reading-list actions. Sources remain attached to saved conversations.

References within a paper can also open cards. For a phrase such as “ref. 28, Muhar et al. 2018”, Loom checks the number, author and year against that paper’s bibliography. Ambiguous numbers across papers, conflicting author–year details, and unavailable bibliographies remain plain text. Initial recognition needs the source PDF open; matched references are saved with the conversation for later use in history.

### Return to a conversation

Browse history by calendar. The outer arrows change the year, the inner arrows change the month, and the center shows the selected full date and returns to today when clicked. Darker days mean more questions. A conversation spanning several days appears on each day with questions. Open a conversation and return to the same date. Search matches conversation titles, linked papers and the last-question preview for each day. Rename, delete confirmation and export feedback stay within the selected record.

### Compare papers and keep useful answers

The assistant detects context automatically: PDF, selection and reading entry points use the current paper; library entry uses the 1–8 selected papers. Multiple selections enable comparison prompts without a scope switch. The assistant can retrieve indexed text, annotations and notes when needed, keeping excerpts and personal comments distinct. Missing full text remains an explicit gap.

Use the note icon beside an answer to preview it, choose a paper and save a child note with its sources. Saving the same answer again does not create another copy. Existing conversations retain their research context. Choose **New conversation** to detect the current selection again; earlier conversations remain in history.

A comparison question from a PDF can use multiple library selections when they include the current paper. Select up to eight papers. An existing conversation keeps its original papers; choose **New conversation** to work with a different selection.

Questions and answers have rounded borders, with sources and actions beneath each answer. For wider tables, choose 2× or 3× chat width on the Research assistant row in main Settings.
