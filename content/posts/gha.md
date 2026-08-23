---
title: "关于 GitHub 个人首页建设和功能介绍"
date: 2026-08-20T11:45:14+08:00
draft: false
summary: "关于 GitHub 个人首页的一些介绍，包括GitHub 个人介绍的Shields.io-Badges生成器和单人能最容易完成的五个 GitHub Achievements 指南。"
categories: 
- 帮助
tags: 
- 技术
featured_image: "/images/gha.jpg"
---



# GitHub Profile & Badge Maker

![](https://i.postimg.cc/J035rcyt/jie-ping2026-08-23-15-35-03.png)

GitHub 主页上可以通过编辑同名仓库(比如我叫 Nerolithos，就在“Nerolithos”仓库)的 README.md 来给主页右边自定义内容，比如我做了profile，以下工具可以上传你自己的 Logo，自动生成 Shields.io Badge，就是我图中那些五颜六色的标志：

{{< badge-maker >}}



</br>

</br>

# GitHub Achievements

GitHub 除了 Contribution Graph 那一片看着令人上瘾的小绿格之外，在 Profile 页面还藏着一套  [Achievements](https://github.com/drknzz/GitHub-Achievements) (成就) 系统。

![](https://i.postimg.cc/fb6cYgmq/jie-ping2026-08-23-15-35-18.png)

有些成就相当困难，比如 **Starstruck** 最基础等级就要求自己的 Repository 获得 16 个 Star；但另外一些成就其实并不要求你成为知名开源项目的 Contributor。只要有一个自己的公开 Repository（部分情况下再准备一个自己实际控制的 GitHub 小号）就可以独立完成。



截至 2026 年，目前仍可获得且最便于独立完成的五个成就是：

| **Achievement**     | **条件**                        | **难度** | **是否需要小号** | 达成后是否延迟 |
| ------------------- | ------------------------------- | -------- | ---------------- | -------------- |
| Quickdraw           | Issue / PR 创建后 5 分钟内关闭  | ★        | 否               | 基本不会       |
| YOLO                | Merge 一个未经 Review 的 PR     | ★        | 否               | 基本不会       |
| Pull Shark          | 自己创建的 PR 被 Merge          | ★★       | 否               | 有可能         |
| Pair Extraordinaire | Merge 含 Co-author commit 的 PR | ★★       | 是               | 非常可能       |
| Galaxy Brain        | Discussion 中的回答被接受       | ★★★      | 是               | 基本不会       |



需要特别说明：GitHub 并没有承诺这些 Achievement 实时发放，也没有公开全部后台判定逻辑。因此本文介绍的是正常 GitHub 功能如何触发这些行为，而不是保证某个操作执行后几秒钟一定出现徽章。不要为了刷数量制造大量垃圾 Issue、PR 或 Discussion；请在自己的仓库中测试。

------

</br>

## 准备

建议创建一个正常的 **Public Repository**，例如：

```text
github-achievement-lab
```

初始化一个 README 即可。

如果使用本地 Git：

```bash
git clone <你的仓库地址>
cd github-achievement-lab
```

后面的 YOLO、Pull Shark 和 Pair Extraordinaire 都可以在这个 Repository 中完成。

如果希望真正做到“不麻烦任何其他人”，还可以准备一个自己控制的 GitHub 小号。Pair Extraordinaire 需要 GitHub 能识别出另一个 co-author；Galaxy Brain 则天然涉及“提问者”和“回答者”两个身份。

</br>

## Quickdraw

这是整个 GitHub Achievement 系统中最容易获得的成就之一。

条件非常简单：**在创建一个 Issue 或 Pull Request 后的 5 分钟内将其关闭**。最简单的方法甚至不需要 Git (零 CLI)。

进入自己的公开 Repository：

```text
Issues
→ New issue
```

创建一个正常的测试 Issue，例如：

```text
Title: Test
Testing GitHub issue workflow.
```

点击：

```text
Submit new issue
```

然后立即：

```text
Close issue
```

整个过程通常一分钟都不需要。这个成就一般在用户达成后会立即发放。

</br>

## YOLO

触发条件是：**Merge 一个没有经过 Code Review 的 Pull Request。**

也就是说，创建 PR 之后不要找 Reviewer，也不要让其他账号 Approve，直接 Merge。

先打开终端，在仓库目录位置从 main 或 master 出发创建一个新 branch：

```bash
git switch -c TestYolo
```

修改任意被追踪的文件，以 README 为例：

```bash
echo "YOLO test" >> README.md
git add .
git commit -m "Test YOLO achievement"
git push -u origin TestYolo
```

请确保远端（GitHub）和你的本地同步后再修改。这样修改本地后其版本一定新于线上，GitHub 的自动 compare 就会**允许自动合并** (相当于覆盖远端)，无需 review。

然后进入 GitHub，此时会在仓库页显示一行黄字，表示有新分支，点击：

```text
Compare & pull request
→ Create pull request
```

不要添加 Reviewer（但是可以乱写一点评价）

直接：

```text
Merge pull request
→ Confirm merge
```

最后本地切回来（为了干净收尾，非达成成就的必要步骤）：

```shell
git switch main
git pull origin main
git branch -d TestYolo
```



完成后也不会有延迟，立刻发放成就。注意 YOLO 实际上奖励的是一种在正式团队项目里通常**不值得鼓励**的行为。生产环境中，重要代码应经过 Code Review；所以如果只是体验 Achievement，且只在自己的个人测试 Repository 中这么做。

</br>

## Pull Shark

Pull Shark 的要求也非常直接：**让自己创建的 Pull Request 被 Merge**。所以可以顺便和 YOLO 一起完成。基础等级门槛为 **2 个 merged PR**，之后还有更高等级：

```text
Base      2
Bronze   16
Silver  128
Gold   1024
```

**刚才为了 YOLO 创建的 PR 已达成其中一个**，再在同一个仓库重复一次“分支-修改-提交-合并”即可。

两个正常 merged PR 中，只要其中一个未经 Review，就可以同时积累 Pull Shark，并满足 YOLO 的行为条件。注意 Pull Shark 可能需要等待一段时间。如果超过48 小时没反应，可以在别的仓库再尝试一次，参考这个问题的[相关讨论](https://github.com/orgs/community/discussions/204461)。

</br>

## Pair Extraordinaire

这是也不难，条件是：**Co-author commits on merged pull requests.**

Git 本身支持在 Commit Message 中加入：

```text
Co-authored-by: Name <email@example.com>
```

GitHub 会读取这个 Git trailer，并把对应账号识别为共同作者。因此，如果有一个自己控制的 GitHub 小号，就可以单人完整测试这个机制。

只要有不止一个邮箱账号就可以开小号，不需要多个绑定的手机号，甚至可以用学校/工作邮箱，因为邮箱失效后账号不会失效，只是无法登录了。

假设：

```text
主账号：MainAccount
小号：AltAccount
```

首先务必进入小号：

```text
Settings
→ Emails
```

确认一个已经由该账号验证的邮箱。

然后主账号创建 branch：

```bash
git switch main
git pull origin main
git switch -c xxx
```

修改后，关键在 Commit (注意<>符号要保留)：

```bash
git add .
git commit -m "Add pair test
Co-authored-by: AltAccount <alt-account@example.com>"
```

然后：

```bash
git push -u origin xxx
```

创建 Pull Request 并正常 Merge。如果你的小号本身不活跃，这会是五个成就中等待时间最长的，因为 GitHub 有达成条件的审核。

### 如何确认 Co-author 已生效？

点击绿色 Code 按钮下面一行的commit message (按我的例子就是"Add pair test") 进入最终 Commit 页面，顶部应该明确显示类似：

```text
MainAccount and AltAccount committed ...
```

或者，如果 GitHub 仓库右下角已经显示你的两个账号的头像，而且小号也成为 Repository Contributor，那也能证明整条链已被 GitHub 识别成功。

即两条这些都确认达成，但**Achievement 却没有出现**也是正常的。2026 年 GitHub Community 有多起 Pull Shark / Pair Extraordinaire 已满足条件但迟迟不出现的报告。社区通常把 **24–48 小时**视作比较常见的处理窗口，也有人报告两天，而 2026 年 8 月的讨论甚至直接提到 Achievement 后台同步可能需要 **一天到一周**。另有用户等待更久后最终通过报告 GitHub Support 人工处理。因此，如果 commit 页面已经正确显示两名作者，不应因为徽章没有立即出现就判断操作失败。

相关成就检测故障报告：

https://github.com/orgs/community/discussions/203994

https://github.com/orgs/community/discussions/202976

https://github.com/orgs/community/discussions/40386

https://github.com/orgs/community/discussions/37806

</br>

## Galaxy Brain

Galaxy Brain 比前面四个稍微麻烦一点，因为它使用的是 **GitHub Discussions**。

基础条件通常记录为：**2 个回答被标记为 Accepted Answer。**

注意说的不是：Issue Comment 或 Pull Request Review，而是 Repository 的：

```text
Discussions → Q&A
```

因此首先进入自己的测试 Repository：

```text
Settings
→ Features
→ Discussions
```

开启 Discussions。

然后需要两个身份，例如：小号创建一个 Q&A Discussion，例如询问这个 Repository 本身的真实问题。然后切换到主账号，给出有效回答。最后切回提问的小号账号，将该回答”Mark as answer“

基础 Galaxy Brain 通常需要 **2 个 Accepted Answers**，因此需要两个有效的 Q&A。



因为 GitHub Discussions 的 Achievement 判断比普通 Issue 更特殊，而且 Community Discussions 与 Repository Discussions 的计数行为曾出现不少混淆。

因此最稳妥的方式是：

```text
自己的 Public Repository
        ↓
开启 Discussions
        ↓
Q&A Category
        ↓
账号 A 提问
        ↓
账号 B 回答
        ↓
A Mark as answer
```

重复两次。

如果只是为了验证功能，问题和答案也应该有真实内容，而不是创建几十条 `"test"`、`"hello"`。GitHub 的 Achievement 本质上是为了鼓励正常的平台行为，大量制造垃圾活动没有必要，也可能被系统忽略。

</br>

## 我的 Achievement 为什么没有立刻出现？

这是完成这些操作后最容易让人误判的地方。GitHub Profile 的 Contribution Graph 更新很快，于是很容易让人产生一种错觉：“我操作完成了，Achievement 应该马上亮。”

实际上两者并不是一套实时机制，从 GitHub Community 2023—2026 年的反馈看，可以观察到一个审核流程：

```text
符合条件
   ↓
GitHub 记录事件
   ↓
Achievement 后台处理 / 索引
   ↓
Profile Achievement 更新
```

最后一步可能明显滞后。

社区报告中能看到：有人几乎立即获得；有人 Pull Shark 约 24–48 小时；有人说 Pair Extraordinaire 要等2～8 天；2026 年 7–8 月尤其有多起 Pull Shark / Pair Extraordinaire 延迟报告。我自己完成 Pair Extraordinaire 后也等待了 7 天才出现 Achievement。

所以我建议采用一个非常简单的判断方式：

```text
< 48 h 正常等待
2–7 days 可能是后台延迟，继续观察
> 7 days 重新核对条件，或再次完成
```



