#!/usr/bin/env node
/**
 * Copy kuromoji dictionary files into public/dict so they are served as
 * static assets at /japanese-learner/dict/ in dev and production. The
 * runtime kuroshiro analyzer fetches them from this URL on first use.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "node_modules", "@sglkc", "kuromoji", "dict");
const dst = path.join(root, "public", "dict");

if (!fs.existsSync(src)) {
  console.warn("[copy-dict] @sglkc/kuromoji not installed; skipping");
  process.exit(0);
}

fs.mkdirSync(dst, { recursive: true });
const files = fs.readdirSync(src).filter((f) => f.endsWith(".dat.gz"));
for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dst, file));
}
console.log(`[copy-dict] copied ${files.length} dict files to public/dict`);
