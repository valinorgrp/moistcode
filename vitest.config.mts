import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Mirror Next.js's server webpack config: the "server-only" marker
      // package throws unconditionally when its default export is loaded,
      // which is only safe in the client bundle guard Next.js applies.
      // Route handlers/libs that import "server-only" run fine under plain
      // Node (as they do on Vercel), so point it at the package's no-op
      // build here too.
      "server-only": "server-only/empty.js",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
