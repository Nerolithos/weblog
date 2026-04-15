---
title: '🌐 Manual for Deploying a Hugo Blog on Cloudflare'
date: 2024-08-015T23:34:08+08:00
summary: 'People often say that building a blog with GitHub and Cloudflare is cheap and easy. In practice, however, the process can be surprisingly full of pitfalls.'
tags: 
  - Technology
---

This post extends material originally discussed on [sunnyseeds’s personal blog](blog.sunneyseeds.net).



## Preface

I had often heard that building a blog by taking advantage of GitHub and Cloudflare was both cheap and easy. But after actually doing it, I found that many online guides contain traps.

This includes the Hugo documentation, the Cloudflare documentation, and even GPT-style advice.

**Prerequisite: your terminal CLI must be able to access GitHub reasonably reliably.**

(Otherwise, even if you follow the official documentation word for word, things may still mutate unpredictably. Consider yourself warned.)





## I. Initialize a Hugo Blog Project

### Install Hugo

```shell
brew install hugo # MacOS
```

### Create a Hugo Site

```shell
hugo new site <your_blog_project_name> 
# This creates a project named `your_blog_project_name`
```

### Configure the Hugo Theme

1. From the project root, initialize the Hugo module system (if you have not already done so):

```shell
hugo mod init github.com/<your_user>/<your_project>
```

2. Enter the Hugo site directory we just created and open the **`hugo.toml`** file (in some versions it may instead be called **`config.toml`**). It sits at the top level of the project root.

There is one pitfall here: the `newsroom` theme used in ayu’s example seems problematic: `github.com/onweru/newsroom`.

Modify it as follows:

```toml
baseURL = 'https://blog.sunnyseeds.net/'  # your purchased domain
defaultContentLanguage = "zh-cn" # default language
defaultContentLanguageInSubdir = false # do not show the current language in the URL
languageCode = 'zh-cn'
title = "sunnyseeds' Blog" # Blog title 
theme = ["github.com/theNewDynamic/gohugo-theme-ananke"] # your chosen theme
hasCJKLanguage = true # CJK stands for Chinese, Japanese, and Korean
canonifyurls = true
pagination.pagerSize = 6

[module]
[[module.imports]]
  path = "github.com/theNewDynamic/gohugo-theme-ananke"

```

[Ananke: Hugo Theme](https://github.com/theNewDynamic/gohugo-theme-ananke) contains more detailed examples for controlling many aspects of the theme, though I have not used them yet.

### Pull the Theme Repository Locally

Run the following inside the root directory of your Hugo site:


```
git init

git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke


```

Note: `git submodule add` is used to add another Git repository as a submodule inside the current one. Submodule commits and updates are tracked through the main repository’s **`.gitmodules`** file, which records the path of the copied theme repository. This is very likely the reason for some of the errors discussed below.



![image.png](https://img.sunnyseed.me/2024/09/10/3025d116d27d1.png)

If that problem cannot be solved, you may try modifying the configuration file (`hugo.toml`) as follows, omitting the explicit theme path and letting `.gitmodules` resolve it instead:

```toml
baseURL = 'https://blog.sunnyseeds.net/'  # your purchased domain
defaultContentLanguage = "zh-cn" # default language
defaultContentLanguageInSubdir = false # do not show the current language in the URL
languageCode = 'zh-cn'
title = "sunnyseeds' Blog" # Blog title 
theme = 'anake' # 你选择的主题
hasCJKLanguage = true # CJK stands for Chinese, Japanese, and Korean
canonifyurls = true
pagination.pagerSize = 6
```



#### Create a New Post

```
hugo new content posts/hello-world.md
```
Each Hugo post needs front matter in TOML or YAML format, used to control how the article is displayed.

Edit `content\posts\hello-world.md`.

Hugo site configuration commonly uses two fairly readable formats that are closer to natural language than raw HTML.
YAML format: connect keys and values with colons.
TOML format: connect keys and values with equal signs.
**The front matter must be properly delimited, and the two formats must not be mixed, or Cloudflare may fail during deployment.**
Typical fields include:
`title`, `date`, `draft`, `featured_picture`, `summary`, `tag`, and so on.

Note: **delete the line `draft = true`**, otherwise the post will not appear.

Also note: **make sure the Markdown file is located in `content/posts/`, not directly under `content/`**, or rendering behavior may become strange. Do not ask how I learned that.



#### Local Preview

```
hugo server
```

According to reference 2, there used to be a manual `npm ci` step before this point, but I did not use it. Perhaps newer versions no longer require it.





## II. Upload to GitHub
### 1. Create a Repository
![image.png](https://img.sunnyseed.me/2024/09/10/4569accd95619.png)

### 2、create a new repository on the command line

Enter the directory containing the blog project.

```shell
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/sunnyseed/blog.git
git push -u origin main
```

After later modifications, use:
```shell
git add .
git commit -m "xxx"
git push -u origin main
```

If you use GitHub over SSH, then use:
```shell
git remote add origin git@github.com:sunnyseed/blog.git
```

Important: on GitHub, make sure Cloudflare is granted access to the repository.





## III. Configure Cloudflare

Just follow reference 1, the Cloudflare Pages Hugo deployment guide. The build command I used was the following (I copied it directly, to be honest 😄):

```
hugo -b $CF_PAGES_URL
```

**Additional pitfall:** the `-b` option fixes the `baseURL`, i.e. the site’s base address, to the Cloudflare Pages URL. **If you already have a registered custom domain, you should simply use the default command `hugo` instead.** Otherwise you may end up with incorrect URLs.



After that, just confirm that the build finishes without errors. Then the site can be accessed through the Pages-assigned domain (for example, `myblog-dg4.pages.dev`). Later local updates only need to be pushed; Cloudflare will redeploy automatically.





## IV. Bind a Domain Name

1. In your DNS settings, add a CNAME record (for example `blog`) pointing to the Pages-assigned hostname such as `myblog-dg4.pages.dev`. **Do not include the deployment version number**, or you will need to change the record after every update.

2. In the Pages custom-domain settings, add the corresponding CNAME target, such as `blog.nero-lithos.com`.

After that, the site should be accessible through `blog.nero-lithos.com`.





## V. Image Configuration

### Set the Home-Page “Hero” Image

The home page is usually configured in `content/_index.md`. In its front matter, one may use the `featured_image` parameter to specify the hero image. Open `content/_index.md` (or create it if it does not exist) and add something like:

```yaml
# yaml
title: "Lithos' Blog"
description: "a CUHKSZ survival documentation"
featured_image: '/images/Head.jpg'
```

Replace `images/Head.jpg` with your actual image name, and make sure the file has been uploaded into `static/images`.



### Set a Featured Image for an Individual Post

The featured image of each post is specified in that post’s front matter:

```toml
# toml
title = ' # Grassroot HongKong'
date = 2024-09-10T09:08:58+08:00
draft = false
featured_image = '/images/ymt.jpg'
```



Additional note:

I roughly measured the aspect ratio of the Ananke hero banner at about `1 : 0.28` (around `1905 × 534` at a 1980-pixel width). It does not need to be exact; Hugo will crop the excess lower part automatically.



### Ordinary Images Inside Posts

The usual rendering syntax is: `![caption](image-url)`

For now I use `https://postimg.cc/` as an image host, but if you decide, as I did, to keep a personal domain long-term, you can also host images directly on your own subdomain (for example `images.nero-lithos.com`).



## VI. Comment Functionality

If you have your own server, **Commento** is often the more convenient solution. This post, however, demonstrates the beginner-friendly **Disqus** comment service.

Register a new account on the Disqus site, link it to your blog domain, choose a site **shortname**, and remember it. Then select Universal Code Installation to deploy Disqus. Following the official instructions, we need to modify three files:

- Add the following to `hugo.html`:

  ```html
  [services]
    [services.disqus]
      shortname = 'nero-lithos'
  ```

- In `themes/anake/layouts/_default`, locate `single.html`, which should contain something like the following:

  ```html
  {{ define "header" }}
     {{/* We can override any block in the baseof file be defining it in the template */}}
    {{ partial "page-header.html" . }}
  {{ end }}
  
  {{ define "main" }}
    {{ $section := .Site.GetPage "section" .Section }}
    <article class="flex-l flex-wrap justify-between mw8 center ph3">
      <header class="mt4 w-100">
        <aside class="instapaper_ignoref b helvetica tracked ttu">
            {{/*
            CurrentSection allows us to use the section title instead of inferring from the folder.
            https://gohugo.io/variables/page/#section-variables-and-methods
            */}}
          {{ .CurrentSection.Title }}
        </aside>
        {{ partial "social-share.html" . }}
        <h1 class="f1 athelas mt3 mb1">
          {{- .Title -}}
        </h1>
        {{ with .Params.author | default .Site.Params.author }}
        <p class="tracked">
          {{ $.Render "by" }} <strong>
          {{- if reflect.IsSlice . -}}
              {{ delimit . ", " | markdownify }}
          {{- else -}}
              {{ . | markdownify }}
          {{- end -}}
          </strong>
        </p>
        {{ end }}
        {{/* Hugo uses Go's date formatting is set by example. Here are two formats */}}
        {{ if not .Date.IsZero }}
        <time class="f6 mv4 dib tracked" {{ printf `datetime="%s"` (.Date.Format "2006-01-02T15:04:05Z07:00") | safeHTMLAttr }}>
          {{- .Date | time.Format (default "January 2, 2006" .Site.Params.date_format) -}}
        </time>
        {{end}}
  
        {{/*
            Show "reading time" and "word count" but only if one of the following are true:
            1) A global config `params` value is set `show_reading_time = true`
            2) A section front matter value is set `show_reading_time = true`
            3) A page front matter value is set `show_reading_time = true`
          */}}
        {{ if (or (eq (.Param "show_reading_time") true) (eq $section.Params.show_reading_time true) )}}
          <span class="f6 mv4 dib tracked"> - {{ i18n "readingTime" .ReadingTime }} </span>
          <span class="f6 mv4 dib tracked"> - {{ i18n "wordCount" .WordCount }} </span>
        {{ end }}
      </header>
      <div class="nested-copy-line-height lh-copy {{ $.Param "post_content_classes"  | default "serif"}} f4 nested-links {{ $.Param "text_color" | default "mid-gray" }} {{ cond (eq $.Site.Language.LanguageDirection "rtl") "pl4-l" "pr4-l" }} w-two-thirds-l">
        {{- .Content -}}
        {{- partial "tags.html" . -}}
        <div class="mt6 instapaper_ignoref">
  
        {{ partial "disqus.html" . }}
        </div>
      </div>
  
      <aside class="w-30-l mt6-l">
        {{- partial "menu-contextual.html" . -}}
      </aside>
  
    </article>
  {{ end }}
  ```

- In `themes/anake/layouts/partials`, locate or create `disqus.html`, which should contain the following:

  ```html
  {{- $pc := .Site.Config.Privacy.Disqus -}}
  {{- if not $pc.Disable -}}
  {{ if .Site.Config.Services.Disqus.Shortname }}<div id="disqus_thread"></div>
  <script>
      window.disqus_config = function () {
      {{with .Params.disqus_identifier }}this.page.identifier = '{{ . }}';{{end}}
      {{with .Params.disqus_title }}this.page.title = '{{ . }}';{{end}}
      {{with .Params.disqus_url }}this.page.url = '{{ . | html  }}';{{end}}
      };
      (function() {
          if (["localhost", "127.0.0.1"].indexOf(window.location.hostname) != -1) {
              document.getElementById('disqus_thread').innerHTML = 'Disqus comments not available by default when the website is previewed locally.';
              return;
          }
          var d = document, s = d.createElement('script'); s.async = true;
          s.src = '//' + {{ .Site.Config.Services.Disqus.Shortname }} + '.disqus.com/embed.js';
          s.setAttribute('data-timestamp', +new Date());
          (d.head || d.body).appendChild(s);
      })();
  </script>
  <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
  <a href="https://disqus.com" class="dsq-brlink">comments powered by <span class="logo-disqus">Disqus</span></a>{{end}}
  {{- end -}}
  ```

  Then a Disqus comment section will appear under each blog post and load dynamically.



## Reference

1. [Hugo deployment | Cloudflare Pages docs](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hugo-site/)

2. [sunnyseeds’s personal blog](https://blog.sunnyseeds.net/cn/posts/modify_hero_image_of_hugo_theme/)

3. [A Hugo + Cloudflare Pages blog setup | ayu’s Blog](https://ayurain.com/posts/%E5%9F%BA%E4%BA%8Ehugo%E5%92%8Ccloudflare%E7%9A%84%E5%8D%9A%E5%AE%A2%E6%96%B9%E6%A1%88/)

4. [Ananke: Hugo theme](https://github.com/theNewDynamic/gohugo-theme-ananke)

5. [Fatal error when deploying to Cloudflare - Hugo support thread](https://discourse.gohugo.io/t/fatal-error-when-deploying-to-cloudflare/41368)

