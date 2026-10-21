/**
 * Generates public/og-default.png — the site-wide Open Graph / Twitter card.
 *
 * 1200x630 is the size Facebook, LinkedIn, WhatsApp and X expect. The output
 * MUST be a raster PNG: those platforms will not render an SVG.
 *
 * Run with: npm run generate:og
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outPath = resolve(root, "public/og-default.png");

const WIDTH = 1200;
const HEIGHT = 630;

// Brand palette — keep in sync with tailwind.config.ts
const NAVY = "#062B87";
const NAVY_DEEP = "#031B4E";
const GOLD = "#E5B400";
const WHITE = "#FFFFFF";

const escape = (value) =>
  value.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

const churchName = process.env.OG_CHURCH_NAME ?? "Glorious Gospel Centre Church";
const tagline =
  process.env.OG_TAGLINE ?? "Worship · Community · Teaching · Outreach";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${NAVY}"/>
  <rect x="0" y="${HEIGHT - 14}" width="${WIDTH}" height="14" fill="${GOLD}"/>
  <rect x="72" y="150" width="6" height="330" fill="${GOLD}"/>
  <text x="120" y="248" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="62" font-weight="bold" fill="${WHITE}">${escape(churchName)}</text>
  <text x="120" y="320" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="32" fill="${GOLD}">${escape(tagline)}</text>
  <text x="120" y="392" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="26" fill="#C9D6F2">Kitengela, Nairobi · Kenya</text>
</svg>`;

await mkdir(dirname(outPath), { recursive: true });
const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(outPath, png);

console.log(`Wrote ${outPath} (${WIDTH}x${HEIGHT}, ${Math.round(png.length / 1024)} KB)`);