# 参与开发

[首页](README.md) · [English](CONTRIBUTING.en.md)

欢迎在 [Issues](https://github.com/JunyanKang/paper-loom/issues) 提交可复现问题或改进建议。请提供系统、架构、Zotero 与 Paper Loom 版本、操作步骤和预期行为，仅分享不含隐私的样本。

## 构建

需要 Node.js 20+ 和 Python 3.10+。无需安装 npm 依赖。

```sh
npm test
npm run build
npm run verify
```

XPI 与校验文件生成在 `dist/`。开发时将 XPI 安装到独立 Zotero 配置中，不要使用唯一的个人文献库副本测试。

`addon/shared` 负责产品入口、共享设置和声音管理；`addon/voice` 负责声音与 PDF 阅读；`addon/references` 负责引文、作者和履历；`addon/catalogs` 固定下载资源。项目可独立构建，不依赖同级项目。

## 界面规则

统一规则放在 `addon/shared/design.js`，嵌入式设置页面也使用同一份样式。控件采用系统界面字体，用户选择的阅读字体只影响译文和文献正文。字号分为窗口标题 17 px、设置与控件 13 px、辅助信息 12 px；标签字重 400，标题字重 600。

听读、文献列表和设置共用 360 px 宽度、20 px 内容边距和右下角锚点。设置行最小高度 38 px，允许随译文增高；组合控件较长时放到第二行。隐藏滚动条但保留滚动。语言和服务菜单采用 24 px 图标、48 px 单列，与入口图标中心对齐；浅色背景表示选中，国旗只保留无障碍名称，服务商保留悬停提示和无障碍名称。窗口间切换保持不透明，只有唤出和收起使用回到悬浮图标的动画。

## 文档与发布

中英文文档应同步更新，截图必须来自当前产品并与文档语言一致；示例数据需标明。使用 `python3 scripts/check_docs.py` 检查本地链接（需要 `markdown2`）。

发布时使用不可变的版本化 XPI。`scripts/release_metadata.py` 生成包含 SHA-512 校验的 Zotero 更新清单；先上传安装包，再部署更新清单。自动流程检查安装包，原生检查使用独立配置；编译成功不等于声音与界面已验证。

不要提交个人配置、文献库、API 密钥、已下载引擎、生成缓存或诊断日志。
