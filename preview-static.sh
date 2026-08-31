#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./preview-static.sh
#   ./preview-static.sh --watch
#   ./preview-static.sh --watch public_local_preview 1314

watch_mode=0
if [[ "${1:-}" == "--watch" ]]; then
  watch_mode=1
  shift
fi

out_dir="${1:-public_local_preview}"
port="${2:-1314}"

build_site() {
  echo "[build] hugo -D -F --destination ${out_dir}"
  hugo -D -F --destination "${out_dir}"
}

start_server() {
  echo "[serve] http://127.0.0.1:${port}"
  python3 -m http.server "${port}" --directory "${out_dir}" >/dev/null 2>&1 &
  server_pid=$!
}

cleanup() {
  if [[ -n "${server_pid:-}" ]]; then
    kill "${server_pid}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

build_site
start_server

if [[ "${watch_mode}" -eq 0 ]]; then
  echo "[info] Preview server running. Press Ctrl+C to stop."
  wait "${server_pid}"
  exit 0
fi

if command -v fswatch >/dev/null 2>&1; then
  echo "[watch] fswatch enabled. Editing files will trigger rebuild."
  while true; do
    fswatch -1 -r \
      content \
      layouts \
      static \
      assets \
      data \
      archetypes \
      hugo.toml \
      go.mod \
      themes/ananke1/config.yaml
    build_site
    echo "[watch] rebuilt at $(date '+%H:%M:%S')"
  done
else
  echo "[watch] fswatch not found. Auto rebuild disabled."
  echo "[watch] Install: brew install fswatch"
  echo "[watch] Manual rebuild command: hugo -D -F --destination ${out_dir}"
  wait "${server_pid}"
fi
