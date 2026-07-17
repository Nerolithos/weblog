#!/bin/zsh
# 自动同步本地 Hugo 仓库到 GitHub

REPO_PATH="$HOME/Documents/GitHub/weblog"
BRANCH="main"
OWNER="Nerolithos"
REPO_NAME="weblog"
STATS_FILE="$REPO_PATH/data/github_repo_stats.json"

write_repo_stats() {
  local stars="$1"
  local commits="$2"
  local updated_at="$3"

  mkdir -p "$REPO_PATH/data"
  cat > "$STATS_FILE" <<EOF
{
  "stars": $stars,
  "commits": $commits,
  "updated_at": "$updated_at"
}
EOF
}

read_cached_stars() {
  if [[ ! -f "$STATS_FILE" ]]; then
    echo "0"
    return
  fi

  awk -F': ' '/"stars"/ {gsub(/,/, "", $2); print $2; exit}' "$STATS_FILE"
}

refresh_repo_stats() {
  local repo_api="https://api.github.com/repos/${OWNER}/${REPO_NAME}"
  local stars=""
  local commits=""
  local updated_at=""
  local payload=""

  payload=$(curl -fsSL "$repo_api" 2>/dev/null)
  stars=$(printf '%s' "$payload" | awk -F': ' '/"stargazers_count"/ {gsub(/,/, "", $2); print $2; exit}')

  if [[ -z "$stars" ]]; then
    stars=$(read_cached_stars)
    [[ -z "$stars" ]] && stars="0"
    echo "Warning: failed to fetch GitHub stars, reusing cached value: $stars"
  fi

  commits=$(git rev-list --count HEAD 2>/dev/null)
  [[ -z "$commits" ]] && commits="0"
  commits=$((commits + 1))
  updated_at=$(date -u "+%Y-%m-%dT%H:%M:%SZ")

  write_repo_stats "$stars" "$commits" "$updated_at"
}

cd "$REPO_PATH" || exit 1

# 拉取远程更新（避免冲突）
git pull origin $BRANCH

# 没有待同步改动时不更新统计，避免无意义提交
if [[ -z "$(git status --porcelain)" ]]; then
  echo "No local changes to sync."
  exit 0
fi

# 每次实际同步前更新一次 GitHub 星标/提交统计
refresh_repo_stats

# 添加修改
git add .

# 如果有变化才提交
if ! git diff --cached --quiet; then
  git commit -m "Auto sync at $(date '+%Y-%m-%d %H:%M:%S')"
  git push origin $BRANCH
fi