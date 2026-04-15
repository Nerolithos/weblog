---
title: "🛠️ Getting Started with GitHub Action Bot for Repository Automation"
date: 2026-04-07T11:30:34+08:00
draft: false
summary: "Using my 'On This Day in History' project as an example, this post explains how a CS amateur/enthusiast university student can begin using GitHub Actions Bot to automate a remote repository, along with the common pitfalls."
categories: 
- 帮助
tags: 
- 技术
featured_image: "/images/gab.jpg"
---





[“Today in History”](https://blog.nero-lithos.com/posts/history-today/) is basically the simplest form of automation: once set up, you do not need to do anything manually every day.

- A Python script fetches data from a public API every day;
- Hugo Anake renders the data into a page during build time;
- GitHub Actions Bot runs the script on a schedule and triggers Cloudflare to rebuild the whole site;

⚠️ Notes:

1. Do not expose secrets to the frontend.
2. Use `.gitignore` and sensible workflow design to avoid bloating your Git history with generated files.
3. If you are using an API (for example, an LLM service), it is best to add a security rule in Cloudflare for your domain and use **Managed Challenge**.



</br>

# Project Architecture

1. Goal: create an “On This Day in History” page on the blog that automatically displays historical events for the current date. The whole process is fully automated: even if your own computer is shut down, the site still updates every day.

2. Tech stack

- Static website (deployment path: GitHub repository → Cloudflare Pages automatic build);
- Data source: the official Wikipedia On This Day JSON API (no need to scrape HTML);
- Backend automation: scheduled GitHub Actions jobs.

3. Key components

- A Python data-fetching script iterates through all dates in the year, retrieves historical events from the Wikipedia API, and generates a JSON file.
- Hugo integration (HTML shortcode): during build time, use `readFile` + `transform.Unmarshal` to load the JSON; use `now.Format "01-02"` (UTC) as the key to select the current day’s events; render both the detail-page list and the homepage summary; use an `.md` template as the page entry point (with front matter for title, cover image, and so on); and invoke `history_today` inside the body.
- Automation: a workflow (`.yml`) with `on.schedule` set to multiple trigger times each day; pull the repository code and theme submodules before running.

</br>

</br>

# Pitfalls and Difficulties

## Data source

Phenomenon: if you try to scrape HTML from a site like onthisday.com using CSS selectors to locate DOM elements, a website revision can silently break everything. The script may still run, but it may extract only empty arrays and quietly write them into your JSON file, leaving the frontend with nothing to display.

Solution: if you switch to the Wikipedia On This Day JSON API, the returned structure is explicit, the fields are stable, and the process does not depend on page layout. Minor HTML revisions are therefore much less likely to break your pipeline.

#### Takeaways

- Use an API whenever one is available instead of scraping HTML;

- Detect the case where “no data is fetched.” In such situations, the script should **raise an error and stop**, rather than silently writing JSON full of `[]`.

</br>

## Time and time zones

Phenomenon: both Hugo’s `now` and GitHub Actions schedules use **UTC** by default. If you run the workflow in the early morning Beijing time, `now` may still correspond to the previous UTC date. As a result, code that looks perfectly reasonable may keep showing “yesterday in history” even though the page appears to update every day.

Solution: adjust your cron schedule so that it avoids the ambiguous interval in which the local date has already changed while UTC has not. For example, trigger the task at UTC 0/1/2, which corresponds roughly to 8/9/10 AM Beijing time. By then, both UTC and Beijing are already on the “new day.”

#### Takeaways

- If you want to define “today” using a local time zone such as `Asia/Shanghai`, either adjust the cron schedule accordingly or compute dates explicitly in the script using that local time zone;
- It is wise to schedule multiple runs per day as a buffer, because the bot may occasionally fail due to network delays or runner congestion. You may notice that GitHub Actions Bot does not always run exactly on the hour you specify, and some delay is normal. In short, scheduled tasks should preferably **run multiple times per day**, rather than relying on a single successful execution:

```yaml
on:
  schedule:
    - cron: "0 0,1,2 * * *"
```

- For GitHub Actions, running the automatic script at UTC+0 still corresponds to “yesterday” for some local time zones.

</br>

## Build chain

Phenomenon: the site builds successfully on localhost, but CI reports errors such as “theme partial not found.” This is a classic Hugo issue, and one common cause is that the theme is a Git submodule that CI did not pull. Another is that older Hugo fields (such as `.Site.DisqusShortname`) have been deprecated, and newer Hugo versions may fail on them.

Solution:

- Enable submodules when checking out the repository inside Actions:
  ```yaml
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0
      submodules: recursive
  ```
- Update template usage to match newer Hugo versions. For example, replace `.Site.DisqusShortname` with `.Site.Config.Services.Disqus.Shortname`.

#### Takeaways

- When “it works locally but fails in CI,” check the following first: whether the theme/submodules were pulled, whether a Hugo upgrade renamed some APIs, and whether variables such as `HUGO_ENV` and other environment settings are configured correctly.

</br>

## Git history pollution

> Action Bot is also a contributor to the repository. Whether the conflict is caused by a human or a bot, do not repeatedly `add` unnecessary content.

Phenomenon: if your workflow blindly runs `git add ... public` and stages all generated files, then each `hugo` build may create or slightly modify a large number of HTML files under `public`, especially `public/posts/`. The result is **a huge number of irrelevant diffs every day** (timestamps, ordering differences, and so on). Your Git history gets polluted by unnecessary updates, and conflicts between your local branch and the remote branch become much more likely.

Solution:

- **Do not commit build artifacts anymore.** Instead, the workflow may still run `hugo --config hugo.toml` as a sanity build check, but should not `git add` the build output. Then use an empty commit like the following purely to trigger a Cloudflare rebuild, without modifying any files:

```bash
git commit --allow-empty -m "chore: daily history-today rebuild trigger"
git push
```

- Also configure `.gitignore` so that local tools or other scripts do not accidentally add generated files:

```gitignore
/public/
/.history-today-build-stamp
```

#### Takeaways

- **A repository should store only source code and genuine source data, not build results.**
- Static-site build directories such as `public/` or `dist/` should almost always be listed in `.gitignore`.

</br>

</br>

# A Reusable GitHub Actions Bot Template

> A step-by-step tutorial aimed at “beginning university programmers.” You can reuse the same pattern for RSS fetching, automatic translation, periodic backups, and many other automation tasks.

### Step 1: The script

- The language is up to you: Python / Node / Go / Shell all work. Here I use Python as an example.
- Input: read parameters from environment variables or configuration (for example, an API key or a date range); output: generate data files or modify selected source files; and make sure the script can be run locally from the command line so that you can observe its behavior directly.

```python
# skeleton pseudo-code
import os
from datetime import datetime

def main():
    # Read secrets from environment variables (if needed)
    api_key = os.environ.get("MY_API_KEY")
    if not api_key:
        raise RuntimeError("Missing MY_API_KEY")

    today = datetime.utcnow().date()
    # ... call a third-party API ...
    # ... generate JSON or Markdown files ...

if __name__ == "__main__":
    main()
```

**Never hard-code secrets in the script. Always keep them in environment variables on the backend side.**

</br>

### Step 2: Integrate the script with the site locally first

In our project, for example, the script-generated data is written to `static/xxx.json`, and Hugo reads that JSON during build time using a shortcode or partial.

Run and verify locally:

- Make sure the script is **idempotent**: running it multiple times should produce the same result (or simply overwrite the old data).
- Make sure the site can build successfully without depending on CI-specific behavior.

</br>

### Step 3: Design the GitHub Actions workflow

A typical workflow looks like this:

```yaml
name: Daily Bot

on:
  schedule:
    - cron: "0 0,1,2 * * *"   # run daily at UTC 0/1/2
  workflow_dispatch: {}       # also allow manual triggering by button

permissions:
  contents: write             # allow the Bot to push code or make empty commits

jobs:
  run-bot:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          submodules: recursive  # if you use theme submodules, etc.

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

In this setup, the scheduled job lets GitHub Actions Bot run your script automatically. The bot then uses an empty commit to trigger deployment on the downstream platform (such as Cloudflare Pages), without flooding the repository with build artifacts.

</br>

</br>

# “Should I Put Secrets in the Frontend? That’s Very Generous of You.”

For beginners, it is extremely common to put secrets directly in frontend code or a public repository. Remember this rule:

> If anyone can see it in the browser, then it is not a secret.

This includes:

- The source code in a public GitHub repository. GitHub may even send you warning emails if it detects exposed credentials — yes, that happened to me.
- Anything visible via F12: Hugo templates / Markdown / JS / CSS; static JSON / static HTML;
- The browser’s `localStorage` and cookies (unless they are HTTP-only and intended exclusively for backend use).

**The correct approach is:**

1. **Keep secrets only in server-side environment variables**, such as `secrets.MY_API_KEY` in GitHub Actions.
2. In the workflow, map the secret into the runtime environment:
   ```yaml
   env:
     MY_API_KEY: ${{ secrets.MY_API_KEY }}
   ```
3. In your script, read it only through `os.environ["MY_API_KEY"]`, and never write it into any output file.
4. If the script produces content that will be exposed to the frontend, that content must already be **sanitized**: e.g. the actual API response data you want to publish, not API tokens, refresh tokens, or private IDs.

(Of course, you may also store secrets using Cloudflare Workers & Pages under “Variables and Secrets.”)

⚠️ Finally, add a WAF security rule in Cloudflare for your domain. Using my domain as an example:

```pseudocode
When (http.host eq "nero-lithos.com" or ends_with(http.host, ".nero-lithos.com"))
Then "Managed Challenge"
```

This service is free for a specific domain. Do **not** configure a global WAF rule from the dashboard homepage, or you may be charged.

</br>

</br>

# Suggestions

1. **Get the workflow working locally first, then move it to CI.** Do not start by writing Actions immediately.
2. **Increase complexity only one small step at a time.**
3. **A Git bot is still a contributor**, so the files it generates can also create version conflicts.
4. **Never put secrets into code or configuration files.**
