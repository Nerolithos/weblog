---
title:     "🌐 Automation of Ssg Post Release"
date:      2025-04-25T15:43:45+08:00
draft:     false
summary:   "How can blog publishing in an SSG setup (Hugo + Cloudflare) be semi-automated?"
categories:
  - SDS
tags: [帮助]
featured_image: "/images/ar.jpg"
---



# How can SSG (Hugo + Cloudflare) be semi-automated?



If you are reading this post now, it means I can already publish a post with a single command: no manual creation of a Markdown file, no hand-written Front Matter, and no need to type Git commands in the terminal.

I found that publishing articles on a static website always involves repetitive work that is unrelated to the actual writing, so I tried to eliminate as much of that friction as possible.



## Instructions



1. Create a shell script in the project root (that is, the root directory of the Git repository). I call it `newpost.sh`.

2. Create or modify `archetypes/default.md` into the Front Matter template you want. For example:

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

   Or, if you use TOML:

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

   The quotation marks and brackets above are placeholders. If you already have a fixed format or required content, you can fill them in directly.

3. Then put the following into `newpost.sh`:

   ```shell
   #!/usr/bin/env bash
   
   set -euo pipefail
   
   # —— 1. Argument check —— #
   if [ $# -lt 1 ]; then
     cat << EOF
   Usage: $0 "文章标题" [标签1,标签2,...]
   
   示例:
     $0 "为什么线性代数好有趣" math,linear-algebra
   EOF
     exit 1
   fi
   
   TITLE="$1"
   TAGS="${2:-}"   # If only a title is provided, TAGS is empty
   
   # —— 2. Generate slug —— #
   SLUG=$(echo "$TITLE"      | tr '[:upper:]' '[:lower:]'      | sed -E 's/[^a-z0-9]+/-/g'      | sed -E 's/^-+|-+$//g')
   
   FILE="content/posts/${SLUG}.md"
   
   # —— 3. Create a new post with Hugo —— #
   hugo new posts/${SLUG}.md
   
   # —— 4. Replace the tags field —— #
   if [ -n "${TAGS}" ]; then
     # On macOS use sed -i '', on Linux use sed -i
     sed -i '' "s/^tags:.*/tags: [${TAGS}]/" "${FILE}"
   fi
   
   # —— 5. Open Typora —— #
   echo "🚀 File created: ${FILE}"
   echo "   Opening it in Typora..."
   open -a "Typora" "${FILE}"
   
   # —— 6. Wait until the user finishes editing in Typora, then press Enter in the terminal —— #
   read -rp "✍️  After editing, come back here and press Enter to continue committing and pushing..."
   
   # —— 7. Git commit and push —— #
   git add "${FILE}"
   git commit -m "feat: add article 《${TITLE}》"
   git push -u origin main
   
   echo "✅ Submitted and pushed: ${FILE}"
   ```

4. Grant execution permission in the terminal: `chmod +x newpost.sh`

5. Finally, whenever you want to publish a post, run `./newpost.sh "<文章标题>" <标签1>,<标签2>,……`. Typora will then pop up. After writing the body, press `Ctrl+S`, close the window, and the file you just edited will be published automatically.



Now then... I am clicking the close button. See you later. (Not talking to you—go try it yourself.)
