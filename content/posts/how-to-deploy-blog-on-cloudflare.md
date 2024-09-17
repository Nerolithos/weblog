---
title: '如何在 cloudflare 上部署 Hugo 构架的博客'
date: 2024-09-10T23:34:08+08:00
summary: '一直听说建博客可以薅 github 和 cloudflare 羊毛，而且很容易实现。真正做一遍却过程曲折，网上的文章，有坑。'
tags: 
  - 技术
---

一直听说建博客可以薅 github 和 cloudflare 羊毛，而且很容易实现。真正做了一遍，竟发现网上找到的文章，都有坑。

包括 hugo、cloudflare 官网，以及 GPT 的说辞。

**前提：你的终端 cli 得能够较为稳定的 访问 github。**

（否则，即便照着官网文章逐字逐句操作也会任意变形......别说我没提醒你）



## 一、hugo init 博客项目

### 安装 hugo

```shell
brew install hugo # MacOS
```

### 创建 hugo 站点

```shell
hugo new site <your_blog_project_name> 
# 这将会创建一个名为 your_blog_project_name 的项目
```

### 配置 hugo 主题

1、从项目的根目录中，启动 hugo 模块系统（如果您还没有这样做）：

```shell
hugo mod init github.com/<your_user>/<your_project>
```

2、进入我们刚创建的 hugo 站点文件夹里, 打开 **hugo.toml** 文件(某些版本也叫 **config.toml**  )

～ 这里有一个坑，ayu's 例子中用的 newsroom theme 似乎有问题：github.com/onweru/newsroom

按下面修改：

```toml
baseURL = 'https://blog.sunnyseeds.net/'  # 你购买的域名
defaultContentLanguage = "zh-cn" # 默认语言
defaultContentLanguageInSubdir = true
languageCode = 'zh-cn'
title = "sunnyseeds' Blog" # Blog title 
theme = ["github.com/theNewDynamic/gohugo-theme-ananke"] # 你选择的主题
hasCJKLanguage = true # CJK 为中国, 日本, 韩国的缩写
canonifyurls = true
pagination.pagerSize = 6

[module]
[[module.imports]]
  path = "github.com/theNewDynamic/gohugo-theme-ananke"

```

[Ananke: Hugo 主题](https://github.com/theNewDynamic/gohugo-theme-ananke)里有一个更详细的例子，可以控制主题的方方面面，我暂时没有使用

### 拉取 主题 仓库到本地

在你的 Hugo 网站根目录内运行：


```
git init

git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke


```

注意：git submodule add 用于将另一个 Git 仓库作为子模块添加到现有的 Git 仓库中。子模块的提交和更新是通过主仓库的 **.gitmodules** 文件来管理的。这个很可能就是下面报错的原因（使用submodule 才会有 .gitmodules 文件，嵌套 git 不好带啊）：



![image.png](https://img.sunnyseed.me/2024/09/10/3025d116d27d1.png)


#### 创建新帖子
```
hugo new content posts/hello-world.md
```
修改 contents\posts\hello-world.md

注意，要删除 `draft = true` 这一行



#### 本地预览

```
hugo server
```

按照 2、[在部署到 Cloudflare 时发生致命错误 - HUGO 支持文档](https://discourse.gohugo.io/t/fatal-error-when-deploying-to-cloudflare/41368) 这一步之前还有手动 `npm ci` 处理过程，但我没有使用，可能新版不需要？

## 二、上传 github
### 1、生成 repository
![image.png](https://img.sunnyseed.me/2024/09/10/4569accd95619.png)

### 2、create a new repository on the command line

进入blog 所在目录

```shell
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/sunnyseed/blog.git
git push -u origin main
```

之后再次修改的话：
```shell
git add .
git commit -m "xxx"
git push -u origin main
```

如果是使用 ssh 登录 github，则要使用：
```shell
git remote add origin git@github.com:sunnyseed/blog.git
```

## 三、设置 cloudflare

按照 1、[Hugo 部署 | Cloudflare Pages 文档](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hugo-site/) 设置即可，其中构建命令（我照抄的，不知为啥😄）：

```
hugo -b $CF_PAGES_URL
```

补充，又是坑：-b 是固定 baseurl 的意思（就是网站的 基本 URL，固定成 cf page 的地址），如果你有注册网址的话，用默认的：`hugo` 才行，这么写会导致错误的，当时我还没反应过来。



随后确认在 构建 时，没有报错即可，就可以使用 pages 分配的域访问了（比如 myblog-dg4.pages.dev）。本地更新后只需要，push 一下，cf 是自动更新发布的。

## 四、绑定域名

1. 在 域注册 中加一个 CNAME (比如 blog )，指向 pages 分配的域名比如 myblog-dg4.pages.dev，注意，不要包括版本号。

2. 在 pages 的 自定义域中，加入一个指向 CNAME （blog.sunnyseeds.net） 的记录。

就可以访问 （blog.sunnyseeds.net）使用了。



## 后续问题

1. 分段必须要双回车？
2. 一定要图床么？
3. 主题怎么设置？
4. 评论怎么使用？
5. 如何将 wordpress 博客，无痛迁移？



## reference

1、[Hugo 部署 | Cloudflare Pages 文档](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hugo-site/)

2、[在部署到 Cloudflare 时发生致命错误 - HUGO 支持文档](https://discourse.gohugo.io/t/fatal-error-when-deploying-to-cloudflare/41368)

3、[基于 hugo 和 cloudflare Page 的博客方案 | ayu's Blog](https://ayurain.com/posts/%E5%9F%BA%E4%BA%8Ehugo%E5%92%8Ccloudflare%E7%9A%84%E5%8D%9A%E5%AE%A2%E6%96%B9%E6%A1%88/)

4、[Ananke: Hugo 主题](https://github.com/theNewDynamic/gohugo-theme-ananke)

