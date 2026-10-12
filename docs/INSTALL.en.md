<h1 align="center">Installation &amp; updates</h1>

<p align="center"><a href="../README.en.md">Home</a> · <a href="INSTALL.md">简体中文</a></p>

## Install one XPI

Download the `.xpi` from [the latest release](https://github.com/JunyanKang/paper-loom/releases/latest). Keep it zipped. The Source code archive is for development.

In Zotero, open **Tools → Plugins**, choose the gear, then **Install Plugin From File**. A small book appears in the library toolbar and PDF reader. **Tools → Paper Loom** also opens Settings.

Declared compatibility covers Zotero 10.x from 10.0.5-beta.1 and 11.x. Beta releases may change host interfaces; include your full Zotero version in a bug report.

## Install offline voices

<p align="center">
  <a href="images/appearance-en.png"><img src="images/appearance-en.png" alt="Settings and speech installation" width="384"></a>
</p>

Find **Speech environment** near the bottom of Settings and click the wrench. Paper Loom selects a package for your system, verifies it, and generates a sample before activating the new engine. You can cancel. Retrying reuses completed, verified parts.

| Computer | Voice package |
| --- | --- |
| Apple Silicon Mac, macOS 14+ | About 494 MiB |
| Intel / AMD x64 Windows | About 482 MiB |
| Intel Mac, native Windows ARM, Linux | No automatic package yet |

Allow at least 3 GB free. The package includes the runtime and voices for English, Mandarin Chinese, Japanese, and French. No separate Python installation is needed. Translation, reference, and author features do not require voices.

## Check or repair voices

Click the shield to check the engine. It turns green on success, and the success message clears shortly afterward. If the check fails, the message remains; use the wrench to repair. The existing engine stays in place until its replacement passes the check.

## Update the plugin

Choose **Check** at the bottom of Settings. When a new release is found, the button changes to **Update**. Click it to download and install; progress appears in place of the version number until the new version is ready. This version does not schedule checks or install updates automatically. You can also install a newer XPI from Releases. Unchanged voice assets are reused.

## Move from the earlier plugins

Paper Loom can inherit settings from Paper Voice and Paper Nexus. If either remains active, follow the prompt to import settings and disable it. Existing papers and original settings are retained.

## Disable or remove

Use Zotero’s plugin manager. Downloaded voices and local reading records remain after removal. Back them up before following the cleanup steps in [Privacy](PRIVACY.en.md).
