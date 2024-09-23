---
title: "# 龙大邮箱抓取尝试"
date: 2024-09-11T09:26:58+08:00
categories: 
  - 帮助
tags: 
  - 技术
---



## 前言

**注意，如果您第一次使用 exchangelib 模块，请勿直接使用单位或学校账号！请另外测试，确保安全。**

本议题起源于我试图为我的龙大邮箱编一个 Python 代码，实现用 OpenAI 自动分析总结邮件，生成日志摘要。但由于我是个初学者，在第一步(从 Outlook 上把邮件弄下来)时就卡壳了。是否有人可以长期用基础认证方法(输入账号密码)实现这一功能？OAuth 申请桌面应用程序时如何赋权？难搞。

无论如何，我发现我无法用任何一种认证方法完成以 exchangelib 与 outlook 邮箱进行交互。

注释：方案命名的格式为“认证方案-python包”



## 方案一：Basic Auth-exchangelib(非常不稳定)

**虽然我成功过，但该方案被普遍认为不再可行(而且我也没办法把具体实现效果的命令行写完)**，这些是网络上的说法：
* [stackoverflow discussion](https://stackoverflow.com/questions/74058525/python-exchangelib-invalid-credentials)
* [github issues](https://github.com/ecederstrand/exchangelib/issues)
* “Microsoft 正在逐步淘汰基本身份验证（用户名和密码）的支持，因此仅使用用户名和密码访问 EWS API 通常是无效的。”
  ——GPT4

虽然网上声称 Office 365 关闭了传统的“用户名密码” EWS 认证模式，但似乎不是所有人都无法按照这个方法操作，我就成功访问过(两三次)，并将部分邮件拉下来了。

**对于中国大陆的用户，这被验证似乎与VPN有关。只有个别代理服务器的个别节点在个别时间可以不报错。我使用 12vpn 的 Osaka 节点有时可以访问成功。**但基本上隔三差五就会给 UnauthorizedError: Invalid credentials 的报错。(见下文)

**但事实上，这实际上是由微软服务器某些不为人知的保护机制导致的。微软对网络安全的要求似乎比较高。某些IP地址可能会被微软认定为“不安全”，并触发风控，拒绝访问。这个问题尚未被解决(截止至2024.8.17)**

**以上猜想的证据，参见微软官方的声明：**
[此链接页面最下方的“Outlook.com IMAP 连接错误”一栏](https://support.microsoft.com/zh-cn/office/outlook-com-%E7%9A%84-pop-imap-%E5%92%8C-smtp-%E8%AE%BE%E7%BD%AE-d088b986-291d-42b8-9564-9c414e2aa040)


### 虽然不建议尝试，以下仍给出具体方法：

1、保证您的电脑上有3.11.9及以上的 python 以及 miniconda或anaconda等。在终端中运行 pip install exchangelib。

2、在本地合理位置，合理编辑器(如sublime text, PyCharm等)中写入以下代码并保存为test.py。
```shell
from exchangelib import Credentials, Account

credentials = Credentials("#你的邮箱地址", "#你的邮箱密码")
account = Account("#你的邮箱地址", credentials=credentials, autodiscover=True)

for item in account.inbox.all().order_by("-datetime_received")[:100]:
    print(item.subject, item.sender, item.datetime_received)
```
（代码来自 exchangelib 的 GitHub 首页，见 reference)

3、在终端中运行 python test.py。

4、如果报错，且报错内容中最后一行有类似于以下内容：
```shell
UnauthorizedError: Invalid credentials for https://autodiscover.hotmail.com/autodiscover/autodiscover.svc
```
那么可以尝试关闭服务器自动寻找功能，将 test.py 中的内容全部修改为以下：
```shell
from exchangelib import Credentials, Account, DELEGATE, Configuration

credentials = Credentials('#你的邮箱地址', '#你的邮箱密码')

config = Configuration(
    server='#你的邮箱的服务器地址',  
    credentials=credentials
)

account = Account(
    primary_smtp_address='#你的邮箱地址',
    config=config,
    autodiscover=False,
    access_type=DELEGATE
)

for item in account.inbox.all().order_by('-datetime_received')[:100]:
    print(item.subject, item.sender, item.datetime_received)
```
如果没有报错，跳过第4步。如果报其他错误，请检查您是否按要求操作或者您的网络是否正常。

5、再次运行，如果依旧报错，且报错内容中最后一行有类似于以下内容：
```shell
UnauthorizedError: Invalid credentials for https://outlook.office365.com/EWS/Exchange.asmx
```
那么，在任意浏览器中访问上述网址(https://outlook.office365.com/EWS/Exchange.asmx), 并按要求输入账号、密码，开启EWS，之后刷新终端并重新运行 test.py。

6、如果终端再次报错或者上述网页无法访问、白屏、无法通过验证等，那就是“正常反应”。对于发现自己可以**长期、稳定**使用 basic authentication 的人来说，还请分享经验，造福大家。



## 方案二：OAuth2.0-exchangelib

请登录到微软云门户：[Microsoft Azure](https://portal.azure.com)，若初次注册，建议**不要用**学校或单位账号，然后进行应用注册。之后参见[Microsoft Graph、outlook 授权 Auth2.0 指北](https://www.whuanle.cn/archives/21385)。(链接中的范例为 Web 应用程序，但我希望申请桌面应用，方便使用我一开始说的那些功能，所以，又行不通。)



## 其他思路

可以使用 **IFTTT** 的功能，从outlook邮箱批量向其邮箱转发邮件，IFTTT 可以进而在 Google Sheets 上生成邮件日志，但由于龙大特别喜欢发图片或者非文本信件，而非文本信息很难以表格形式储存，所以我最终也没法用这种方案做下去。




## Reference

https://www.whuanle.cn/archives/21385

https://github.com/ecederstrand/exchangelib/issues

https://github.com/ecederstrand/exchangelib/discussions/954

https://stackoverflow.com/questions/74058525/python-exchangelib-invalid-credentials
