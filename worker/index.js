import { readSharedPlan, writeSharedPlan } from "./plan-store.js";

const SHARE_ID = /^[a-zA-Z0-9_-]{12,80}$/;

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  const allowed = !origin || origin === ownOrigin || origin === "https://hogun-nv.github.io" || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "access-control-allow-origin": allowed && origin ? origin : ownOrigin,
    "access-control-allow-methods": "GET, PUT, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...corsHeaders(request) } });
}

async function handlePlan(request, env, id) {
  if (!SHARE_ID.test(id)) return json(request, { error: "invalid_share_id" }, 400);
  if (!env.DB) return json(request, { error: "storage_unavailable" }, 503);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method === "GET") {
    const record = await readSharedPlan(env.DB, id);
    return record ? json(request, record) : json(request, { error: "not_found" }, 404);
  }
  if (request.method === "PUT") {
    if (Number(request.headers.get("content-length") || 0) > 900_000) return json(request, { error: "plan_too_large" }, 413);
    let body;
    try { body = await request.json(); } catch { return json(request, { error: "invalid_json" }, 400); }
    if (!body?.data?.days || !Array.isArray(body.data.days) || body.data.days.length > 14) return json(request, { error: "invalid_plan" }, 400);
    const baseRevision = Number(body.baseRevision);
    if (!Number.isInteger(baseRevision) || baseRevision < 0) return json(request, { error: "invalid_base_revision" }, 400);
    const result = await writeSharedPlan(env.DB, id, body.data, String(body.updatedBy || "anonymous").slice(0, 100), baseRevision);
    if (result.conflict) return json(request, { error: "revision_conflict", ...result.record }, 409);
    return json(request, result.record);
  }
  return json(request, { error: "method_not_allowed" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/plans\/([^/]+)$/);
    if (match) return handlePlan(request, env, decodeURIComponent(match[1]));
    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
