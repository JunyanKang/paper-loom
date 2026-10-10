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

## 文档与发布

中英文文档应同步更新，截图必须来自当前产品并与文档语言一致；示例数据需标明。使用 `python3 scripts/check_docs.py` 检查本地链接（需要 `markdown2`）。

发布时使用不可变的版本化 XPI。`scripts/release_metadata.py` 生成包含 SHA-512 校验的 Zotero 更新清单；先上传安装包，再部署更新清单。自动流程检查安装包，原生检查使用独立配置；编译成功不等于声音与界面已验证。

不要提交个人配置、文献库、API 密钥、已下载引擎、生成缓存或诊断日志。
