---
title: "🌐 Attempting to Fetch CUHKSZ Mailbox Data"
date: 2024-09-11T09:26:58+08:00
summary: "A shareable but unresolved attempt to automate LGU mailbox access."
categories: 
  - 帮助
tags: 
  - 技术
---



## Preface

**Important: if this is your first time using the `exchangelib` module, do not test it directly with your institutional or university account. Use another account first and make sure it is safe.**

This topic began when I tried to write a Python script for my CUHKSZ mailbox so that OpenAI could automatically analyze and summarize emails into a log-like digest. However, as a beginner, I got stuck at the very first step: pulling the emails out of Outlook. Is there anyone who can reliably achieve this over the long term with basic authentication (that is, directly entering the account and password)? And if one uses OAuth for a desktop application, how should authorization actually be configured? It is quite troublesome.

In any case, I found that I was unable to complete interaction between `exchangelib` and an Outlook mailbox using any authentication method.

Note: the naming format for the methods below is “authentication scheme – Python package.”



## Method 1: Basic Auth – exchangelib (highly unstable)

**Although I did succeed a few times, this method is generally considered no longer viable (and I was never able to finish documenting a stable command-line procedure for it).** Online discussions say the following:
* [stackoverflow discussion](https://stackoverflow.com/questions/74058525/python-exchangelib-invalid-credentials)
* [github issues](https://github.com/ecederstrand/exchangelib/issues)
* “Microsoft is gradually deprecating support for basic authentication (username and password), so using only a username and password to access the EWS API is usually invalid.”
  ——GPT4

Although many sources online claim that Office 365 has already disabled the traditional username-and-password EWS authentication mode, it seems that not everyone is completely unable to use it. I did manage to access it successfully two or three times and download part of my mailbox.

**For users in mainland China, this appears to be related to VPN conditions. Only certain nodes on certain proxy servers at certain times can avoid errors. In my own case, the Osaka node of 12vpn occasionally worked.** But in general, it still throws `UnauthorizedError: Invalid credentials` every now and then. (See below.)

**In fact, the issue seems to be caused by certain undocumented protective mechanisms on Microsoft's servers. Microsoft appears to have relatively strict network-security requirements. Some IP addresses may be classified by Microsoft as “unsafe,” which triggers risk control and blocks access. This issue remained unresolved as of 2024-08-17.**

**A piece of evidence for this speculation can be found in Microsoft's own statement:**
[see the “Outlook.com IMAP connection errors” section near the bottom of this page](https://support.microsoft.com/zh-cn/office/outlook-com-%E7%9A%84-pop-imap-%E5%92%8C-smtp-%E8%AE%BE%E7%BD%AE-d088b986-291d-42b8-9564-9c414e2aa040)


### Although I do not recommend trying it, the concrete steps are still listed below:

1. Make sure your computer has Python 3.11.9 or above installed, along with Miniconda or Anaconda. Then run `pip install exchangelib` in the terminal.

2. In a suitable local directory, and with a suitable editor (such as Sublime Text or PyCharm), write the following code and save it as `test.py`.
```shell
from exchangelib import Credentials, Account

credentials = Credentials("#your email address", "#your email password")
account = Account("#your email address", credentials=credentials, autodiscover=True)

for item in account.inbox.all().order_by("-datetime_received")[:100]:
    print(item.subject, item.sender, item.datetime_received)
```
(The code comes from the GitHub homepage of `exchangelib`; see the reference section.)

3. Run `python test.py` in the terminal.

4. If an error occurs and the last line of the error message looks like this:
```shell
UnauthorizedError: Invalid credentials for https://autodiscover.hotmail.com/autodiscover/autodiscover.svc
```
then you may try disabling server autodiscovery and replacing the full content of `test.py` with the following:
```shell
from exchangelib import Credentials, Account, DELEGATE, Configuration

credentials = Credentials('#your email address', '#your email password')

config = Configuration(
    server='#your mailbox server address',  
    credentials=credentials
)

account = Account(
    primary_smtp_address='#your email address',
    config=config,
    autodiscover=False,
    access_type=DELEGATE
)

for item in account.inbox.all().order_by('-datetime_received')[:100]:
    print(item.subject, item.sender, item.datetime_received)
```
If no error occurs, you can skip Step 4. If a different error appears, check whether you followed the instructions correctly or whether your network connection is normal.

5. Run the script again. If it still fails, and the final line of the error message looks like this:
```shell
UnauthorizedError: Invalid credentials for https://outlook.office365.com/EWS/Exchange.asmx
```
then open the above URL in any browser (`https://outlook.office365.com/EWS/Exchange.asmx`), enter your account and password as required, enable EWS, then return to the terminal and run `test.py` again.

6. If the terminal still throws errors, or if that page cannot be opened, remains blank, or fails authentication, then that is actually the “normal” outcome. If anyone has discovered a way to use basic authentication **reliably and stably over the long term**, please share it for the benefit of everyone else.



## Method 2: OAuth 2.0 – exchangelib

Please log in to the Microsoft cloud portal: [Microsoft Azure](https://portal.azure.com). If this is your first registration, I recommend **not** using your school or institutional account. Then register an application and consult [this guide to Microsoft Graph and Outlook OAuth 2.0 authorization](https://www.whuanle.cn/archives/21385). (The example in that link is for a web application, but what I wanted was a desktop application so that I could implement the functions mentioned at the beginning. So that route also turned out not to work for me.)



## Other ideas

One possible workaround is to use **IFTTT** to forward Outlook emails in bulk to another mailbox, after which IFTTT can generate an email log in Google Sheets. However, CUHKSZ emails often contain images or other non-textual messages, and such content is difficult to store meaningfully in spreadsheet form. In the end, I could not continue with this approach either.



## Reference

https://www.whuanle.cn/archives/21385

https://github.com/ecederstrand/exchangelib/issues

https://github.com/ecederstrand/exchangelib/discussions/954

https://stackoverflow.com/questions/74058525/python-exchangelib-invalid-credentials
