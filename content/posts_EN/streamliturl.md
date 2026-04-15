---
title:     "🌐 How to personalize Streamlit URL?"
date:      2025-08-31T10:50:30+08:00
draft:     false
summary:   "An attempt to point a Streamlit app to a custom domain without using a public VPS."
categories:
  - SDS
tags: [help]
featured_image: "/images/st.jpg"
---



# The Streamlit domain-display problem (unsolved)

Background: I built an AI-assisted CUHKSZ Q&A app with Streamlit for my “CUHKSZ Survival Handbook” project, and I wanted the Streamlit-assigned domain to point to my own private domain name (for example, the one you see in the browser while reading this article).



## TAKE 1: Brutally adding a CNAME record directly
![The topmost row is the CNAME record I created](https://i.postimg.cc/QxBYcQtW/25083101.png)

- My domain requires a certificate issued for “your domain,” whereas Streamlit only issues certificates for `*.streamlit.app`. This does not work and leads to looped or invalid responses such as 400/403/404 errors.



## TAKE 2: Reverse proxy?

1. I created a new Workers application in the Cloudflare dashboard.
![](https://i.postimg.cc/tRvm1SXj/25083102.png)





2. I started with the simplest default `fetch()` script returning hello world. After deployment to the public Internet, the editor can then be used to insert the required reverse-proxy script.
![](https://i.postimg.cc/bvX14bpW/25083102x3.png)





3. In a reverse-proxy setup, I cannot directly specify the target being proxied (for instance, the website visited by the user, such as `ai.nero-lithos.com`), because routing is not configured by default. If a fixed URL is hard-coded, the effect is merely that only the URL written there is allowed to be proxied under the route triggered by Triggers. If needed, add the following line:
`const ALLOWED_HOST = "ai.nero-lithos.com";`
**In any case, the reverse-proxy URL must be configured under Workers/Triggers as `ai.nero-lithos.com/*`.**
![](https://i.postimg.cc/fyPH6LHL/25083103.png)





4. After writing the script, deploy again. Then, in the left sidebar, go back to the Workers application you just created under Workers / Workers & Pages, select the top navigation tab `Settings`, then choose `Domains & Routes`, and add a new custom route record (`ai.nero-lithos.com`).
![](https://i.postimg.cc/sxx66S4q/25083104.png)
Cloudflare will randomly generate a CNAME record, and after a short wait the proxied target should become accessible. If, like me, you previously tried to configure a CNAME record manually, you should delete that DNS record first, otherwise there will be a conflict.
![](https://i.postimg.cc/HxBv93Xb/25083105.png)





5. **At this point, I found that `ai.nero-lithos.com` could indeed be resolved and visited**, but the domain was forcibly redirected back to `futuregate.streamlit.app`. This appears to be Streamlit's default logic: if the `Host` header is not one of its own domains (`*.streamlit.app`), it returns a redirect (302/301), or else rewrites embedded resource links inside the page back to its official domain.
What I might need to do is:

- intercept and rewrite the `Location` header returned by Streamlit, forcing `*.streamlit.app` to become my target URL;
- rewrite Cookie/HTML fields where `*.streamlit.app` is hard-coded.





6. After attempting such modifications, nothing changed substantially. I then tried to troubleshoot using `curl -I --max-redirs 0 https://ai.nero-lithos.com/` and found that the `Location` received by the Worker was `https://share.streamlit.io/-/auth/app?redirect_uri=...` **Therefore, Streamlit's actual workflow is to redirect back to the main site first, and only then let the main site assign the `.app` subdomain.** My interception was therefore ineffective, and the part responsible for rewriting `Location` needs to be changed.

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





7. When I tried to visit the site again, it got stuck. The problem is not a single `Location` header or a piece of HTML content, but the **server-side session**: whether authentication succeeds depends on cookies under the `share.streamlit.io` domain. My custom domain **cannot obtain those cookies**, so the upstream service never recognizes the session, meaning Streamlit authentication can never succeed and rendering can never even begin. The result is a permanent white screen. **Conclusion: under Streamlit's environment and without a public VPS, this is fundamentally unsolvable.**





8. In other words, **Streamlit Cloud does not support white-label custom domains**. Using Workers or Nginx will only keep you looping inside the authentication chain of `share.streamlit.io`. So the options are either to accept the official domain, or to migrate to a hosting solution that **does support custom domains** (such as Railway, Render, Fly, or a VPS).
