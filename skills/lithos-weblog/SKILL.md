---
name: lithos-weblog
description: Maintain and extend Lithos' Hugo blog and its static applications while preserving its exact-search/BM25 behavior, homepage views, first-party API safety, performance conventions, and distinctive non-generic visual language. Use for content, layout, search, comments, SEO, media, or interactive-project work in the weblog repository.
metadata:
  short-description: Maintain Lithos' Hugo knowledge and project site
---

# Lithos' Weblog

Maintain this repository as a mature personal knowledge system and project hub, not as a generic Hugo starter. Preserve the site's existing behavior unless the user explicitly requests a redesign or migration.

## Product identity

Treat the site as three connected products:

- a CUHKSZ course and survival knowledge base;
- a personal digital garden with technical and interdisciplinary notes;
- an entry point for interactive visualizations, games, 3D work, and external projects.

Prefer changes that make existing content easier to find, trust, learn from, or present professionally. Do not add visual novelty merely because the site can support it.

## Inspect before changing

Read the smallest relevant set of current files before editing. Current implementation is the source of truth; this skill records invariants, not a frozen snapshot.

Important paths:

- `content/posts/`: articles and redirect-style project entries;
- `layouts/index.html`: homepage cards and view switcher;
- `layouts/partials/home-*.html`: timeline, categories, and topic map;
- `layouts/index.json.json`: generated local search corpus;
- `static/search/index.html`: full exact-search and BM25 interface;
- `static/js/live-search.js`: homepage search preview;
- `layouts/partials/head-additions.html`: shared reading interactions and styling;
- `static/css/custom.css`: global custom appearance;
- `static/`: isolated apps, media, models, and browser runtimes;
- `functions/`: Cloudflare Pages Functions and protected APIs;
- `hugo.toml`: canonical site configuration and third-party services.

Before editing, inspect `git status`. Existing changes belong to the user. Never revert, rename, format, or “clean up” unrelated files. The `themes/ananke1` submodule may already be dirty; leave it untouched unless the request explicitly targets it.

## Core invariants

1. Preserve visible behavior and URLs when performing optimization, SEO, security, or infrastructure work.
2. Prefer static/local functionality over databases, AI calls, and third-party embeds when static behavior satisfies the requirement.
3. Keep independent static apps isolated. Do not force the Hugo article style onto a game, visualization, or experimental microsite with its own art direction.
4. Make narrow changes. Do not rename referenced assets, datasets, or routes without updating every consumer and testing the affected feature.
5. Do not commit, push, merge, deploy, alter Cloudflare settings, or mutate external services unless the user asks.
6. Do not expose private publishing instructions or encourage readers to run the personalized repository locally.

## Articles and project entries

Follow nearby front matter rather than inventing a new schema. A normal redirect-style project entry generally uses:

```yaml
---
title: "Project title"
date: 2026-01-01T12:00:00+08:00
draft: false
summary: "Short human-written description"
redirect: "https://example.com/"
categories:
  - Game
tags:
  - Game
featured_image: "/images/example.webp"
---
```

Include a short fallback link in the body. Use the site's established category spelling and case. Do not silently rewrite the user's title, summary, time, or category.

For a featured image under `static/images/`, follow the three-file convention when the layouts require it:

- `/images/name.webp`: article or general image, normally capped near 1600 px;
- `/images/thumbs/name.webp`: homepage/list thumbnail, normally near 720 px;
- `/images/heroes/name.webp`: header image, normally near 1200 px.

Use WebP with visually appropriate quality and preserve aspect ratio. Confirm dimensions, decoded validity, and actual file-size reduction. Preserve the source image unless deletion is explicitly requested or an established task-specific convention requires removal.

## Search contract

Search is local and deterministic. Do not replace it with an AI answer box or remote search service.

Maintain these semantics across homepage preview and the full search page:

- normalize with Unicode NFKC and lowercase;
- preserve useful technical tokens such as `C++`, `R2`, `course_id`, and course codes;
- treat English/numeric units as complete tokens rather than arbitrary substrings;
- treat a continuous Chinese query as an exact unit;
- combine multiple query units with AND semantics;
- filter by exact-unit presence before ranking;
- rank eligible full-page results with BM25, with title and exact-title bonuses;
- generate a nearby snippet and carry `hl` into the destination for paragraph highlighting;
- show a small live preview while typing, but submit/Enter to the complete result page.

Keep `static/js/live-search.js` and `static/search/index.html` behavior aligned. If tokenization, exact matching, or result URLs change in one, review the other. Synonyms may expand ranking/highlighting, but must not weaken the exact-unit eligibility filter unless the user explicitly changes the search product.

Do not use AI to infer results, silently broaden queries, fabricate tags, or reorder results nondeterministically.

## Homepage and display modes

The homepage supports four complementary views:

- `default`: full article cards in recency order;
- `timeline`: compact chronological navigation;
- `categories`: established course/project groupings;
- `cloud` / topic map: meaningful concept clusters linked to exact search.

Preserve deep links such as `?view=cloud`, keyboard accessibility, active-tab state, external redirects, and the default reading experience. A new view should reuse the same post source and redirect rules rather than maintaining a second content list.

The topic map must be evidence-based. Only include concepts genuinely present in posts, and calculate counts from content rather than inventing popularity. Prefer stable domain clusters—courses, systems, algorithms, data, web, science, creative work—over decorative word-cloud randomness.

On narrow screens, prioritize readable content and functional controls. Avoid horizontal clipping, fixed-width canvases without scaling, or moving desktop layouts wholesale onto mobile.

## Comments and reader participation

The current Hugo configuration may use Disqus. Do not remove it merely because a first-party system is preferable.

When the user requests first-party comments, prefer a small Cloudflare-native design:

```text
article comment form
  -> Turnstile token
  -> Pages Function
  -> server-side validation and rate limit
  -> D1 comments table
  -> moderation state
  -> sanitized public rendering
```

Minimum requirements:

- stable article identifier independent of display title;
- pending/approved/rejected moderation states;
- server-side Turnstile verification;
- global edge rate limiting plus request-size limits;
- escaped text or strictly sanitized Markdown—never raw submitted HTML;
- reply relationships without requiring a full account system;
- no public email address and no unnecessary personal data;
- CSRF/origin checks as defense in depth, never as authentication;
- a migration/fallback plan before removing existing comments.

Keep comments separate from ChatAP or other AI features. Never send a comment to an LLM without explicit consent.

## Visual language: remove the generic AI feel

Extend the site's authored, slightly eccentric visual identity rather than applying a universal startup template.

Prefer:

- strong editorial hierarchy and compact, content-first layouts;
- restrained black, white, gray, blue, and context-specific project colors;
- motifs already native to the site: pixels, technical diagrams, terminal/desktop UI, mineral/science imagery, timelines, cards, and tactile controls;
- simple icons with consistent size, stroke, contrast, and alignment;
- purposeful asymmetry and project-specific art direction;
- motion that communicates state or rewards interaction;
- real screenshots, diagrams, data, or artwork over synthetic decoration.

Avoid by default:

- purple-blue gradients, glowing blobs, aurora backgrounds, or excessive glass panels;
- oversized marketing headlines with vague slogans;
- repeated rounded cards containing generic icon-title-description triplets;
- excessive pills, badges, emojis, shadows, and hover motion;
- fake metrics, invented testimonials, placeholder copy, or decorative charts;
- rewriting personal Chinese prose into polished but impersonal “AI copy”;
- making unrelated microsites visually identical.

“Liquid glass” or 3D is acceptable only when the user requests it or it clearly belongs to the existing interface. Keep text legible and provide reduced-motion behavior for costly animation.

## Static applications and performance

Treat each directory under `static/` as a production application, even when it began as an experiment.

- Lazy-load heavy runtimes such as OpenCV, WebGL helpers, 3D models, and large datasets at the moment their feature is used.
- Remove unused libraries rather than bundling them defensively.
- Compress photographic images to WebP and provide appropriately sized variants.
- Do not convert Spine atlases, transparent sprites, diagrams, or scientific assets blindly; inspect format requirements first.
- Pause animation and detection loops when hidden or inactive.
- Cap continuous decorative rendering to an appropriate frame rate.
- Stop camera, audio, timers, observers, and detection loops when their feature closes.
- Preserve progressive enhancement: article reading, links, and search navigation should survive nonessential JavaScript failure.
- Keep third-party network requests minimal and disclose any that handle user data.

Optimization must not alter crop, orientation, interaction targets, animation state, or mobile layout without visual verification.

## AI and API safety

Secrets belong only in Cloudflare environment bindings. Never place API keys in Markdown, JavaScript, generated HTML, logs, or screenshots.

For a public AI proxy such as `functions/api/chatap.js`:

- enforce the model or a strict server-side allowlist; never trust `payload.model`;
- prefer a verified free route when the feature promises free usage;
- cap body size, message count, per-message size, total prompt size, and output tokens;
- validate roles and content types;
- apply Cloudflare edge rate limiting; an in-memory limiter is only supplemental;
- use Turnstile when automated abuse warrants the added interaction;
- return generic upstream failures and do not expose provider responses or key metadata;
- set `no-store`, `nosniff`, and narrowly scoped CORS headers;
- regard `Origin` checks as browser abuse mitigation, not caller authentication.

Keep CourseAI's non-AI course-code lookup independent from the generated answer. Preserve its local Go/WASM or deterministic search path and display it only after the AI response as designed.

## SEO and metadata

SEO work must not change what readers see unless requested. Preserve canonical URLs, sitemap/robots behavior, redirect destinations, and social-image fallbacks.

Use accurate titles, descriptions, dates, featured images, Open Graph/Twitter metadata, and relevant structured data. Do not generate keyword-stuffed summaries, hidden text, doorway pages, or fabricated freshness dates. Redirect entries should describe the actual destination and remain useful when automatic redirecting fails.

## Verification

Test in proportion to the change and keep tests lightweight.

- Run syntax checks for changed JavaScript and deterministic scripts.
- Run `git diff --check` on edited files.
- Validate generated WebP files by decoding them and checking dimensions.
- For static apps, serve `static/` directly on localhost and inspect the relevant route, console, layout, and requested assets.
- For search changes, test Chinese, English, a course code, punctuation-bearing technical tokens, multi-word AND behavior, preview, Enter submission, and `hl` navigation.
- For API changes, test allowed and rejected origins, size limits, model enforcement, normal CourseAI-sized payloads, and rate limits with a mocked upstream.
- For responsive changes, inspect at least one desktop and one narrow viewport.

Full Hugo builds have historically stalled in this repository. Prefer targeted checks or `--renderToMemory`; if a Hugo process makes no progress for about one minute, stop it, report that fact, and continue with narrower verification. Do not describe a timed-out build as successful.

## Completion standard

Before handing off:

1. Re-read the diff for accidental renames, broad rewrites, stale references, and duplicate logic.
2. Confirm that unrelated user changes remain untouched.
3. State the visible outcome first.
4. List important files changed and tests actually completed.
5. Distinguish verified behavior from deployment-only recommendations such as Cloudflare WAF rules.
6. Mention remaining risk briefly; do not bury it under generic reassurance.
