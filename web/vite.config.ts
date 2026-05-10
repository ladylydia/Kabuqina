import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

// Kabuqina web shell. The Tauri window initially loads this static
// app (which runs the onboarding wizard if needed, then redirects to
// the local dashboard server on http://127.0.0.1:PORT).
export default defineConfig({
  plugins: [react(), tailwind()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "esnext",
    sourcemap: false,
  },
});
