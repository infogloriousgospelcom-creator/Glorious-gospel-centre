import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/json-ld";
import { sniffImageMagic } from "@/lib/file-magic";
import { isAllowedCmsMediaUrl, isSafeHttpsUrl, isSafeStoragePath } from "@/lib/safe-url";

describe("serializeJsonLd", () => {
  it("escapes script-breaking characters", () => {
    const malicious = {
      name: "</script><script>alert(1)</script>",
      amp: "A & B",
    };
    const html = serializeJsonLd(malicious);
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c");
    expect(html).toContain("\\u003e");
    expect(html).toContain("\\u0026");
    expect(JSON.parse(html)).toEqual(malicious);
  });
});

describe("file magic sniffing", () => {
  it("accepts JPEG / PNG / WebP magic bytes", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageMagic(jpeg)?.mime).toBe("image/jpeg");

    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImageMagic(png)?.mime).toBe("image/png");

    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImageMagic(webp)?.mime).toBe("image/webp");
  });

  it("rejects SVG / HTML / executable masquerading as images", () => {
    const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    expect(sniffImageMagic(svg)).toBeNull();

    const html = new TextEncoder().encode("<!DOCTYPE html><html></html>");
    expect(sniffImageMagic(html)).toBeNull();

    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageMagic(exe)).toBeNull();
  });
});

describe("safe URL / storage path", () => {
  it("rejects dangerous protocols", () => {
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("data:text/html,hi")).toBe(false);
    expect(isSafeHttpsUrl("http://example.com/a.jpg")).toBe(false);
  });

  it("allows https and relative CMS paths", () => {
    expect(isSafeHttpsUrl("https://example.com/a.jpg")).toBe(true);
    expect(isAllowedCmsMediaUrl("/images/hero.webp")).toBe(true);
    expect(isAllowedCmsMediaUrl("/../etc/passwd")).toBe(false);
  });

  it("rejects path traversal in storage paths", () => {
    expect(isSafeStoragePath("albums/photo.jpg")).toBe(true);
    expect(isSafeStoragePath("../secret")).toBe(false);
    expect(isSafeStoragePath("/absolute")).toBe(false);
    expect(isSafeStoragePath("a\\b")).toBe(false);
  });
});
