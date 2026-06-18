import { Redis } from "@upstash/redis";

export const config = { runtime: "nodejs" };

// Vercel↔Upstash integrations inject one of these env-var pairs depending on
// which marketplace flow created the store; accept either.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// All comments live in one hash keyed by id, so deletes are a single HDEL and
// there's no list-rewrite race when several reviewers comment at once.
const KEY = "yuna:comments";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(Math.max(v, 0), 1);
}

export default async function handler(req, res) {
  // No store provisioned yet (or local dev) — signal unavailable so the client
  // falls back to its localStorage cache.
  if (!redis) return json(res, 503, { error: "comments store not configured" });

  try {
    if (req.method === "GET") {
      const map = (await redis.hgetall(KEY)) || {};
      const comments = Object.values(map).sort(
        (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
      );
      return json(res, 200, comments);
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const text = String(body.text ?? "").trim().slice(0, 2000);
      if (!text) return json(res, 400, { error: "text required" });

      const comment = {
        id: globalThis.crypto.randomUUID(),
        route: String(body.route ?? "/").slice(0, 300),
        x: clamp01(body.x),
        y: clamp01(body.y),
        text,
        name: String(body.name ?? "").trim().slice(0, 80),
        createdAt: Date.now(),
      };
      await redis.hset(KEY, { [comment.id]: comment });
      return json(res, 200, comment);
    }

    if (req.method === "DELETE") {
      const { searchParams } = new URL(req.url, "http://localhost");
      const id = searchParams.get("id");
      if (!id) return json(res, 400, { error: "id required" });
      await redis.hdel(KEY, id);
      return json(res, 200, { ok: true });
    }

    res.setHeader("allow", "GET, POST, DELETE");
    return json(res, 405, { error: "method not allowed" });
  } catch (err) {
    return json(res, 500, { error: String(err?.message ?? err) });
  }
}
