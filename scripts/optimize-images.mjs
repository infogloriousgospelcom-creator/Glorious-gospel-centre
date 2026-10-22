/**
 * Image optimization script for GGCC website.
 *
 * Compresses oversized ministry camera JPGs and hero banners to web-optimized sizes.
 * Generates WebP versions alongside the original JPGs so next/image can serve them.
 *
 * Usage: node scripts/optimize-images.mjs
 *
 * This script is idempotent — safe to run multiple times.
 */
import sharp from "sharp";
import { readdir, stat, mkdir, writeFile, readFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const PUBLIC_DIR = join(import.meta.dirname, "..", "public");

/** Images that serve as full-bleed hero backgrounds (need up to 1920px) */
const HERO_MAX_WIDTH = 1920;
/** Images used in cards/grids (800px is generous for a 33vw card on a 1440px screen) */
const CARD_MAX_WIDTH = 800;
/** WebP quality — 82 is visually near-lossless for photographs */
const WEBP_QUALITY = 82;
/** JPG quality for compressed originals */
const JPG_QUALITY = 78;

/**
 * Recursively find all image files in a directory.
 */
async function findImages(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findImages(fullPath)));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Get the relative path from public/ for display purposes.
 */
function relativePath(filePath) {
  return filePath.replace(PUBLIC_DIR + "\\", "").replace(PUBLIC_DIR + "/", "");
}

/**
 * Compress and resize a single image, producing:
 *  - An optimized JPG (replacing the original)
 *  - A WebP version alongside it
 *
 * Returns { originalSize, jpgSize, webpSize } in bytes.
 */
async function optimizeImage(filePath, maxWidth) {
  const originalStat = await stat(filePath);
  const originalSize = originalStat.size;

  // Skip tiny files (<100KB) — they're already fine
  if (originalSize < 100 * 1024) {
    return { originalSize, jpgSize: originalSize, webpSize: originalSize, skipped: true };
  }

  const ext = extname(filePath).toLowerCase();
  const dir = filePath.replace(ext, "");
  const webpPath = dir + ".webp";

  // Read the original
  const input = await readFile(filePath);

  // Get metadata to decide if we need to resize
  const metadata = await sharp(input).metadata();
  const needsResize = metadata.width > maxWidth;

  // Pipeline: resize (if needed) → compress
  let pipeline = sharp(input);
  if (needsResize) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  // Write optimized JPG (replace original)
  const jpgBuffer = await pipeline
    .jpeg({ quality: JPG_QUALITY, progressive: true, mozjpeg: true })
    .toBuffer();

  // Write WebP version
  let webpPipeline = sharp(input);
  if (needsResize) {
    webpPipeline = webpPipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }
  const webpBuffer = await webpPipeline
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Only write if we actually reduced size
  if (jpgBuffer.length < originalSize) {
    await writeFile(filePath, jpgBuffer);
  }
  await writeFile(webpPath, webpBuffer);

  return {
    originalSize,
    jpgSize: jpgBuffer.length,
    webpSize: webpBuffer.length,
    skipped: false,
  };
}

/**
 * Optimize the logo (PNG) — reduce dimensions and compress.
 */
async function optimizeLogo() {
  const logoPath = join(PUBLIC_DIR, "logo.png");
  const originalStat = await stat(logoPath);
  const input = await readFile(logoPath);

  const metadata = await sharp(input).metadata();
  // Logo should be at most 128px for web use
  const maxSize = 128;

  let pipeline = sharp(input);
  if (metadata.width > maxSize || metadata.height > maxSize) {
    pipeline = pipeline.resize({ width: maxSize, height: maxSize, fit: "inside" });
  }

  const buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();

  if (buffer.length < originalStat.size) {
    await writeFile(logoPath, buffer);
  }

  // Also generate WebP version
  let webpPipeline = sharp(input);
  if (metadata.width > maxSize || metadata.height > maxSize) {
    webpPipeline = webpPipeline.resize({ width: maxSize, height: maxSize, fit: "inside" });
  }
  const webpBuffer = await webpPipeline.webp({ quality: 85 }).toBuffer();
  await writeFile(join(PUBLIC_DIR, "logo.webp"), webpBuffer);

  return {
    originalSize: originalStat.size,
    pngSize: buffer.length,
    webpSize: webpBuffer.length,
  };
}

async function main() {
  console.log("=== GGCC Image Optimization ===\n");

  // 1. Find all ministry images
  const ministryDirs = [
    "CHILDREN'S MINISTRY",
    "MEN'S MINISTRY",
    "PRAYER MINISTRY",
    "WOMEN",
    "WORSHIP MINISTRY",
    "YOUTH MINISTRY",
  ];

  let totalOriginal = 0;
  let totalOptimized = 0;
  let totalWebp = 0;
  let count = 0;

  for (const dir of ministryDirs) {
    const dirPath = join(PUBLIC_DIR, dir);
    try {
      const images = await findImages(dirPath);
      if (images.length === 0) continue;

      console.log(`📁 ${dir} (${images.length} images)`);
      for (const img of images) {
        const result = await optimizeImage(img, HERO_MAX_WIDTH);
        const name = basename(img);
        if (result.skipped) {
          console.log(`  ⏭  ${name} (already small, skipped)`);
        } else {
          const saving = ((1 - result.webpSize / result.originalSize) * 100).toFixed(0);
          console.log(
            `  ✅ ${name}: ${(result.originalSize / 1024 / 1024).toFixed(1)}MB → ` +
            `JPG ${(result.jpgSize / 1024).toFixed(0)}KB, WebP ${(result.webpSize / 1024).toFixed(0)}KB (${saving}% saved)`
          );
          totalOriginal += result.originalSize;
          totalOptimized += result.jpgSize;
          totalWebp += result.webpSize;
          count++;
        }
      }
      console.log();
    } catch {
      console.log(`  ⚠️  Directory not found: ${dir}\n`);
    }
  }

  // 2. Optimize hero banners
  console.log("🖼  Hero banners");
  const heroFiles = ["hero_church_banner_fullpulpit.jpg", "hero_church_banner_fullpulpit_overlay.jpg"];
  for (const file of heroFiles) {
    const filePath = join(PUBLIC_DIR, file);
    try {
      const result = await optimizeImage(filePath, HERO_MAX_WIDTH);
      const name = file;
      if (result.skipped) {
        console.log(`  ⏭  ${name} (already small, skipped)`);
      } else {
        const saving = ((1 - result.webpSize / result.originalSize) * 100).toFixed(0);
        console.log(
          `  ✅ ${name}: ${(result.originalSize / 1024 / 1024).toFixed(1)}MB → ` +
          `JPG ${(result.jpgSize / 1024).toFixed(0)}KB, WebP ${(result.webpSize / 1024).toFixed(0)}KB (${saving}% saved)`
        );
        totalOriginal += result.originalSize;
        totalOptimized += result.jpgSize;
        totalWebp += result.webpSize;
        count++;
      }
    } catch (e) {
      console.log(`  ⚠️  ${file}: ${e.message}`);
    }
  }
  console.log();

  // 3. Optimize logo
  console.log("🏷  Logo");
  try {
    const logoResult = await optimizeLogo();
    console.log(
      `  ✅ logo.png: ${(logoResult.originalSize / 1024).toFixed(0)}KB → ` +
      `PNG ${(logoResult.pngSize / 1024).toFixed(0)}KB, WebP ${(logoResult.webpSize / 1024).toFixed(0)}KB`
    );
  } catch (e) {
    console.log(`  ⚠️  logo.png: ${e.message}`);
  }
  console.log();

  // Summary
  console.log("=== Summary ===");
  console.log(`Images processed: ${count}`);
  console.log(`Original total:   ${(totalOriginal / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Optimized JPG:    ${(totalOptimized / 1024 / 1024).toFixed(1)} MB`);
  console.log(`WebP versions:    ${(totalWebp / 1024 / 1024).toFixed(1)} MB`);
  if (totalOriginal > 0) {
    const saving = ((1 - totalWebp / totalOriginal) * 100).toFixed(0);
    console.log(`Total WebP saving: ${saving}%`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
