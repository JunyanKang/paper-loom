# FAQ

[Home](../README.en.md) · [简体中文](FAQ.md)

## I cannot see the book

Check that the plugin is enabled and your Zotero version is supported. The library entry is in the left toolbar; **Tools → Paper Loom** also opens it. The floating book should appear at the lower right in a PDF. Switch back to the PDF or reopen the attachment. Include your Zotero version and a screenshot when reporting a problem.

## A download stopped or is slow

GitHub hosts the plugin and voice files, so speed depends on your network. Retry to reuse completed parts; no separate installer is needed. Check free disk space and whether a proxy or firewall blocks GitHub downloads.

## The engine is installed but I hear nothing

Run **Check installed voices**, then preview a voice. Check the system output device, volume, and Bluetooth connection. The first engine startup may take a moment. If the engine folder is unavailable, import the correct folder again or repair the download.

## A language or pronunciation is wrong

Check that the reading language matches the passage, then choose and preview a voice. Technical abbreviations and equations may not be pronounced as a human reader would. All 14 voices use local speech synthesis; they are not human recordings.

## Scanned pages, tables, or columns read incorrectly

Check that text can be selected; OCR scanned PDFs first. Complex layouts can affect extraction order. Try selection, sentence, or paragraph mode. Use a publicly shareable PDF when reporting a reproducible issue.

## A citation is not recognized or has no abstract

PDF encoding, layout, and citation style can affect recognition. Open the reference panel and confirm the paper by DOI or title. Metadata providers do not always supply abstracts; missing fields are not replaced by invented content.

## Translation fails

Check connectivity, target language, and provider. Built-in services may rate-limit requests; retry later or switch services. Model endpoints require the correct URL, model, and key, and may incur provider charges. Use the connection test to verify settings.

## The author network is small or mixes identical names

The basic graph uses your current Zotero library, not all papers online. Complete author, date, and DOI fields to improve matching. Check papers and ORCID to distinguish people; identical names do not establish identity.

## Where can I report a problem?

Use [GitHub Issues](https://github.com/JunyanKang/paper-loom/issues). Include Paper Loom/Zotero versions, OS and architecture, steps, and expected behavior. Remove API keys and private library information from screenshots and logs.
