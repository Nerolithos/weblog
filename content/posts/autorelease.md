---
title:     "🌐 Automation of Ssg Post Release"
date:      2025-04-25T15:43:45+08:00
draft:     false
summary:   "SSG (Hugo + Cloudflare) 中部落格的发布如何实现半自动化？"
categories:
  - SDS
tags: [帮助]

---



# SSG (Hugo + Cloudflare) 如何实现半自动化？



你现在能看到这篇帖子，说明我已经可以用一行代码，免去手动建 markdown 文件、无需手写 Front Matter、也不用在终端写 git 命令——一键发布 post。

我发现在静态网页发布文章每次都要耗费不相关且重复性劳动，遂试图消灭这些麻烦。



## Instructions



1. 在项目根目录 (git 仓库根目录) 下建立 shell 文件 (以下称为 “newpost.sh")。

2. (创建并) 修改 archetypes/default.md 为你想用的 front matter，比如：

   ```yaml
   ---
   title:     "{{ replace .Name "-" " " | title }}"
   date:      {{ .Date }}
   draft:     false
   summary:   ""
   categories: []
   tags:       []
   ---
   ```

   或者你用的是 TOML：

   ```toml
   +++
   title      = "{{ replace .Name \"-\" \" \" | title }}"
   date       = {{ .Date }}
   draft      = false
   summary    = ""
   categories = []
   tags       = []
   +++
   ```

   其中双引号和方括号是占位符，如果你有固定格式或内容要求，可以直接填入。

3. 然后在 “newpost.sh” 中填入以下信息：

   ```shell
   #!/usr/bin/env bash
   
   set -euo pipefail
   
   # —— 1. 参数检查 —— #
   if [ $# -lt 1 ]; then
     cat << EOF
   Usage: $0 "文章标题" [标签1,标签2,...]
   
   示例:
     $0 "为什么线性代数好有趣" math,linear-algebra
   EOF
     exit 1
   fi
   
   TITLE="$1"
   TAGS="${2:-}"   # 如果只传标题，TAGS 则为空
   
   # —— 2. 生成 slug —— #
   SLUG=$(echo "$TITLE" \
     | tr '[:upper:]' '[:lower:]' \
     | sed -E 's/[^a-z0-9]+/-/g' \
     | sed -E 's/^-+|-+$//g')
   
   FILE="content/posts/${SLUG}.md"
   
   # —— 3. Hugo 新建文章 —— #
   hugo new posts/${SLUG}.md
   
   # —— 4. 替换 tags 字段 —— #
   if [ -n "${TAGS}" ]; then
     # macOS 下 sed 用 -i ''，Linux 下可改成 sed -i
     sed -i '' "s/^tags:.*/tags: [${TAGS}]/" "${FILE}"
   fi
   
   # —— 5. 打开 Typora —— #
   echo "🚀 已创建文件：${FILE}"
   echo "   正在用 Typora 打开……"
   open -a "Typora" "${FILE}"
   
   # —— 6. 等待用户在 Typora 中编辑完成后，回到终端按回车 —— #
   read -rp "✍️  编辑完成后，回到此处按回车继续提交并推送…"
   
   # —— 7. Git 提交并推送 —— #
   git add "${FILE}"
   git commit -m "feat: 新增文章《${TITLE}》"
   git push -u origin main
   
   echo "✅ 已提交并推送：${FILE}"
   ```

4. 赋予终端访问运行权：`chmod +x newpost.sh`

5. 最后，需要发表文章时，输入`./newpost.sh "<文章标题>" <标签1>,<标签2>,……` ，随后 typora 会跳出，写入正文内容后，ctrl+s，点击关闭窗口，方才编辑的文件就会自动发布。



现在……我点击关闭窗口，稍后再见。（不是在跟你说，你快自己去试试吧）
