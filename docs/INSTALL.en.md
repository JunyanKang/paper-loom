# Installation & updates

[Home](../README.en.md) · [简体中文](INSTALL.md)

## Install the plugin

Download the `.xpi` from [the latest release](https://github.com/JunyanKang/paper-loom/releases/latest). Do not unzip it or use the Source code archive as the plugin. In Zotero, open **Tools → Plugins → gear → Install Plugin From File…**. After installation, use the small book in the left toolbar or the Tools menu.

Requires Zotero 10.0.5-beta.1 or newer 10.x, or 11.x. Upgrade older Zotero installations first. Your existing papers, attachments, and unrelated plugins remain in place.

## Download offline voices

Open **Settings → Voices & engine** and select **Download engine & voices**. Paper Loom detects the system and processor: Apple Silicon Mac with macOS 14+ uses the Mac engine; Intel/AMD x64 Windows uses the Windows engine. The download includes all English, Mandarin Chinese, Japanese, and French voices.

![Voice settings](images/voices-en.png)

The download is about 494 MiB on Mac or 482 MiB on Windows. Allow at least 3 GB free. You can cancel, resume, or retry from this page. Paper Loom generates a sample to check the new engine before activating it. Use **Preview** to hear the selected language and voice.

Intel Mac, native Windows ARM, and Linux do not currently have matching automatic voice packages. References, translation, and author tools remain available. x64 emulation on Windows ARM is not a promise of native ARM support.

## Import an existing engine

Use the folder button on the voice page and select a compatible engine folder containing `worker.py`, `python`, and `models`. Follow the engine check. An MP3, WAV, or standalone model file is not an engine folder. Importing avoids another full download.

## Update or repair

Check for updates manually at the bottom of Settings, or schedule daily, weekly, or monthly checks. Zotero’s plugin settings control automatic installation. A plugin update does not require downloading unchanged voices again.

If audio fails, run **Check installed voices** first. Use **Resume / retry** for an interrupted download or **Download again / repair** for a repair. The current engine path changes only after the new engine passes its check.

## Existing settings and removal

If Paper Voice or Paper Nexus is still active, Paper Loom offers to import settings and disable the earlier plugin to avoid duplicate controls and audio. Original settings and papers are retained. You can import a previous translation configuration from Settings when available.

Disable or remove Paper Loom in Zotero’s plugin manager. Removing the plugin does not automatically delete its downloaded engines or local records. See [Privacy & data](PRIVACY.en.md) for cleanup locations.
