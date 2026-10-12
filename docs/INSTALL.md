<h1 align="center">安装与更新</h1>

<p align="center"><a href="../README.md">首页</a> · <a href="INSTALL.en.md">English</a></p>

## 安装一个 XPI

从[最新版本](https://github.com/JunyanKang/paper-loom/releases/latest)下载以 `.xpi` 结尾的文件。它就是插件，不必解压；Source code 压缩包用于开发。

在 Zotero 中打开 **工具 → 插件**，点齿轮，选择 **从文件安装插件**。安装后，文献库工具栏和 PDF 阅读器里会出现小书。也可以从 **工具 → Paper Loom** 打开设置。

插件声明支持 Zotero 10.0.5-beta.1 起的 10.x 与 11.x。测试版宿主可能改变接口；遇到问题请在反馈中写明完整版本。

## 安装离线声音

<p align="center">
  <a href="images/appearance-zh.png"><img src="images/appearance-zh.png" alt="声音安装与设置所在页面" width="396"></a>
</p>

在设置下方找到 **发音环境**，点击扳手。插件按系统选择声音包，下载后进行校验和一次实际合成，再启用新引擎。过程中可以取消；重试会复用已完成且校验通过的分片。

| 电脑 | 声音包 |
| --- | --- |
| Apple Silicon Mac，macOS 14+ | 约 494 MiB |
| Intel / AMD x64 Windows | 约 482 MiB |
| Intel Mac、原生 Windows ARM、Linux | 暂无自动声音包 |

建议预留至少 3 GB 空间。包内提供英语、普通话、日语和法语的运行环境与声音，无需手动安装 Python。无需朗读时，可以先使用翻译、文献和作者功能。

## 检查与修复

点盾牌检查声音。通过时盾牌为绿色，成功提示稍后消失；失败时保留提示，点扳手修复。修复完成前保留当前引擎，新的声音通过检查后才启用。

## 更新插件

点设置底部的 **更新** 检查新版本，按界面提示安装。当前版本不定期检查，也不自动安装。也可在发布页下载新 XPI，覆盖安装。未变化的声音包不需重新下载。

## 从旧插件迁移

Paper Loom 可以继承 Paper Voice 与 Paper Nexus 的配置。如果旧插件仍在运行，按提示导入并停用，避免重复入口。原有文献和旧配置保留。

## 停用或移除

在 Zotero 插件管理器中停用或移除。声音和本地阅读记录不会自动删除；如需彻底清理，请先备份，再按[隐私说明](PRIVACY.md)处理。
