#!/bin/zsh
# 自动同步本地 Hugo 仓库到 GitHub

REPO_PATH="$HOME/Documents/GitHub/weblog"
BRANCH="main"

cd "$REPO_PATH" || exit 1

# 拉取远程更新（避免冲突）
git pull origin $BRANCH

# 添加修改
git add .

# 如果有变化才提交
if ! git diff --cached --quiet; then
  git commit -m "Auto sync at $(date '+%Y-%m-%d %H:%M:%S')"
  git push origin $BRANCH
fi