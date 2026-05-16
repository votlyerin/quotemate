/**
 * Generates QuoteMate PWA icons using the canvas package.
 * Produces a solid #10B981 green square with a bold white "Q" centered inside.
 *
 * Run with: node scripts/generate-icons.js
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // ── Background ──────────────────────────────────────────────────────────────
  // Full-bleed green square — fills the entire canvas including corners so the
  // OS mask (circle, squircle, etc.) always clips to green, never transparent.
  ctx.fillStyle = "#10B981";
  ctx.fillRect(0, 0, size, size);

  // ── White "Q" ───────────────────────────────────────────────────────────────
  // Font size at 62% of the icon keeps the letter comfortably inside the
  // maskable-icon safe zone (inner 80% circle) at both 192 and 512.
  const fontSize = Math.round(size * 0.62);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Use actual bounding box metrics to true-center the glyph vertically
  // (textBaseline "middle" can be slightly off for capital letters).
  const metrics = ctx.measureText("Q");
  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;
  const y = (size + ascent - descent) / 2;

  ctx.fillText("Q", size / 2, y);

  return canvas.toBuffer("image/png");
}

// ── Output ────────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const buffer = generateIcon(size);
  const outPath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(
    `✓  public/icons/icon-${size}.png  (${size}×${size}, ${buffer.length} bytes)`
  );
}

console.log('\nDone. Bold white "Q" on #10B981 green background.');
