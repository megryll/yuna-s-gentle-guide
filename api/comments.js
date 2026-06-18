import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

// Server-side only: the service-role key bypasses RLS, so the prototype's
// `comments` table can keep RLS enabled (public anon key blocked) while this
// function reads/writes freely. The key never reaches the browser.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

const TABLE = "comments";

// Per-deployment comment isolation: comments left on the feature preview stay
// off production and vice-versa. The git branch (main vs feature/…) is the
// natural key; fall back to Vercel's environment, then "local" for dev.
const CHANNEL =
  process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_ENV || "local";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

// Map a DB row to the shape the client expects (created_at → createdAt ms).
function toClient(row) {
  return {
    id: row.id,
    route: row.route,
    x: row.x,
    y: row.y,
    text: row.text,
    name: row.name ?? "",
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  };
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
  // No store configured (or local dev) — signal unavailable so the client
  // falls back to its localStorage cache.
  if (!supabase) return json(res, 503, { error: "comments store not configured" });

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("channel", CHANNEL)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return json(res, 200, (data ?? []).map(toClient));
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const text = String(body.text ?? "").trim().slice(0, 2000);
      if (!text) return json(res, 400, { error: "text required" });

      const row = {
        route: String(body.route ?? "/").slice(0, 300),
        x: clamp01(body.x),
        y: clamp01(body.y),
        text,
        name: String(body.name ?? "").trim().slice(0, 80),
        channel: CHANNEL,
      };
      const { data, error } = await supabase.from(TABLE).insert(row).select().single();
      if (error) throw error;
      return json(res, 200, toClient(data));
    }

    if (req.method === "DELETE") {
      const { searchParams } = new URL(req.url, "http://localhost");
      const id = searchParams.get("id");
      if (!id) return json(res, 400, { error: "id required" });
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("id", id)
        .eq("channel", CHANNEL);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    res.setHeader("allow", "GET, POST, DELETE");
    return json(res, 405, { error: "method not allowed" });
  } catch (err) {
    return json(res, 500, { error: String(err?.message ?? err) });
  }
}
