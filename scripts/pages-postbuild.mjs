// GitHub Pages: serve the SPA shell for deep links and disable Jekyll.
import { existsSync, copyFileSync, writeFileSync } from "node:fs";
const out = [".output/public", "dist/client"].find((d) => existsSync(`${d}/index.html`));
if (!out) throw new Error("index.html not found in build output");
copyFileSync(`${out}/index.html`, `${out}/404.html`);
writeFileSync(`${out}/.nojekyll`, "");
console.log("Pages output ready:", out);
