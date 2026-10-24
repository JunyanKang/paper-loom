<h1 align="center">Make it yours</h1>

<p align="center"><a href="../README.en.md">Home</a> · <a href="SETTINGS.md">简体中文</a></p>

<p align="center">
  <a href="images/appearance-en.png"><img src="images/appearance-en.png" alt="Paper Loom appearance and settings illustration" width="384"></a>
</p>

## Appearance and interface language

Theme previews remain expanded and run from light to dark. Below them are four global backgrounds and one custom slot. Click the empty slot to import a PNG, JPG, or WebP. The image is anchored to the bottom-right of the workspace; click its thumbnail again to remove it.

Use the slider to set transparency from 0–10%, keeping the surface readable. The interface supports Chinese, English, Japanese, French, and German. Changing it does not translate the paper or change the translation target. Book interactions are enabled at one-minute intervals and respect reduced-motion preferences.

Settings, the reading list, and the author network share one background canvas anchored at the bottom-right. Switching pages does not rescale the image.

## Shortcuts

The two-column table contains ten actions. Click a key binding, then press a new combination. Click again to cancel recording. The circular arrow restores defaults. Avoid combinations already used by your system or Zotero.

## Translation and citations

Choose a provider icon, translation font, size, position, and citation style. The font applies to passage and abstract translations. Cell, Nature, and Science lead the citation-style list; other entries follow by name.

For model translation, choose LLM and open the adjacent gear. Configure the provider, endpoint, model, and key in the popover, then test the connection. Model lists can be refreshed. Provider charges are separate from Paper Loom.

## E-utilities and voices

An NCBI API key is optional. Test it with the connection icon; success turns the icon green. Editing the key clears the previous success state.

Under **Speech environment**, the wrench installs or repairs voices and the shield checks them. A red wrench indicates missing or unhealthy voices. After recovery, the wrench returns to its normal color and the shield turns green. Success text clears after five seconds; failure text remains. Buttons stay in place when progress appears.

Speed, reading modes, repeat counts, language, and voice live in the reading controls. See the [User guide](GUIDE.en.md).

## Research assistant

Open Research assistant in the main settings. It uses the same provider picker, model fields and save/test controls as translation. The two configurations and credentials stay separate. Enable Vision only for a model that accepts images. Literature search needs no additional key; add a Brave Search API key for general web search.

There is no scope selector in chat. The entry point determines the paper or selected papers, and existing conversations keep their context. Start a new conversation after choosing a different paper or group.

**1×, 2× and 3×** on the Research assistant row set the chat width. The default 1× matches Settings; wider chats are capped to fit the current window. The choice is remembered without changing the Settings width.

The assistant’s optional Images field selects a model supporting the OpenAI-compatible Images API. It is separate from the chat model and shares the assistant provider endpoint and key. Translation settings stay independent. Leaving it blank prevents image-generation requests.

See [Model setup](ASSISTANT.en.md#model-setup) for configuration, vision and search details.

## At the bottom

**Check, Guide, Privacy, and Feedback** stay at the bottom. Check changes to Update when a release is available. During download and installation, a progress bar replaces the version number; completion restores the new version and Check action. Settings and the paper list share a height; scroll to reach content in smaller windows.
