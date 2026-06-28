import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "node:fs";

// Flat repo: copy PWA assets from the project root into dist/ after build,
// since there is no public/ folder.
const copyPwaAssets = () => ({
  name: "copy-pwa-assets",
  closeBundle() {
    for (const f of ["manifest.json", "service-worker.js", "icon-192.png", "icon-512.png"]) {
      if (existsSync(f)) copyFileSync(f, "dist/" + f);
    }
  },
});

export default defineConfig({
  publicDir: false,
  plugins: [react(), copyPwaAssets()],
  build: { outDir: "dist" },
});
