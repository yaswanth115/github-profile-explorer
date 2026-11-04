/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // BASE_PATH lets static hosts that serve from a sub-path (e.g. GitHub Pages
  // project sites: /github-profile-explorer/) set the public base at build time.
  const env = loadEnv(mode, ".", "");
  return {
    base: env.BASE_PATH || "/",
    plugins: [react()],
    resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
