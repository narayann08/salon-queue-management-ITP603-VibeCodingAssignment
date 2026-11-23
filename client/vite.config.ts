import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../", "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:4000";
  return {
    root: fileURLToPath(new URL(".", import.meta.url)),
    plugins: [react()],
    envDir: "../",
    server: {
      port: 5173,
      proxy: {
        "/api": backendUrl,
        "/socket.io": {
          target: backendUrl,
          ws: true,
        },
      },
    },
  };
});
