/**
 * Generates solid-color PWA icons as valid PNG files using only Node.js built-ins.
 * Output: public/icons/icon-192.png and public/icons/icon-512.png
 *
 * These are #10b981 (QuoteMate green) solid squares — replace with branded
 * artwork later if desired. They are fully valid PWA icons that satisfy Chrome's
 * installability requirements.
 *
 * Run with: node scripts/generate-icons.mjs
 */

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

// ── CRC-32 ────────────────────────────────────────────────────────────────────

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG chunk ─────────────────────────────────────────────────────────────────

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeB, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeB, data, crcBuf]);
}

// ── Solid-colour PNG ──────────────────────────────────────────────────────────

function solidPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit-depth 8, colour-type 2 (RGB), compress/filter/interlace = 0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB

  // One scanline: filter byte 0 (None) + R G B × width
  const row = Buffer.alloc(1 + size * 3);
  row[0] = 0;
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }

  // Stack `size` identical rows and zlib-compress
  const rawRows = Buffer.concat(Array.from({ length: size }, () => row));
  const idat = deflateSync(rawRows, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Write icons ───────────────────────────────────────────────────────────────

// #10b981 = rgb(16, 185, 129)
const R = 16, G = 185, B = 129;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", solidPNG(192, R, G, B));
writeFileSync("public/icons/icon-512.png", solidPNG(512, R, G, B));

console.log("✓  public/icons/icon-192.png  (192×192)");
console.log("✓  public/icons/icon-512.png  (512×512)");
console.log(
  "\nThese are solid #10b981 placeholders. Replace with branded artwork whenever ready."
);
