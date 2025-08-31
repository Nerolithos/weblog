---
title:     "How to personalize Streamlit URL?"
date:      2025-08-31T10:50:30+08:00
draft:     false
summary:   "一次在没有外网 VPS 的前提下试图将 Streamlit app 指向自定义域名的尝试"
categories:
  - SDS
tags: [帮助]
featured_image: "/images/st.jpg"
---



#  Streamlit 的域名显示问题(未解决)

前情提要：我用 streamlit 制作了一个 AI 辅助 CUHKSZ 答疑（龙大生存指南）工具的 APP，希望将 Streamlit 分配的域名指向我自己的私有域名（比如你现在在看这篇文章时浏览器里写着的的那个域名）。




## TAKE 1：直接暴力增加 CNAME 记录
![最上面那一条就是我新建的 CNAME ](https://i.postimg.cc/QxBYcQtW/25083101.png)

- 我的域名要求展示“你的域名”的证书；而 Streamlit 只给 \*.streamlit.app 颁证。无效(出现 400/403/404  一类的循环/响应报错)



## TAKE 2：反向代理？

1、我在 Cloudflare 仪表盘创建了一个新的 workers 应用。
![](https://i.postimg.cc/tRvm1SXj/25083102.png)





2、用最简洁的默认 fetch() 函数脚本开始，返回 hello world。部署到公网后可以在编辑栏写入所需的反向代理脚本。
![](https://i.postimg.cc/bvX14bpW/25083102x3.png)





3、反向代理中无法直接指明被指向的对象(用户访问的网站，以 ai.nero-lithos.com 为例)，因为没有配置路由的功能。如果强行写固定 URL 进去，只能起到“在 Triggers 触发的路由中，只允许这个写入的 URL 反代” 的功能，如需要，则补充这一行：
`const ALLOWED_HOST = "ai.nero-lithos.com";`
**无论如何，都需要在 Workers/Triggers 下配置反代 URL：ai.nero-lithos.com/\***
![](https://i.postimg.cc/fyPH6LHL/25083103.png)





4、写入脚本后再次部署，随后在左边栏中重新(点击)从 Workers/Workers&Pages 中找到刚才新建的 Workers 应用，选择上方导航栏的 Settings(设置)，然后选择第一项 Domains & Routes，增加一个新的 custom 路由记录(ai.nero-lithos.com)。
![](https://i.postimg.cc/sxx66S4q/25083104.png)
Cloudflare 会随机生成一个 CNAME 记录，等待一会应该就可以访问被代理对象了。如果你像我一样试图手动配置过 CNAME 记录，请去 DNS 下删除那条记录(否则会冲突)。
![](https://i.postimg.cc/HxBv93Xb/25083105.png)





5、**现在，我试图访问 ai.nero-lithos.com 发现可以访问(解析)**，然而域名被强行跳回了 futuregate.streamlit.app。这似乎是 Streamlit 的默认逻辑，如果用户访问时 Host 不是它自己的域名（\*.streamlit.app），会在响应里返回重定向 (302/301) 或者在页面内嵌的资源链接里写回它的官方域名。
我可能需要：

- 拦截并修改 Streamlit 返回的 Location Header，强行导向“\*.streamlit.app”到目标 URL
-  修改 Cookie/HTML 硬编码写入的“\*.streamlit.app”相关字段





6、 修改后发现没有显著变化。尝试 trouble-shoot：curl -I --max-redirs 0 https://ai.nero-lithos.com/ ，发现 Worker 收到的 Location 为“https://share.streamlit.io/-/auth/app?redirect_uri=…”**因此，Streamlit 的返回方式是先跳回主站，由主站再分配 .app 类子域名**。我的拦截是无效的，需要修改负责“Location改写”的部分。

```js
let loc = resHeaders.get("Location") || resHeaders.get("location");
if (loc) {
  try {
    const u = new URL(loc, upstreamUrl);
//这里省略拦截 \*.streamlit.app 的代码段
    if (u.hostname.endsWith("share.streamlit.io") && u.searchParams.has("redirect_uri")) {
      let redirectTarget = new URL(u.searchParams.get("redirect_uri"));
      if (redirectTarget.hostname.endsWith(".streamlit.app")) {
        redirectTarget.hostname = ALLOWED_HOST;
        redirectTarget.protocol = "https:";
        u.searchParams.set("redirect_uri", redirectTarget.toString());
        resHeaders.set("Location", u.toString());
      }
    }
  } catch (err) {
    console.log("Failed to parse Location:", loc, err);
  }
}
```





7、试图访问，发现卡死。问题不在于单个 Location 或 HTML 内容，而在于**服务端会话**：认证成功与否由 share.streamlit.io 域下的 Cookie 决定；我的域**拿不到**，上游永远不承认，因此永远无法通过 Streamlit 认证，也永远无法开始渲染，所以一直是白屏。**结论：这个问题在 Streamlit 环境下且没有外网 VPS 时绝对无解。**





8、所以说，**Streamlit Cloud 不支持白标自定义域**。继续用 Workers/Nginx 只会在 share.streamlit.io 的认证链中循环。要么接受官方域名；要么把迁移到**支持自定义域**的托管（Railway/Render/Fly/VPS 等）。



