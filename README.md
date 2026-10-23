<p align="center">
  <a href="docs/images/hero-zh.png"><img src="docs/images/hero-zh.png" alt="Paper Loom：让论文读得下去" width="768"></a>
</p>

<p align="center"><a href="https://github.com/JunyanKang/paper-loom/releases/latest"><strong>下载 Paper Loom</strong></a> · <a href="docs/INSTALL.md">安装指南</a> · <a href="README.en.md">English</a> · <a href="https://github.com/JunyanKang/paper-loom/issues">反馈</a></p>

读到难懂的一段，听一遍。遇到关键引文，就地看摘要。想继续追下去，先放进稍后读。

**Paper Loom 是 Zotero 里的听读与文献探索插件。** 它把离线朗读、对照翻译、引文预览和作者合作网络放进同一个阅读流程，无需来回切换应用。

科研助手现已加入：结合当前论文、划选内容与可追溯的文献来源继续追问，按日期找回对话。模型和可选网页搜索在总设置中独立配置。[使用指南](docs/GUIDE.md)

## 从这一段开始

<p align="center">
  <a href="docs/images/caption-controls-zh.png"><img src="docs/images/caption-controls-zh.png" alt="译文与两行听读控制栏" width="493"></a>
</p>

选择单句、划选、段落或全文，按自己的节奏听。默认读一遍，难句可以重复，语速从 0.5× 到 2×。鼠标移入当前原文、译文或控制栏，读完这一句后暂停；移开后继续。

声音在本机合成。安装声音包后，英语、普通话、日语和法语可离线朗读，共 14 个音色，英语区分美音与英音。翻译可以显示在原文旁，也可以切换为朗读译文。

## 顺着引文，把问题追下去

<p align="center">
  <a href="docs/images/references-zh.png"><img src="docs/images/references-zh.png" alt="引文详情与摘要" width="876"></a>
</p>

悬停可识别的正文引文，查看论文信息和摘要。打开本地附件或 DOI，复制指定格式的引用，把值得细读的论文放进稍后读。摘要支持原文、译文和双语对照，翻译语种与正文共用。

引文识别依赖 PDF 的文字结构，复杂排版和扫描件可能需要手动查找。在线来源没有摘要时，界面会保留缺失状态。

## 看见文献背后的作者

<p align="center">
  <a href="docs/images/network-zh.png"><img src="docs/images/network-zh.png" alt="从本地文献建立的作者网络" width="784"></a>
</p>

从自己的 Zotero 文献库出发，查看谁与谁共同署名、合作过哪些论文。聚焦一个作者，再打开其公开 ORCID 履历，继续了解教育、任职和作品。

图中网络使用演示文献库。实际网络取决于你的收藏与书目信息；同名作者需要结合论文和 ORCID 确认。

## 装好，就在 Zotero 里用

1. 在[发布页](https://github.com/JunyanKang/paper-loom/releases/latest)下载 **`.xpi`**，不要解压。
2. Zotero → **工具 → 插件 → 齿轮 → 从文件安装插件**。
3. 点击小书打开设置。在**发音环境**一行点扳手安装声音，盾牌用于检查。
4. 打开可选中文字的 PDF，划选一段，点击耳麦开始。单纯划选不会自动播放。

文献、翻译和作者功能不需要下载声音。声音包内含运行环境，无需自己安装 Python。

| 运行条件 | 说明 |
| --- | --- |
| Zotero | 插件声明兼容 10.0.5-beta.1 起的 10.x 与 11.x；测试版的变化可能影响功能 |
| Mac 声音包 | Apple Silicon，macOS 14+，约 494 MiB |
| Windows 声音包 | Intel / AMD x64，约 482 MiB |
| 其他平台 | 暂无自动声音包 |
| 可用空间 | 建议至少 3 GB，用于下载、解压和修复 |

[详细安装步骤 →](docs/INSTALL.md)

## 留下适合你的阅读界面

<p align="center">
  <a href="docs/images/appearance-zh.png"><img src="docs/images/appearance-zh.png" alt="统一设置页" width="384"></a>
</p>

主题、透明度、界面语言、快捷键、译文字体与引用格式集中在一页。支持自定义背景和自己的模型翻译服务。更新、指南、隐私与反馈固定在窗口底部。

## 数据留在哪里

语音合成和 PDF 文本处理在本机完成。翻译会把文字发送给你选择的服务，在线书目与作者查询会发送相应的查询信息。Paper Loom 不要求注册账号，也不添加遥测或使用统计。详见[隐私与数据](docs/PRIVACY.md)。

## 继续了解

[使用指南](docs/GUIDE.md) · [设置](docs/SETTINGS.md) · [作者与履历](docs/NETWORK.md) · [常见问题](docs/FAQ.md) · [更新记录](CHANGELOG.md)

开源代码采用 [MIT 许可](LICENSE)。欢迎[反馈问题](https://github.com/JunyanKang/paper-loom/issues)或[参与开发](CONTRIBUTING.md)；声音依赖与第三方资源适用[各自的许可](NOTICE.md)。
