<h1 align="center">Release notes</h1>

<p align="center"><a href="README.en.md">Home</a> · <a href="CHANGELOG.md">简体中文</a></p>


## 1.2.8 · 2026-10-25

Selection and reading entries show their source and page above the composer. Open the upward preview to review the original passage, translation and paper title. Reopening the same conversation keeps its passage; another entry supplies new context.

An always-visible attachment button accepts file selection, pasted images and drag-and-drop. Type Markdown or paste formatted text without opening a toolbar. Explicit drawing requests use the configured image model when sent, with no separate generation mode. Images remain in their message bubbles and can be enlarged or downloaded.

Notices survive progress refreshes, configuration failures retain drafts, and attachments are no longer cleared before successful message storage. Bilingual guides and current UI illustrations have been refreshed.

## 1.2.7 · 2026-10-24

Lighter conversations: long histories render on demand, completed responses reuse their DOM, and formatting previews run only when requested. Streaming avoids repeated scans; timed PDF caches no longer retain readers strongly.

Sources stay anchored when expanded, with external papers first and local pages grouped together. Questions and answers have distinct, subtle theme tints. Formatting tools add italics, lists, quotes, links and tables.

Images stay inside their message bubbles, with attachments, paste, thumbnails, enlargement and download. Configure an image model in main Settings to generate illustrations through a compatible Images API. Media is saved and removed with its conversation.

Paper reading, retrieval and response progress now appear inside the answer in small muted text. Activity folds when the answer finishes and can be reopened. English and Chinese guidance and privacy notes have been updated.

## 1.2.6 · 2026-10-24

The research assistant icon now appears when opening the panel in a new paper, without first selecting text.

Updating Paper Loom refreshes assistant styles in open documents, so the 1×, 2× and 3× chat widths work without restarting Zotero. Page closure and plugin shutdown release the associated style resources.

## 1.2.5 · 2026-10-24

Removes the assistant’s manual scope buttons and paper-count row. PDF and selection entry points use the current paper automatically; library entry uses the selected paper or papers and offers comparison prompts for multiple selections.

Existing conversations retain their research context when library selections change. New conversations detect context again, including after restoring a historical conversation.

References within a paper, including numbered author–year phrases, now open the shared paper cards and abstract translation. Matching checks both number and author–year details, avoids ambiguous cross-paper links, and retains resolved references in history. Existing page and search-source links remain available.

Refines Loom’s writing guidance toward direct scientific explanation, with citations and necessary qualifications beside the relevant claims. Updates the bilingual README, guide, settings, privacy and FAQ.

Answers gain rounded borders with sources and actions below. Main Settings adds 1×, 2× and 3× chat widths. The default matches Settings, wider layouts fit the viewport, and the choice persists.

## 1.2.4 · 2026-10-24

Pin 1–8 selected papers for a conversation and retrieve Zotero indexed text, annotations and notes as needed. Paper evidence stays distinct from personal comments, and conversation scope survives library selection changes. Identical page numbers in different PDFs retain distinct source identities.

Preview an answer and save it as a child note under a chosen paper, including tables and sources. Repeated clicks or saving again from history do not create duplicates. Standalone PDFs remain readable without becoming invalid note parents.

A more compact assistant layout places scope and paper count on one row, and sources and answer actions on another. Note previews omit the duplicate header. Tighter spacing accommodates Chinese, English and smaller windows.

Passage questions no longer scan the whole PDF first. Multi-paper retrieval uses the existing index on demand; item changes invalidate cached PDF context and shutdown releases listeners.

## 1.2.3 · 2026-10-24

Aligned the research and translation model settings: centered provider logos, shared label widths, aligned fields and trailing controls. Fixed the model picker squeezing out the model name, incorrect vision-toggle sizing, and layouts changing after opening the assistant. Provider choices open upward in two rows; model choices open downward. Chinese and English labels remain on one line.

## 1.2.2 · 2026-10-24

Names the research assistant Loom, with built-in guidance for paper reading, figure interpretation, evidence assessment and experimental design. Adds full-PDF keyword search and broader page coverage for cross-language questions.

Fixes Europe PMC date sorting corrupting search queries, recognizes matching preprint and journal versions, and supports Chinese citation brackets. Tool progress stays separate from the final answer. Research limits now lead to a synthesis step; busy services receive bounded, cancellable retries.

Fixes history-list jumps during editing and makes earlier questions from the same day searchable. Uses provider-specific request parameters for GLM and MiniMax. Answer accuracy and image support depend on the configured model.

## 1.2.1 · 2026-10-24

Fixed update checks failing after Zotero windows are closed or reopened. Update and installation deadlines no longer depend on the startup window.

Switching between the library and a PDF now shows only the active page’s floating icon. Library entry points share the same workspace instance.

Refined research assistant model settings with a compact provider icon menu, aligned fields and actions, and less explanatory clutter.

## 1.2.0 · 2026-10-24

Adds a research assistant accessible from selected text, reading captions and the main panel, with the current passage or paper as context. Supports streamed answers, cancellation, PDF page links and on-demand page images.

Configure the assistant in main Settings using the translation-style editor. Its model settings and credentials are stored separately. Zotero library search and Europe PMC / Crossref research are available by default; Brave web search is optional. Page images require an image-capable model.

Literature citations reuse the existing reference cards, including abstracts, translation, library saving, reading-list actions and citation copying.

Browse conversations by calendar, with darker days indicating more questions. Search across dates, rename, delete or export Markdown, then return to the same date or search results. Calendar spacing is tighter, the selected full date appears in the header, and editing and deletion controls remain anchored to their record.

Simplifies the composer and assistant settings, and fixes clipped footer actions and wrapped field labels. Conversations stay on this device; sending a question submits the required paper context to the configured model.

## 1.1.2 · 2026-10-13

Fixed inset abstracts and body passages being split into a new paragraph on every line. Paragraph translation and reading now use the complete paragraph without treating the left edge of headings or author metadata as the body margin.

Preserves genuine first-line indentation, paragraph spacing and cross-page continuation. Hanging indents no longer split after the first line, and sentence mode continues to select only the current sentence.

## 1.1.1 · 2026-10-13

Fixed translation failures when a figure caption is selected in sentence or paragraph mode. Explicitly selected captions can now be translated, while continuous narration retains its existing caption filtering.

When PDF text layout is unavailable, translation falls back to the selected text. Failed translations show the specific error and keep the retry action available.

## 1.1.0 · 2026-10-13

New installations without voices show a small, themed invitation. Accepting opens Speech environment and starts installation. Choosing Not now shows where to install later, with an option to highlight the wrench in Settings. Existing users and installations with voices are not prompted again.

Fixed PMC book references with compact author initials and a trailing year being absorbed into the preceding entry. Citations such as Mann 1928 now open their own reference cards. Two-author citations with dotted initials are also matched against the printed bibliography.

Author networks can reconcile omitted middle names when coauthor or other identity evidence supports the match. Two publisher-verified George Church ORCIDs now share one node, while source identifiers are preserved. Conflicting identities and unsupported name matches remain separate.

Settings now appear as soon as their embedded page is ready, avoiding a timeout delay when Zotero omits the initial load event.

## 1.0.23 · 2026-10-12

Every network level fits an elliptical layout to the available viewport. Child graphs and author details appear together. Navigation moves from the selected group into its network and returns to the original group position; selecting a leaf author updates details without rebuilding the graph. Counts reflect the current network, and repeated navigation reuses the existing layout.

Selection translations hide when their source text leaves the PDF viewport and return with the existing translation when it comes back into view. Theme and background previews now form one light-to-dark sequence, with the custom image slot last.

Reference parsing separates editorial recommendations from titles and handles dotted or hyphenated author initials and name suffixes. Wrapped DOIs stay separate from journal names, and compound hyphens are preserved. Citation recognition now uses coordinate-only links across pages and supports explicit references such as “ref. 126”.

## 1.0.22 · 2026-10-12

Panels stay open when you move from the floating book into their controls, including after clicking in a PDF. Controls remain usable during opening, and panel motion no longer scales or distorts text.

The author network gently unfolds on its first appearance. Entering a node brings the camera closer; going back restores the wider view. Reopening preserves the existing view, hidden graphs stop animating, and system reduced-motion preferences are respected.

Opening and closing panels no longer captures window screenshots or creates graphics textures. Hovering over the book no longer preloads the speech engine. Stale page listeners and graph search resources are released, with fewer layout reads and background repaints.

## 1.0.21 · 2026-10-12

Improve citation recognition for institutional authors, cross-page and mixed-column references, and undated preprints with a DOI. Keep publication months, page locators and wrapped DOI text out of article titles. Preserve distinct references by the same author in the same year instead of merging them.

Reference cards have a bounded height and single-line titles, with collection paths scrolling separately. Abstract popovers show the complete, centered article title above the abstract. Original, translated and bilingual views apply to both.

Reference and abstract popovers fade out when the PDF scrolls instead of moving with the page. Both use the same fade-and-retract dismissal.

## 1.0.20 · 2026-10-12

Fixed missing bibliography entries when reference indentation differs from the surrounding page, including numbered citation ranges and entries continuing onto the next page. Superscript citations after a punctuated year, such as `1961,¹`, are no longer excluded as mathematical powers.

Reference lists are prepared in small batches and displayed together. Switching between authors and references preserves existing text and scroll position without resizing the text during the transition. PDFs share completed author layouts while retaining independent view state.

Fit-to-view includes peripheral authors. An eye button shows or hides names. Hover over the book to open the workspace; moving away briefly closes it, and moving back cancels dismissal.

## 1.0.19 · 2026-10-12

Match the coauthor network window height to the reference list while preserving header control heights and spacing. Add an author-label toggle beside the zoom controls; the choice is saved for future visits.

## 1.0.18 · 2026-10-12

Normalize excessive transparency after loading saved settings, then persist the capped value so it stays consistent after restarting. Includes the Check/Update action and native installation progress from 1.0.17.

## 1.0.17 · 2026-10-12

Limit transparency to 0–10%, including existing saved values. The update action shows Check until a release is available, then Update. Download and installation progress appears in the version slot, which returns to the new version when installation finishes.

## 1.0.16 · 2026-10-12

Align the reference list and author network header spacing and control heights. Settings show the installed version between temporary update messages.

Use the brain-shaped AI icon for the LLM option in translation-service menus. The selected control still shows the configured provider logo.

## 1.0.15 · 2026-10-12

Use a consistent English interface on a fresh installation. Translate caption placement options as complete phrases in English, Japanese, French and German. Retain the bottom-right anchored workspace backgrounds from 1.0.14.

Model settings now use a compact layout, with a two-row provider logo menu above and model choices below. Refresh, save, save-and-test, and close are icon buttons along the bottom. A brain-shaped AI symbol identifies unconfigured LLM translation. The model settings button appears only when LLM translation is selected. Switching to another service also closes the model settings popover across open windows. Model settings use the available space in shorter windows without covering the footer. Documentation screenshots now display at their actual interface scale, with consistent headings and spacing across both languages.

## 1.0.14 · 2026-10-12

- Anchor settings, reading-list, and author-network backgrounds to the same bottom-right artwork canvas, without resizing the image when switching page widths.
- Apply the same rule to built-in themes, global backgrounds, and custom images.
- Update Windows regression checks for unified settings and remove obsolete tab-layout assertions.

## 1.0.13 · 2026-10-12

- Merged settings into one page with themes, shortcuts, translation, citations, and service maintenance. Update, Guide, Privacy, and Feedback stay at the bottom.
- Kept shortcut labels on one line across five languages and aligned font and size controls.
- Brought playback controls beside the source and translation, with speed choices, shared language and voice state, and prompt hover dismissal.
- Removed the separate listening workspace and abstract listening action. Paragraph playback defaults to one pass; selection requires a headphones click.
- Fixed citation hover, selection cleanup, overlap recovery, and multi-window shortcuts.
- Reduced repeated localization, dropdown synchronization, and layout reads. Coalesced search input and avoided rebuilding during IME composition.
- Added cleanup for timed-out network searches and bounded paint waits for background windows.
- Added green E-utilities success feedback and consistent voice check, repair, and cancellation states.
- Made updates manual and refreshed Chinese and English documentation with dark-theme illustrations.

Versions 1.0.7–1.0.12 were local iterations. Their changes are included here.

## 1.0.6 · 2026-10-12

- Synchronized translation and speech languages and improved hover controls, modes, and window state.
- Corrected popup dismissal and selection handling after playback starts.

Earlier entries below describe the interface at the time; later releases changed some controls.

## 1.0.4 · 2026-10-11

- Hover over a translation caption for an attached control row with sentence/paragraph navigation, pause/stop, all four modes, and the current flag. Other languages expand upward on hover.
- Hover over the selection card’s headphones button to choose one of four reading modes and start once. Dropdown edges remain intact, and expanded triggers stay transparent.
- Voice choices pair flags with individual portraits. Speech environment matches the adjacent status typography; repeat choices are 1, 2, 3, 5, 10, and ∞.
- Align controls across settings, listening, and references. Keep text and content still when returning to translation settings. Order themes from light to dark.
- Add synchronized flags and scope icons to selection translations, with headphones to start reading. Preserve full-text mode when reading from a selection.
- Offer only supported languages during spoken translation. Collapse unsupported choices from the top while keeping the quick bar and its background aligned.
- Match navigation, voice actions, and network guidance to the interface language; remove provider tooltips from translated captions.

## 1.0.3 · 2026-10-10

- Keep all theme previews expanded without printed labels. Add four global backgrounds and a custom card for importing, previewing, and removing an image.
- Centre custom backgrounds in each window and preserve imported image proportions. Consolidate shared appearance controls.
- Remove checkmarks from every dropdown; selected rows use a background highlight.
- Fix companion preview from settings and replace its text with an icon that cycles through eight performances.

- Keep offline voice actions below the heading, with progress and status underneath and matching repair/check icons. Checks can be cancelled; success clears after five seconds and failure keeps a repair prompt. Remove duplicate location and platform labels.
- Regroup reading and translation settings and align font menus. Remove redundant listening footer controls and use an icon for restoring defaults.
- Expand the companion canvas and preserve limbs across sprite boundaries. Prevent window animations from capturing and warping underlying PDF text.

## 1.0.2 · 2026-10-10

- Reading defaults to English; voice names use language, gender, and number. Tencent translation uses the full-color QQ penguin.
- Remove extra content outlines and fills, keeping a lower edge connected to the selected navigation tab.

- Settings categories share a fixed height and consistent row spacing. Appearance moves to the last tab and includes update options. Model configuration opens below its gear without replacing the current page.
- Bottom navigation stays in place with the active tab connected to its page. Artwork in listening, references, and settings stays anchored at the bottom left. Citation styles use a compact right-aligned menu with Cell, Nature, and Science first, followed by alphabetical entries.
- Listening, references, and settings now share a width and type scale; flags and provider logos use aligned compact menus, and workspace switching no longer fades through transparency.
- Restore hover navigation, add four icon-only mode choices and direct language selection, and keep translation controls visible when disabled.
- Group pause and stop under one control; hide scrollbars and align translated tabs, buttons, and settings rows.
- Softer theme tints for selected tabs and primary actions in both light and dark themes.
- An icon-only headphones button starts or resumes listening and changes to pause during playback, with accessible labels and tooltips.
- Direct animated transitions between listening, papers, authors, and settings. Click elsewhere in Zotero or the PDF to collapse the workspace.
- All four workspaces use the same curved motion back into the book, with synchronized opening and closing gestures.
- Fix overflowing mode labels and interrupted gestures from out-of-range animation frames.

## 1.0.1 · 2026-10-10

- Fix API key import, saving, and removal in Zotero 11 while preserving existing settings.
- Bring PDF navigation into the floating book, opening the listening window directly with compact upper-right icons for papers, authors, and settings, sharing the same icon controls across all four windows and improving typography and spacing.
- Keep panel states independent per document; opening settings or references collapses listening controls without stopping playback.
- Improve import dialog wrapping and button layout; use Paper Loom consistently throughout the product.
- Newly illustrated feature gestures, distinct forward/backward page turns, and window gestures with a steady mascot centre and shared bottom-right panel alignment.
- Abstract listening uses the shared headphones icon with bilingual labels and keyboard access.

- Distinct selected-tab backgrounds across all themes; remove the full-height seam from the linen artwork.
- Fix the library workspace and feature switching when no PDF is open.

## 1.0.0 · 2026-10-10

First public release of Paper Loom.

- Four PDF listening modes, local multilingual voices, translation comparison, and compact floating controls.
- Citation previews, abstracts with listening, reading lists, and formatted citation copying.
- Local author networks and public ORCID career timelines.
- A shared settings center for reading, translation, appearance, voices, and shortcuts.
- One XPI, in-plugin voice downloads selected for the current platform, resumable downloads, and plugin updates.
- Library entry in the left toolbar and automatic floating-book attachment in PDF readers.
