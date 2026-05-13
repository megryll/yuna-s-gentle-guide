import { defineConfig, loadEnv, type Plugin } from "vite";
import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

// Dev-only middleware: routes /api/tts and /api/chat to the same handlers
// the Vercel functions use in production (api/_handlers.mjs). Vite does not
// auto-serve files under /api/, and non-VITE_-prefixed env vars are not loaded
// into process.env by default, so we do both here.
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
          req.url !== "/api/wrap-up" &&
          !req.url?.startsWith("/api/tts?") &&
          !req.url?.startsWith("/api/chat?") &&
          !req.url?.startsWith("/api/wrap-up?")
        ) {
          return next();
        }

        const { handleChat, handleTts, handleWrapUp } =
          await server.ssrLoadModule("/api/_handlers.mjs");

        const protocol = (req.headers["x-forwarded-proto"] as string | undefined) || "http";
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
          path === "/api/tts"
            ? await handleTts(request)
            : path === "/api/wrap-up"
              ? await handleWrapUp(request)
              : await handleChat(request);

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

// Load .env.local at config time so any plugin or build step that reads
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
  server: {
    port: 8080,
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    viteReact(),
    devApiMiddleware(),
  ],
});
