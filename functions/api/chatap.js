const MAX_BODY_BYTES = 128 * 1024;
const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 96 * 1024;
const MAX_TOTAL_MESSAGE_CHARS = 112 * 1024;
const MAX_REQUESTS_PER_MINUTE = 8;
const FREE_MODEL = "openrouter/free";
const requestBuckets = new Map();

function normalizeOrigin(value) {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch (_) {
    return "";
  }
}

function getAllowedOrigins(env) {
  const origins = new Set([
    "https://blog.nero-lithos.com",
    "https://lithos.pages.dev",
  ]);
  [env.OPENROUTER_SITE_URL, ...(env.CHATAP_ALLOWED_ORIGINS || "").split(",")]
    .map(normalizeOrigin)
    .filter(Boolean)
    .forEach((origin) => origins.add(origin));
  return origins;
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return isLocalDev || getAllowedOrigins(env).has(origin);
}

function responseHeaders(origin, contentType = "text/plain; charset=utf-8") {
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const cutoff = now - 60_000;
  const recent = (requestBuckets.get(ip) || []).filter((time) => time > cutoff);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    requestBuckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  requestBuckets.set(ip, recent);

  if (requestBuckets.size > 500) {
    for (const [key, times] of requestBuckets) {
      if (!times.some((time) => time > cutoff)) requestBuckets.delete(key);
    }
  }
  return true;
}

export async function onRequest(context) {
  const { request, env } = context;
  const origin = normalizeOrigin(request.headers.get("Origin"));
  const originAllowed = isAllowedOrigin(origin, env);

  if (request.method === "OPTIONS") {
    if (!originAllowed) {
      return new Response("Forbidden", { status: 403, headers: responseHeaders("") });
    }
    const headers = responseHeaders(origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: responseHeaders(originAllowed ? origin : "") });
  }

  // Origin 仅作为浏览器侧的第一层约束；真正的费用保护由免费模型白名单、
  // 请求上限和部署层 rate limiting 共同承担。
  if (!originAllowed) {
    return new Response("Forbidden", { status: 403, headers: responseHeaders("") });
  }

  const apiKey = env.CHATAP;
  if (!apiKey) {
    return new Response("Chat service unavailable", { status: 503, headers: responseHeaders(origin) });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "local";
  if (!checkRateLimit(ip)) {
    const headers = responseHeaders(origin);
    headers.set("Retry-After", "60");
    return new Response("Too Many Requests", { status: 429, headers });
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return new Response("Payload Too Large", { status: 413, headers: responseHeaders(origin) });
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
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return new Response("Payload Too Large", { status: 413, headers: responseHeaders(origin) });
    }
    payload = JSON.parse(rawBody);
  } catch (e) {
    return new Response("Invalid JSON body", { status: 400, headers: responseHeaders(origin) });
  }

  if (!payload || typeof payload !== "object" || !Array.isArray(payload.messages) ||
      payload.messages.length < 1 || payload.messages.length > MAX_MESSAGES) {
    return new Response("Invalid messages", { status: 400, headers: responseHeaders(origin) });
  }

  let totalChars = 0;
  const allowedRoles = new Set(["system", "user", "assistant"]);
  const messages = [];
  for (const message of payload.messages) {
    if (!message || !allowedRoles.has(message.role) || typeof message.content !== "string" ||
        message.content.length < 1 || message.content.length > MAX_MESSAGE_CHARS) {
      return new Response("Invalid messages", { status: 400, headers: responseHeaders(origin) });
    }
    totalChars += message.content.length;
    if (totalChars > MAX_TOTAL_MESSAGE_CHARS) {
      return new Response("Messages too large", { status: 413, headers: responseHeaders(origin) });
    }
    messages.push({ role: message.role, content: message.content });
  }

  // 不接受客户端指定任意付费模型；统一走 OpenRouter 的免费模型路由。
  const model = FREE_MODEL;
  const requestedTemperature = typeof payload.temperature === "number" ? payload.temperature : 0.7;
  const temperature = Math.max(0, Math.min(1.2, requestedTemperature));

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": origin || env.OPENROUTER_SITE_URL || "https://blog.nero-lithos.com",
    "X-Title": "ArkPets-ChatAP",
  };

  let upstreamResp;
  try {
    upstreamResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        stream: true,
        messages,
        temperature,
        max_tokens: 1200,
      }),
    });
  } catch (_) {
    return new Response("Upstream service unavailable", { status: 502, headers: responseHeaders(origin) });
  }

  if (!upstreamResp.ok) {
    return new Response(
      JSON.stringify({
        error: "Upstream OpenRouter error",
        upstreamStatus: upstreamResp.status,
      }),
      {
        status: upstreamResp.status,
        headers: responseHeaders(origin, "application/json; charset=utf-8"),
      }
    );
  }

  // 直接透传 SSE 流
  const respHeaders = new Headers();
  respHeaders.set("Content-Type", upstreamResp.headers.get("Content-Type") || "text/event-stream");
  respHeaders.set("Cache-Control", "no-store");
  respHeaders.set("X-Content-Type-Options", "nosniff");
  respHeaders.set("Vary", "Origin");
  respHeaders.set("Access-Control-Allow-Origin", origin);

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    statusText: upstreamResp.statusText,
    headers: respHeaders,
  });
}
