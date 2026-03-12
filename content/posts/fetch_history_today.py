"""Fetch 'On This Day' events into a local JSON file.

当前版本改为使用 Wikipedia 官方 On This Day REST API，
不再爬取 HTML，避免因为目标站改版/风控导致拿不到数据。

生成的 JSON 结构仍然是：

{
  "MM-DD": [
    {"year": 1990, "region": "World", "summary": "..."},
    ...
  ],
  ...
}
"""

import json
import time
from datetime import date, timedelta

import requests

WIKI_BASE = "https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/{month}/{day}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; LithosHistoryBot/1.0)"
}


def iter_all_days():
    """Iterate all days in a leap year so 02-29 is included."""
    d = date(2000, 1, 1)
    for _ in range(366):
        yield d
        d += timedelta(days=1)


def fetch_day_events(d):
    """Fetch up to 5 events for a given date from Wikipedia OnThisDay API."""
    url = WIKI_BASE.format(month=d.month, day=d.day)
    print("fetching", url)
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    events = []
    for item in data.get("events", [])[:5]:
        year = item.get("year")
        text = item.get("text") or ""
        if year is None or not text:
            continue

        summary = text.strip()

        events.append(
            {
                "year": int(year),
                # Wikipedia API 不直接给地区，这里用 "World" 占位，
                # 之后你可以按需要手动归类。
                "region": "World",
                "summary": summary,
            }
        )

    if not events:
        raise RuntimeError("no events returned from Wikipedia API")

    return events


def main():
    all_data = {}
    any_events = False

    for d in iter_all_days():
        key = f"{d.month:02d}-{d.day:02d}"
        print("===", key, "===")
        try:
            events = fetch_day_events(d)
        except Exception as e:
            # 对于网络超时等问题，记录错误并跳过该天，
            # 但不再整个中止，这样只要大部分日期成功，仍然能生成有用的数据。
            print(f"ERROR: failed to fetch events for {key}:", e)
            all_data[key] = []
            continue

        events = events[:5]
        all_data[key] = events
        if events:
            any_events = True

        # 适度 sleep，避免对 API 造成压力
        time.sleep(0.5)

    if not any_events:
        print("ABORT: fetched 0 events for all days; not writing history-today-data.json.")
        return

    with open("history-today-data.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print("written history-today-data.json with",
          sum(len(v) for v in all_data.values()), "events.")

if __name__ == "__main__":
    main()