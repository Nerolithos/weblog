---
title: "🛠️ GitHub Action Bot 自动化管理仓库入门"
date: 2026-04-07T11:30:34+08:00
draft: false
summary: "从我的《历史上的今天》项目，分享 CS Amateur/Enthusiast 大学生如何初步利用 Action Bot 自动化远端仓库，以及需要当心的坑。"
categories: 
- 帮助
tags: 
- 技术
featured_image: "/images/gab.jpg"
---





[“历史上的今天”](https://blog.nero-lithos.com/posts/history-today/) ，就是一套最简单的自动化脚本，不需要每天手动做任何事：

- Python 脚本每天去公共 API 拉数据；
- Hugo Anake 在构建时把这些数据渲染进页面；
- GitHub Actions Bot 按定时任务跑脚本 + 触发 Cloudflare 重建整站；

⚠️ 注意：

1. 不要把密钥暴露到前端。
2. 用 .gitignore 和工作流设计避免把自动生成的文件塞爆 Git 历史。
3. 如果你使用 API (比如大模型服务)，最好在 Cloudflare 中为你的域增加一条安全规则，类型为托管质询



</br>

# 项目架构

1. 目标：博客上有一个“历史上的今天”页面，每天自动显示当天的历史事件。整个流程全自动：电脑关机，服务器也照样每天更新。

2. 技术栈

- 静态网站 (部署：GitHub 仓库 → Cloudflare Pages 自动构建)；
- 数据：Wikipedia On This Day 官方 JSON API (不用爬 HTML)；
- 后台：GitHub Actions 定时任务。

3. 关键组件

- 数据抓取 Python 脚本遍历全年日期，从 Wikipedia API 拿历史事件,生成 JSON 文件。
- Hugo 集成 (HTML Shortcode)：构建时 `readFile` + `transform.Unmarshal` 读取 JSON；用 `now.Format "01-02"`（UTC）作为 key 选出当天事件；渲染详情页列表 + 首页摘要；页面入口用 md 模板 (front matter 定义标题、封面图等)；正文调用 `history_today`。
- 自动化：工作流 (yml)、`on.schedule` 每天多个时间点触发；拉代码 + 拉主题子模块；

</br>

</br>

# 坑 & 困难

## 数据源

现象：如果你想抓的是 onthisday.com 的 HTML，靠 CSS Selector 找 DOM。网站一改版，DOM 结构变了，脚本还在跑，但抓到的全是空数组，悄悄写到了 JSON 里，前端就啥也没有。

方案：如果换成 Wikipedia On This Day JSON API，就可以明确返回结构，字段稳定，不依赖页面结构，不容易被微调 HTML 搞炸。

#### Takeaways

- 能用 API 就不爬 HTML；

- 要检测 ”抓不到数据“，此时应当**抛错并停止**，而不要默默输出全是 `[]` (空) 的 JSON。

</br>

## 时间和时区

现象：Hugo 的 `now` 和 GitHub Actions 的 schedule 都默认用 **UTC** 时区。在北京时间凌晨跑任务时，`now` 可能还是昨天的 UTC 日期。导致看似合理的代码跑出来页面实际上每天在更新显示的是 “昨天的历史”。

方案：调整 cron 时间，避开本地日期刚翻日但 UTC 还没翻日的混淆时间段。例如每天 UTC + 1/2 点跑 (对应北京时间 8/9/10 点)，此时 UTC 和北京都已经是 “新的一天”。

#### Takeaways

- 想按本地时区 (比如 `Asia/Shanghai`) 来算“今天”，要么调整 cron 时间，或者在脚本中显式按本地时区计算 dates；
- 尽量多写几次任务作为缓冲，防止 Bot 时不时的网络/繁忙失败。你可能会观察到 Action Bot 经常不在你要求的整点运行，会有不定的延迟。总之定时任务最好**日内多次触发**，而不是指望一次成功：

```yaml
on:
  schedule:
    - cron: "0 0,1,2 * * *"
```

- 对于 Git Action，在 UTC + 0 跑自动脚本依旧是 ”昨天“。

</br>

## 构建链路

现象：Localhost 能构建，CI 上却报错 ”主题 partial 找不到“ (因为主题是 Git submodule，CI 没拉子模块)，这是 Hugo 的经典问题 —— Hugo 的某些旧字段 (如 `.Site.DisqusShortname`) 被弃用，新版本报错。

方案：

- 在 Actions 里 checkout 时开启子模块：
  ```yaml
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0
      submodules: recursive
  ```
- 更新模板用法，以适配新版本 Hugo：例如把 `.Site.DisqusShortname` 改为 `.Site.Config.Services.Disqus.Shortname`。

#### Takeaways

- “本地能跑、CI 挂了”时，先检查：主题 / 子模块有没有被拉；Hugo 版本有没有升级导致 API 改名；`HUGO_ENV`、环境变量等。

</br>

## Git 历史污染

> Action Bot 也属于仓库贡献者，也会与你的本地产生冲突，不管人和机器人，都别反复 `add` 不必要内容。

现象：如果工作流里直接 `git add ... public` 所有自动生成的文件，结果就是 `hugo` 每次构建都会生成或微调 public 下大量 HTML，特别是 `public/posts/` (所有的博客)。导致**每天都生成一大堆无关的 diff** (HTML 时间戳、序号等)，Git 历史被不必要更新污染，导致本地和远端的 Conflict。

方案：

- **不再提交任何构建产物**，改工作流为：依旧可以先跑 `hugo --config hugo.toml` 做构建检查，但不 `git add`；然后使用以下空提交，只为触发 Cloudflare 重跑构建，但不会修改任何文件：

```bash
git commit --allow-empty -m "chore: daily history-today rebuild trigger"
git push
```

- 并配合 `.gitignore`，防止本地或别的脚本不小心把这些生成物加进 Git：
  ```gitignore
  /public/
  /.history-today-build-stamp
  ```

#### Takeaways

- **仓库只保存“源代码”和“真实源数据”，不保存“构建结果”**。
- 静态网站构建目录（如 public、`dist/`）几乎总应该被 gitignore。

</br>

</br>

# GitHub Actions Bot 可复用模板

> 针对 “大学初级程序员” 的分步教程：你可以用在RSS 抓取、自动翻译、定期备份等任意自动化任务上。

### Step 1：脚本

- 语言随意：Python / Node / Go / Shell 都行，这里以 Python 举例。
- 输入：从环境变量或配置读取参数 (例如 API key、日期范围)；输出：生成数据文件，或者修改某些源文件；可以在本地命令行直接运行并观察效果。

```python
# 脚本骨架伪代码
import os
from datetime import datetime

def main():
    # 从环境变量读取密钥（如果需要）
    api_key = os.environ.get("MY_API_KEY")
    if not api_key:
        raise RuntimeError("Missing MY_API_KEY")

    today = datetime.utcnow().date()
    # ... 调第三方 API ...
    # ... 生成 JSON 或 Markdown 文件 ...

if __name__ == "__main__":
    main()
```

**注意不要大大方方的在脚本里硬编码密钥，全部走环境变量 (后端)。**

</br>

### Step 2：本地把脚本和站点集成好

以我们的项目为例：把脚本生成的数据放到 `static/xxx.json`；Hugo 用 shortcode 或 partial 在构建时读入这个 JSON；

本地执行并检查：

- 确认脚本是**幂等的**：多跑几次结果一样 (或只会覆盖旧数据)。
- 确认站点构建不依赖 CI 才能通过。

</br>

### Step 3：设计 GitHub Actions Workflow

一个典型的 workflow 结构：

```yaml
name: Daily Bot

on:
  schedule:
    - cron: "0 0,1,2 * * *"   # 每天 UTC 0/1/2 点跑
  workflow_dispatch: {}       # 允许手动点按钮触发

permissions:
  contents: write             # 允许 Bot 推送代码或空提交

jobs:
  run-bot:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          submodules: recursive  # 如果你用了主题子模块等

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install deps
        run: pip install -r requirements.txt

      - name: Run bot script
        env:
          MY_API_KEY: ${{ secrets.MY_API_KEY }}
        run: python content/posts/fetch_history_today.py

      - name: Optional: sanity build
        run: hugo --config hugo.toml

      - name: Trigger deploy (empty commit)
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git commit --allow-empty -m "chore: daily bot trigger"
          git push
```

这样定时任务会让 GitHub Actions Bot 帮你跑脚本：Bot 通过一个空提交触发后续平台 (如 Cloudflare Pages) 构建部署；不会往仓库里塞大量构建产物。

</br>

</br>

# “密钥写前端吗？主播你好大方”

对初级程序员来说，非常习惯性就把密钥写到前端代码或公开仓库里，记住：

> 凡是任何人都能通过浏览器看到的东西，就不是秘密 ——

- GitHub public 仓库的源码，这么做 Github 会写邮件找你投诉的，额……亲身经历。
- F12 能看到的东西：Hugo 模板 / Markdown / JS / CSS；静态 JSON / 静态 HTML；
- 浏览器的 `localStorage`、Cookie (除非是 HTTP-only 且只供后端使用)。

**正确的做法：**

1. **密钥只存在于服务器的环境变量里**，例如 GitHub Actions 的 `secrets.MY_API_KEY`。
2. 在 workflow 里，把 secret 映射到运行环境：
   ```yaml
   env:
     MY_API_KEY: ${{ secrets.MY_API_KEY }}
   ```
3. 在你的脚本里只用 `os.environ["MY_API_KEY"]` 来读取，不要写到任何输出文件中。
4. 脚本生成的内容，如果要暴露给前端，必须是**已经脱敏过的结果**：如请求 API 返回的数据本体，而不是 API 的返回 Token / Refresh Token / 私有 ID 等。

(当然你也可以用 Cloudflare 的 Workers&Pages 新增一条 "Variables and Secrets" 来保存密钥)

⚠️ 最后，在 Cloudflare 中为你的域增加一条 WAF 安全规则，以我的域名为例：

```pseudocode
当 (http.host eq "nero-lithos.com" or ends_with(http.host, ".nero-lithos.com"))
然后 “托管质询“ ("Managed Challenge")
```

这个服务对于特定域是免费的，不要在仪表主页配置全局 WAF，否则要收钱。

</br>

</br>

# 建议

1. **先在本地把流程跑通，再搬到 CI**，不要一上来就写 Actions
2. **每次改动只增加一点复杂度**
3. **Git Bot 是一个 Contributor，所以它生成的东西也会产生版本冲突**
4. **永远不要把密钥写进代码和配置文件**

