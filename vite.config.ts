// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";
import { readFileSync } from "node:fs";

// Dev-only middleware: routes /api/tts and /api/chat to the same handlers
// the Vercel functions use in production (api/_handlers.mjs). Vite does not
// auto-serve files under /api/, and the lovable preset does not load
// non-VITE_-prefixed env vars into process.env, so we do both here.
function devApiMiddleware(): Plugin {
  return {
    name: "yuna-dev-api-middleware",
    apply: "serve",
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), "");
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (
          req.url !== "/api/tts" &&
          req.url !== "/api/chat" &&
          !req.url?.startsWith("/api/tts?") &&
          !req.url?.startsWith("/api/chat?")
        ) {
          return next();
        }

        const { handleChat, handleTts } = await server.ssrLoadModule(
          "/api/_handlers.mjs",
        );

        const protocol =
          (req.headers["x-forwarded-proto"] as string | undefined) || "http";
        const host = req.headers.host || "localhost";
        const url = `${protocol}://${host}${req.url}`;

        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (Array.isArray(v)) headers.set(k, v.join(", "));
          else if (typeof v === "string") headers.set(k, v);
        }

        let body: Buffer | undefined;
        if (req.method !== "GET" && req.method !== "HEAD") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          if (chunks.length) body = Buffer.concat(chunks);
        }

        const request = new Request(url, { method: req.method, headers, body });
        const path = req.url?.split("?")[0];
        const response =
          path === "/api/tts" ? await handleTts(request) : await handleChat(request);

        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        if (response.body) {
          const reader = response.body.getReader();
          // Allow Node to flush each chunk immediately for SSE / audio streaming.
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
      });
    },
  };
}

// Load .env files at config time too, so any plugin or build step that reads
// process.env synchronously can also see them.
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  // .env.local missing in some environments — fine.
}

export default defineConfig({
  cloudflare: false,
  plugins: [devApiMiddleware()],
});
