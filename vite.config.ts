import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Static build for GitHub Pages: `npm run build:pages` (BASE_PATH defaults to /family-nutrition-os/).
const pages = process.env["GITHUB_PAGES"] === "1";
const base = pages ? (process.env["BASE_PATH"] ?? "/family-nutrition-os/") : "/";

export default defineConfig({
  base,
  server: { port: 3000 },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      router: { basepath: base },
      ...(pages ? { spa: { enabled: true, prerender: { outputPath: "/index.html" } } } : {}),
    }),
    ...(pages ? [] : [nitro({ preset: process.env["NITRO_PRESET"] ?? "node-server" })]),
    viteReact(),
  ],
});
