import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
export default defineConfig(({ mode }) => {
  const cloudEnabled =
    loadEnv(mode, process.cwd(), "VITE_").VITE_CLOUD_ENABLED === "true";
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: cloudEnabled ? { "/api": "http://127.0.0.1:8787" } : undefined,
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: { include: ["src/tests/**/*.test.ts"] },
  };
});
