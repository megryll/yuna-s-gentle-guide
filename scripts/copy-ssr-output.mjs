// Vercel's function tracer reliably follows relative imports from api/* but
// the `functions.includeFiles` glob for dist/server/** has not been packing
// the SSR bundle into the deployment. Sidestep the glob entirely: after vite
// build, mirror dist/server into api/_ssr so api/index.js can import the
// handler via a normal relative path (./_ssr/server.js) that the tracer
// always follows.
//
// _ssr/ uses an underscore prefix because Vercel's api/ scanner skips files
// it does not consider a function entrypoint; the directory ships inside the
// /api/index function bundle but is not exposed as its own endpoint.

import { rm, cp, access } from "node:fs/promises";

const src = "dist/server";
const dest = "api/_ssr";

try {
  await access(src);
} catch {
  console.error(`copy-ssr-output: expected ${src} to exist after vite build`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await cp(src, dest, { recursive: true });
console.log(`copy-ssr-output: ${src} -> ${dest}`);
