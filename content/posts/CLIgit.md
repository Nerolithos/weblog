---
title: "🛠️ Important tools: CLI, shell and git commands"
date: 2024-09-10T08:45:34+08:00
draft: false
summary: "计算机初学者必学的 CLI 基本用法和工作流管理，以及如何处理网络不佳、提交过大、版本控制等常见 git 问题。"
categories: 
- SDS
tags: 
  - 技术
featured_image: "/images/git.jpg"
---



# Easy Shell Commands

</br>

## 路径与目录

### **pwd**

显示当前目录的完整路径。

```
pwd
```

例如输出：

```
/Users/matthew/Documents/weblog
```

### **ls**

列出当前目录内容。

```shell
ls
ls -l
ls -la
```

常用说明：

- ls：只看文件名
- ls -l：详细信息
- ls -la：连隐藏文件一起看，比如 .git、.env

### **cd**

切换目录。

```shell
cd my_directory
cd ..
cd /
cd ~
cd ~/Documents/weblog
cd -
```

补充说明：

- cd ..：回到上一级
- cd ~：回到用户主目录
- cd -：回到上一次所在目录，这个非常好用

### **mkdir**

创建目录。

```shell
mkdir my_directory
mkdir -p a/b/c
```

- -p 可以一次创建多层目录

### **rmdir**

删除**空目录**。

```shell
rmdir my_directory
```

如果目录不空，要用：

```shell
rm -r my_directory
```

如果想强制删 (rm -rf 很危险，删了很难救回来)：

```shell
rm -rf my_directory
```

</br>

## 文件操作

### **touch**

创建空文件，或更新文件时间戳。

```shell
touch file_name.txt
```

### **cat**

查看文件内容。

```shell
cat file_name.txt
```

如果文件很长：(按 q 退出)

```shell
less file_name.txt
```

### **cp**

复制文件或目录。

```shell
cp a.txt b.txt
cp -r src_dir dst_dir
```

### **mv**

移动文件，或重命名。

```shell
mv old.txt new.txt
mv a.txt folder/
```

### **rm**

删除文件。

```shell
rm a.txt
rm -r folder
rm -rf folder
```

</br>

## 运行程序

### **python file_name.py**

运行 Python 文件。

```shell
python file_name.py
python3 file_name.py
```

在 macOS 上很多时候推荐用 python3。

### **pip install**

安装 Python 包。

```shell
pip install pandas
pip install --upgrade pandas
```

如果系统里有多个 Python，常常更稳的是：

```shell
python3 -m pip install pandas
```

这样能确保包安装到你正在用的 Python 上。

</br>

## 网络与进程

### **ping**

测试网络联通。

```shell
ping github.com
```

按 Ctrl + C 结束。

### **Ctrl + C**

中断正在运行的命令。这是终端里最重要的逃生键之一。当然，在 MacOS 中有时候是 Command + C。

### **which**

看某个命令到底来自哪里。

```shell
which python3
which git
```

### **echo**

输出内容，也可用来检查环境变量。

```shell
echo hello
echo $PATH
echo $OPENROUTER_API_KEY
```

### **history**

查看你执行过的命令历史。

```shell
history
```

配合：

```shell
!123
```

可以重复执行第 123 条历史命令。

### **grep**

搜索文本。

```shell
grep "keyword" file.txt
grep -r "keyword" .
```

- -r：递归搜目录

### **find**

找文件。

```shell
find . -name "*.md"
find . -name "sync.sh"
```

</br>

</br>

# Shell 使用中的重要习惯

## 路径里有空格

要么加引号：

```shell
cd "My Folder"
```

要么用反斜杠：

```shell
cd My\ Folder
```

</br>

## Tab 补全

输入一部分后按 Tab，终端会自动补全文件名和目录名。
 这个习惯非常重要。

</br>

## sudo

sudo 会用管理员权限执行命令。
 能不用就不用，尤其不要轻易对不熟悉的命令加 sudo。

</br>

</br>

# Git

## Git 到底是什么

Git 是一个**版本管理系统**。

它能帮你：

- 记录每次修改
- 回滚到旧版本
- 和 GitHub 同步
- 多人协作
- 查出是谁改坏了东西
- 新开分支做实验，不影响主线

你可以把它理解为：给代码、文档、网站内容做“可回溯历史记录”的系统。

</br>

## Git 的三个区域

理解 Git，最重要的是这三个区：
 **1. 工作区（Working Directory）** 你正在改的文件。
 **2. 暂存区（Staging Area）** 你已经挑好、准备提交的文件。
 **3. 仓库历史（Repository）** 已经 commit 进历史的版本。

所以常见流程是：

```
修改文件
→ git add
→ git commit
→ git push
```

</br>

## 新建仓库

```shell
mkdir my_repo
cd my_repo
git init
git branch -M main
touch README.md
git add .
git commit -m "Initial commit"
```

然后去 GitHub 上创建空仓库，再连接远端：

```shell
git remote add origin https://github.com/用户名/仓库名.git
git push -u origin main
```

两边根目录名字可以不同，但是如果本地要改名也不会影响 (建议改名后 `cd ..` 然后重进根目录)。

</br>

## 最常用的日常流水

### **标准安全流程**

```shell
git status
git pull --rebase origin main
git add .
git commit -m "Describe what changed"
git push origin main
```

- git status：看改了什么
- git pull --rebase：先同步远端最新改动
- git add .：把本地修改加入暂存区
- git commit：形成版本
- git push：推到远端

</br>

## .gitignore

`.gitignore` 用来告诉 Git：哪些文件不要追踪

例如：

```
.DS_Store
__pycache__/
*.pyc
.env
node_modules/
dist/
public/
```

常见不该提交的有：

- 缓存文件
- 编译产物
- 构建输出
- 密钥文件
- 本地配置文件

查看某文件为何没被追踪：

```shell
git check-ignore -v 文件名
```

</br>

## git status

```shell
git status
```

常见状态：

- modified：已修改
- deleted：已删除
- untracked files：新文件，还没被 Git 管
- changes to be committed：已暂存，准备 commit
- changes not staged for commit：改了但还没 add

</br>

## git add 不只是 git add .

暂存一个文件

```shell
git add a.txt
```

暂存全部

```shell
git add .
```

暂存所有（包括删除）

```shell
git add --all
```

交互式暂存，超级好用：

```shell
git add -p
```

这个可以让你一段一段地挑选要不要提交。
 适合“一个文件里改了很多内容，但你只想提交其中一部分”。

</br>

## git commit

```shell
git commit -m "Fix navbar search behavior"
```

建议 commit 信息写清楚。

  **比较好的写法**

```shell
git commit -m "Remove English search pages"
git commit -m "Sync translated blog posts"
git commit -m "Fix Cloudflare deployment config"
```

修改刚才那次提交

```shell
git commit --amend
```

如果只是改提交信息：

```shell
git commit --amend -m "Better commit message"
```

</br>

## git diff

看未暂存修改

```shell
git diff
```

看已暂存但还没 commit 的修改

```shell
git diff --cached
```

对比某个文件

```shell
git diff a.txt
```

对比某个 commit

```shell
git diff HEAD~1 HEAD
```

</br>

## git log

查看 git 工作流日志：

```shell
git log
git log --oneline
git log --oneline --graph --decorate --all
```

推荐常用：

```shell
git log --oneline --graph --decorate -n 20
```

非常清楚。

</br>

## git show

看某个提交具体改了什么：

```shell
git show HEAD
git show 提交哈希
```

只看摘要：

```shell
git show --stat --summary HEAD
```

</br>

## git branch

 查看分支

```shell
git branch
git branch -a
```

- git branch：本地分支
- git branch -a：本地 + 远端

新建分支

```shell
git branch feature-1
```

切换分支

```shell
git checkout feature-1
```

新建并切换

```shell
git checkout -b feature-1
```

现在也可以用更新写法：

```shell
git switch -c feature-1
git switch main
```

</br>

## git merge  和 git rebase

### **git merge**

把另一个分支合进来，保留分叉历史。

```shell
git checkout main
git merge feature-1
```

优点：

- 历史真实
- 比较安全
   缺点：
- 历史图会更复杂

### **git rebase**

把当前分支“挪到”另一个分支最新位置之后。

```shell
git checkout feature-1
git rebase main
```

优点：

- 历史更直
- 看起来更干净
   缺点：
- 会改写历史
- 不适合乱用在已经共享出去的分支上



#### **merge 像：**

“把两条分叉的路重新接起来”

#### **rebase 像：**

“假装你一开始就是从最新主线出发开发的”

</br>

## 什么时候用 merge，什么时候用 rebase

- 个人项目中，你可以多用：

```
git pull --rebase origin main
```

这样历史更整洁。

- 多人协作共享分支时，不要随便对别人也在用的分支做 rebase。

</br>

## git pull

```shell
git pull origin main
```

它其实相当于：

```shell
git fetch origin
git merge origin/main
```

如果你想保持历史更整洁，更推荐：

```shell
git pull --rebase origin main
```

</br>

## git push

```shell
git push origin main
```

第一次推一个新分支：

```shell
git push -u origin feature-1
```

-u 的意思是建立上游关系，以后就可以直接：

```shell
git push
git pull
```

</br>

## SSH 和 HTTPS 的区别

### **1. HTTPS**

远端地址长这样：

```
https://github.com/用户名/仓库.git
```

优点：

- 配置简单
- 一般浏览器能上 GitHub，就容易理解这个方式
- 适合新手
   缺点：
- 经常要求 token / 凭证
- 在某些网络环境下，大 push 更容易出问题
- 长连接可能被代理、校园网、公司网中断

### **2. SSH**

远端地址长这样：

```
git@github.com:用户名/仓库.git
```

优点：

- 配好后通常更省心
- 不用每次输用户名密码/token
- 很适合长期开发
   缺点：
- 初始配置稍复杂
- 某些网络会拦截 22 端口

</br>

## SSH 配置完整流程

### **1. 看有没有现成密钥**

```shell
ls ~/.ssh
```

如果已有 id_ed25519 和 id_ed25519.pub，可能已经配过。

### **2. 生成 SSH key**

```shell
ssh-keygen -t ed25519 -C "你的邮箱"
```

一路回车即可。

### **3. 启动 ssh-agent**

```shell
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### **4. 复制公钥**

```shell
cat ~/.ssh/id_ed25519.pub
```

把输出内容复制到 GitHub 的 settings/SSH keys 页面。

### **5. 测试**

```shell
ssh -T git@github.com
```

成功会看到类似欢迎信息：

```
Hi <USERNAME>! You've successfully authenticated, but GitHub does not provide shell access.
```

### **6. 切 remote 到 SSH**

```shell
git remote set-url origin git@github.com:用户名/仓库.git
git remote -v
```

</br>

## SSH 22 端口不通怎么办

GitHub 还支持通过 ssh.github.com:443。
 在 ~/.ssh/config 里加：

```shell
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  TCPKeepAlive yes
  ServerAliveInterval 30
  ServerAliveCountMax 6
```

这样 SSH 会强制走 443，更适合很多受限网络。

</br>

## core.compression

### **默认情况**

Git push 时默认打开 compression，会把对象压缩后发给远端。

```shell
git config core.compression 1
```

优点：传输体积更小
 缺点：在某些网络环境下，压缩 + 长连接 + 大推送 反而更容易出错；CPU 开销更大

### **临时降低问题概率**

```
git config core.compression 0
```

意思是：不压缩，减少传输过程中的复杂性，有时对“push 到一半断开”有帮助。

恢复默认：

```shell
git config --unset core.compression
```

</br>

## 其他和网络相关的 Git 设置

### **http.postBuffer**

适合 HTTPS 推送时调大发送缓冲区：

```shell
git config http.postBuffer 524288000
```

这是 500MB。

### **pack.threads**

降低打包线程数，有时更稳：

```shell
git config pack.threads 1
```

### **强制 HTTP/1.1**

某些环境下比 HTTP/2 稳：

```shell
GIT_HTTP_VERSION=HTTP/1.1 git push origin main
```

</br>

## push / pull 失败时如何排查

1. 先看本地是否已经 commit

```shell
git log --oneline -n 5
```

1. 看本地比远端多了哪些提交

```shell
git fetch origin
git log --oneline origin/main..HEAD
```

如果这里有提交，说明只是**还没 push 上去**。

1. 看这次 commit 改了什么

```shell
git show --stat --summary HEAD
```

1. 看远端仓库

```shell
git remote -v
```

### 如果大 push 老失败

优先考虑：

- **先用手机的移动信号试一试**，经常是最有用的方案。
- 如果在用 HTTP，改 SSH
- SSH 走 443
- core.compression 0
- 最后保底方案：**把一个大 commit 拆小**

</br>

## 如何拆小提交

如果你已经做了一个很大的 commit，但 push 老失败，比如终端返回以下信息：

```shell
Connection to ssh.github.com closed by remote host.
send-pack: unexpected disconnect while reading sideband packet
fatal: the remote end hung up unexpectedly
```

说明 commit 没问题，但由于网速或者带宽限制被赶回来了。

1. 撤销 commit，保留改动

```shell
git reset HEAD~1
```

1. 分批提交

```shell
git add content/posts_EN
git commit -m "Remove English posts"

git add layouts static
git commit -m "Remove English layout and search pages"

git add .
git commit -m "Sync remaining changes"
```

1. 分批 push

```shell
git push origin main
```

这样成功率会高很多。

</br>

## git reset

### 1. 只撤销 commit，保留修改和暂存

```shell
git reset --soft HEAD~1
```

### 2. 撤销 commit，保留修改但取消暂存

```shell
git reset HEAD~1
```

这是最常用的“拆 commit”方式。

### 3. 彻底回到旧版本，修改也不要了

```shell
git reset --hard HEAD~1
```

危险，会丢改动。比如强制拉远端覆盖本地：

```shell
git fetch origin
git reset --hard origin/main
git pull
```

</br>

## git restore

如果你只想恢复某个文件，恢复工作区文件：

```shell
git restore a.txt
```

取消暂存：

```shell
git restore --staged a.txt
```

</br>

## git revert

如果某个 commit 已经 push 到远端了，不要乱 reset --hard，而要用：

```shell
git revert 提交哈希
```

这会生成一个“反向提交”，安全得多。

</br>

## git reflog (救命工具)

这个特别重要，它记录了 HEAD 走过的历史。
 哪怕你 reset --hard 了，很多时候也能找回来。

例如：

```shell
git reflog
git reset --hard 某个旧哈希
```

</br>

## git blame

查某一行是谁改的：

```shell
git blame file.txt
git blame -L 10,20 file.txt
```

</br>

## git bisect

排查“到底哪次提交引入了 bug”。

```shell
git bisect start
git bisect bad
git bisect good 某个旧提交
```

然后 Git 会带你二分定位问题提交。这个是进阶工具，但很有用。

</br>

## 个人博客 / 网站项目怎么用 Git

对于 Vite 或者 Hugo 等等框架的博客 / 静态站项目，我建议：

1. 每次 commit 不要太大，一件事一个 commit。
2. 构建产物尽量别混进源代码提交，比如：dist/、public/、缓存、临时 json 索引。要分清哪些是源文件，哪些是构建结果。
3. push 前先看一眼

```shell
git status
git diff --cached
```

1. 删除大量文件前先看统计

```shell
git show --stat --summary HEAD
```

1. 网络不稳时优先 SSH + 443，比 HTTPS 更适合长期开发或者没有稳定环境的在校大学生。

</br>

## 个人 Git 工作流

如果你是个人项目，推荐这样：

```shell
git status
git pull --rebase origin main
git add -p
git commit -m "Clear message"
git push origin main
```

如果改动很大：

```shell
git status
git add 部分目录
git commit -m "Part 1"
git push origin main

git add 下一部分
git commit -m "Part 2"
git push origin main
```

</br>

## 实用的经验

Git 最容易出问题的，不是命令本身，而是：

- 不看 git status
- 不看 git diff
- 一次 commit 太大
- 不知道自己是要 reset、revert 还是 restore
- 网络不稳时还一直硬推大提交

只要你养成下面三个习惯，稳定性会高很多：

```shell
git status
git diff --cached
git log --oneline -n 5
```
