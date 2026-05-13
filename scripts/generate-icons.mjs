/**
 * Generates QuoteMate PWA icons using sharp (already available via Next.js).
 * Renders the existing logo mark (speech bubble + dollar sign) centered on
 * a solid #10B981 background at 192×192 and 512×512.
 *
 * Run with: node scripts/generate-icons.mjs
 */

import { createRequire } from "module";
import { mkdirSync } from "fs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

// ── SVG template ──────────────────────────────────────────────────────────────
// Replicates the same paths used in src/app/icon.tsx (viewBox 0 0 40 40).
// The inner <svg> is centered and sized to 55% of the total icon — this keeps
// the artwork well inside the "safe zone" for maskable icons (inner 80%).

function makeSVG(size) {
  const logoSize = Math.round(size * 0.55);
  const offset = Math.round((size - logoSize) / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <!-- Solid green background — fills the full square for maskable -->
  <rect width="${size}" height="${size}" fill="#10B981"/>
  <!-- Logo mark, scaled via nested viewBox (identical paths to icon.tsx) -->
  <svg x="${offset}" y="${offset}" width="${logoSize}" height="${logoSize}" viewBox="0 0 40 40">
    <!-- Speech bubble background -->
    <path
      d="M13 14h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H17l-4 3v-3h-1a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2z"
      fill="white" opacity="0.3"/>
    <!-- Dollar sign S-curve -->
    <path
      d="M19.5 16.5c-2.2 0-3.7 1.2-3.7 3 0 3.4 5.4 2 5.4 3.7 0 .6-.7 1-1.7 1s-1.8-.4-2.2-1.2"
      stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- Dollar sign vertical ticks -->
    <path
      d="M19.5 15v1.5M19.5 23.2v1.5"
      stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
</svg>`;
}

// ── Generate ──────────────────────────────────────────────────────────────────

mkdirSync("public/icons", { recursive: true });

for (const size of [192, 512]) {
  const svg = Buffer.from(makeSVG(size));
  const outPath = `public/icons/icon-${size}.png`;
  await sharp(svg).png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`✓  ${outPath}  (${size}×${size})`);
}

console.log("\nIcons contain the QuoteMate logo mark on #10B981 background.");
console.log("Replace these files at any time — manifest.ts references the same paths.");
