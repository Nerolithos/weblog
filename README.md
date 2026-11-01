<h1 align="center">Lithos' Blog @ CUHKSZ</h1>

<h3 align="center">Alive knowledge base, course notebook, and interactive project hub.</h3>

<p align="center">
  <a href="https://blog.nero-lithos.com/"><img alt="Website status" src="https://img.shields.io/website?down_message=offline&amp;label=blog&amp;style=flat-square&amp;up_message=online&amp;url=https%3A%2F%2Fblog.nero-lithos.com"></a>
  <a href="https://gohugo.io/"><img alt="Hugo 0.134.1" src="https://img.shields.io/badge/Hugo-0.134.1-ff4088?style=flat-square&amp;logo=hugo&amp;logoColor=white"></a>
  <a href="https://pages.cloudflare.com/"><img alt="Cloudflare Pages" src="https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&amp;logo=cloudflare&amp;logoColor=white"></a>
  <a href="https://github.com/Nerolithos/weblog/commits/main"><img alt="Since Sept. 11, 2024" src="https://img.shields.io/badge/since-Sept._11%2C_2024-475569?style=flat-square"></a>
  <a href="https://www.markdownguide.org/"><img alt="Markdown" src="https://img.shields.io/badge/Markdown-000000?style=flat-square&amp;logo=markdown&amp;logoColor=white"></a>
  <a href="https://blog.nero-lithos.com/"><img alt="80+ articles" src="https://img.shields.io/badge/content-80%2B_articles-2563eb?style=flat-square"></a>
</p>



<p align="center">
  <a href="#简体中文"><strong>简体中文</strong></a> ·
  <a href="#english"><strong>English</strong></a> ·
  <a href="https://blog.nero-lithos.com/"><strong>进入博客 / Visit</strong></a> ·
  <a href="https://blog.nero-lithos.com/?view=cloud"><strong>主题图谱 / Topic Map</strong></a>
</p>

<p align="center"><sub>Hugo · CUHKSZ · Computer Science Notes · Digital Garden · Data Visualization · Interactive Web · Personal Portfolio</sub></p>

[![Lithos' Blog — CUHKSZ notes, projects and digital garden](https://img.nero-lithos.com/posts/%E6%88%AA%E5%B1%8F2026-11-01%2021.48.50.png)](https://blog.nero-lithos.com/)

---

## 简体中文

> [!NOTE]
> 这不是一个等待填充内容的博客模板，而是已经长期运行的个人知识系统。仓库同时承载 **80+ 篇文章、课程资料、交互式可视化、小游戏、3D 实验和校园工具**；内容以 CUHKSZ 为起点，但并不止于校园。

### Overview

面向香港中文大学（深圳）学生、计算机学习者和偶然路过的好奇读者。它把散落的课堂笔记、考试复习、开发记录、个人项目与跨学科兴趣组织到同一个可搜索的网站中。

这里主要包含：

- **课程与知识笔记**：CSC1003、CSC3001、CSC3060、CSC3150、CSC3200、CSC4120、DDA3003、MAT3007，以及物理、化学、生物和材料学内容。
- **校园信息**：从新生 FAQ、学院选择到课程资源整理的[《龙大生存指南》](https://blog.nero-lithos.com/posts/lgu/)。
- **交互式项目**：[CUHKSZ 选课 AI](https://blog.nero-lithos.com/courseai/)、[元素周期表](https://blog.nero-lithos.com/chem/)、[Mineral Wall](https://blog.nero-lithos.com/minerals/)、[DDA 能源可视化](https://blog.nero-lithos.com/DDA/)、[历史上的今天](https://blog.nero-lithos.com/posts/history-today/)…
- **游戏与创作实验**：[计算机解谜游戏](https://blog.nero-lithos.com/pet/)、[微恐 3D 解谜游戏](https://bar.nero-lithos.com/)、[二创/接稿](https://p.nero-lithos.com/)、可视化与其他独立项目。
- **随笔与经验**：实习、旅行、开源实践、技术踩坑，以及一些不太适合被课程编号框住的思考。

> **整合资源，开源共享，跨界交友。**

### 从哪里开始？

| 如果你想…… | 推荐入口 |
| --- | --- |
| 浏览最新文章与全部内容 | [博客主页](https://blog.nero-lithos.com/) |
| 按领域探索内容关系 | [Topic Map 主题图谱](https://blog.nero-lithos.com/?view=cloud) |
| 查找 CUHKSZ 新生与校园信息 | [龙大生存指南](https://blog.nero-lithos.com/posts/lgu/) |
| 阅读课程讲解、考卷与作业分析 | [课程分类](https://blog.nero-lithos.com/categories/) |
| 查询课程与 Blackboard 课程编号 | [CUHKSZ 选课 AI](https://blog.nero-lithos.com/courseai/) |
| 玩一个有点奇怪的解谜游戏 | [ArkPets](https://blog.nero-lithos.com/pet/) |
| 看今天在历史上发生了什么 | [历史上的今天](https://blog.nero-lithos.com/posts/history-today/) |

### 特殊的博客…不止是博客

- **本地搜索优先**：搜索页使用精确逐词匹配与 BM25 排序；主页提供即时预览，结果可跳转到对应段落并高亮关键词。
- **多种阅读视图**：默认文章流、时间线、分类浏览和主题知识图谱可以直接切换。
- **静态站点里的动态体验**：包含 Go/WASM 课程编号检索、D3 数据可视化、3D/GLB 场景、互动元素周期表和独立小游戏。
- **内容与项目共用一个入口**：文章、实验、工具和外部作品通过 Hugo 内容层统一呈现。
- **自动化维护**：`sync.sh` 用于半自动同步；GitHub Actions 每日触发“历史上的今天”重建；Cloudflare 提供站点托管与分发。
- **阅读辅助**：深浅色模式、目录、KaTeX、评论区、移动端适配，以及可展开的快捷工具坞。

### 技术结构

```text
Markdown / data / project assets
              │
              ▼
        Hugo 0.134.1
     content + layouts + shortcodes
              │
              ├── JSON search index → exact matching + BM25 ranking
              ├── static apps       → D3 / WebGL / Go WASM / games
              └── GitHub Actions    → scheduled rebuild
              │
              ▼
        Cloudflare Pages
```

| 路径 | 用途 |
| --- | --- |
| `content/posts/` | Markdown 正文、课程笔记与项目入口 |
| `layouts/` | Hugo 页面、SEO、搜索索引、短代码和主页视图 |
| `static/` | 样式、脚本、图片、模型及独立交互应用 |
| `data/` | 构建时使用的结构化数据 |
| `functions/` | Cloudflare Functions / API 端点 |
| `tools/` | 图片迁移、课程搜索等维护工具 |
| `.github/workflows/` | 定时构建与仓库自动化 |

### 仓库定位

本仓库公开记录网站的内容组织、交互实现与长期演进，但它包含个人化的发布流程、数据和素材，并不作为通用 Hugo 模板或本地部署教程维护。读者请优先访问[线上博客](https://blog.nero-lithos.com/)；开发者可以参考其中的搜索、可视化与静态应用集成思路。

### 参与和引用

这是个人站点而不是通用 Hugo 主题，但欢迎通过 [Issues](https://github.com/Nerolithos/weblog/issues) 报告失效链接、内容错误、移动端问题或提出功能建议。小型修复也可以直接提交 Pull Request。

若资料帮助到了你，欢迎在引用文章时保留原文链接；大段转载、课程资料再分发或素材复用，请先联系作者确认授权范围。

---

## English

> [!NOTE]
> This is not an empty Hugo starter. It is the source of a mature, continuously maintained personal knowledge system containing **80+ articles, course notes, interactive visualizations, small games, 3D experiments, and campus tools**.

### Overview

**Lithos' Blog** is a digital garden and project gateway built around CUHKSZ life, computer science, and interdisciplinary exploration. It brings lecture notes, exam reviews, engineering write-ups, standalone web experiments, and personal essays into one searchable site.

The repository covers:

- **Computer science notes** — programming, discrete mathematics, computer systems, operating systems, data structures, algorithms, optimization, and visualization.
- **CUHKSZ resources** — the [Survival Handbook](https://blog.nero-lithos.com/posts/lgu/), course guides, revision material, and a [course assistant](https://blog.nero-lithos.com/courseai/).
- **Interactive work** — an [element explorer](https://blog.nero-lithos.com/chem/), [mineral collection](https://blog.nero-lithos.com/minerals/), [energy visualization](https://blog.nero-lithos.com/DDA/), Go/WASM lookup tools, and WebGL scenes.
- **Games and creative projects** — [ArkPets](https://blog.nero-lithos.com/pet/), a [3D modeling lab](https://blog.nero-lithos.com/room-3d/), illustrations, and experimental microsites.
- **Writing beyond coursework** — internships, travel, open-source practice, technical postmortems, and essays.

### Highlights

- **Search that respects intent:** exact token matching filters the corpus before BM25 ranking; matching paragraphs are linked and highlighted.
- **Four ways to browse:** recent posts, timeline, categories, and a topic map that groups related concepts.
- **More than Markdown:** the same site ships D3 visualizations, WebGL/GLB experiences, Go/WASM search, interactive chemistry, and browser games.
- **Automated maintenance:** local publishing helpers, a scheduled GitHub Actions rebuild, and Cloudflare delivery.
- **Reader-friendly:** responsive layouts, dark mode, table of contents, KaTeX, comments, and an expandable utility dock.

### Repository scope

This public repository documents the site's content model, interactive implementation, and continued evolution. It also contains personal publishing workflows, data, and media assets, so it is not maintained as a reusable Hugo starter or a local-deployment guide. Please use the [live site](https://blog.nero-lithos.com/) as the primary reading experience; developers are welcome to study its search, visualization, and static-app integration patterns.

### Explore

[Live site](https://blog.nero-lithos.com/) · [Topic map](https://blog.nero-lithos.com/?view=cloud) · [CUHKSZ Survival Handbook](https://blog.nero-lithos.com/posts/lgu/) · [Course AI](https://blog.nero-lithos.com/courseai/) · [History Today](https://blog.nero-lithos.com/posts/history-today/)

Issues and focused pull requests are welcome. If you reuse substantial written material or media assets, please retain attribution and contact the author to confirm permission.

---

<p align="center">
  Built with <a href="https://gohugo.io/">Hugo</a> ·
  hosted on <a href="https://www.cloudflare.com/">Cloudflare</a> ·
  maintained by <a href="https://github.com/Nerolithos">Lithos</a>
  <br><br>
  <strong>Learn in public. Build across boundaries. Keep the useful parts searchable.</strong>
</p>
