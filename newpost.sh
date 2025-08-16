#!/usr/bin/env bash
# ============================================================
# newpost.sh — 一键新建 Hugo 文章并自动提交推送（Typora 编辑 + 按回车继续）
# 目录：content/posts/
# 模板：archetypes/default.md（或 archetypes/posts.md）
# 用法：./newpost.sh "文章标题" 标签1,标签2,标签3
# ============================================================

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