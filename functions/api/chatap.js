export async function onRequest(context) {
  const { request, env } = context;

  // 只接受 POST
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = env.CHATAP;
  if (!apiKey) {
    return new Response("Missing CHATAP in environment", { status: 500 });
  }

  // 校验调用方来源，避免任意第三方站点/脚本直接调用本接口消耗运营者的 OpenRouter 额度。
  const allowedOrigins = [env.OPENROUTER_SITE_URL, "https://lithos.pages.dev"].filter(Boolean);
  const origin = request.headers.get("Origin");
  const isLocalDev = !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!origin || !(allowedOrigins.includes(origin) || isLocalDev)) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const model = payload.model || "qwen/qwen2.5-7b-instruct";
  const messages = payload.messages || [];
  const temperature = typeof payload.temperature === "number" ? payload.temperature : 0.9;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": request.headers.get("Origin") || env.OPENROUTER_SITE_URL || "https://lithos.pages.dev",
    "X-Title": "ArkPets-ChatAP",
  };

  const upstreamResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      stream: true,
      messages,
      temperature,
    }),
  });

  if (!upstreamResp.ok) {
    const upstreamText = await upstreamResp.text().catch(() => "");
    return new Response(
      JSON.stringify({
        error: "Upstream OpenRouter error",
        keySource: "CHATAP",
        upstreamStatus: upstreamResp.status,
        upstreamBody: upstreamText,
      }),
      {
        status: upstreamResp.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // 直接透传 SSE 流
  const respHeaders = new Headers();
  respHeaders.set("Content-Type", upstreamResp.headers.get("Content-Type") || "text/event-stream");
  respHeaders.set("Cache-Control", "no-store");
  respHeaders.set("X-ChatAP-Key-Source", "CHATAP");
  // 同域 Pages 默认不需要 CORS，但为了本地 wrangler 开发方便加上
  if (origin) {
    respHeaders.set("Access-Control-Allow-Origin", origin);
  }

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    statusText: upstreamResp.statusText,
    headers: respHeaders,
  });
}
