/**
 * Magic-byte sniffing for admin image uploads.
 * Never trust client Content-Type or filename extension alone.
 */

export type SniffedImageType = "image/jpeg" | "image/png" | "image/webp";

export interface SniffResult {
  mime: SniffedImageType;
  extension: "jpg" | "png" | "webp";
}

export function sniffImageMagic(bytes: Uint8Array): SniffResult | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", extension: "webp" };
  }

  return null;
}

export async function sniffImageFile(file: Blob): Promise<SniffResult | null> {
  const buf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return sniffImageMagic(buf);
}
