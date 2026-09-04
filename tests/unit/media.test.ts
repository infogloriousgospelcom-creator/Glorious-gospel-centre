import { describe, expect, it } from "vitest";
import { toEmbedUrl, formatDuration } from "@/lib/media";

describe("media helpers", () => {
  describe("toEmbedUrl", () => {
    it.each([
      ["https://www.youtube.com/watch?v=abc123", "https://www.youtube.com/embed/abc123"],
      ["https://youtu.be/abc123", "https://www.youtube.com/embed/abc123"],
      ["https://www.youtube.com/shorts/abc123", "https://www.youtube.com/embed/abc123"],
      ["https://www.youtube.com/embed/abc123", "https://www.youtube.com/embed/abc123"],
      ["https://vimeo.com/12345", "https://player.vimeo.com/video/12345"],
      ["https://player.vimeo.com/video/12345", "https://player.vimeo.com/video/12345"],
      ["https://www.facebook.com/watch/?v=12345", "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D12345"],
    ])("embeds %s", (input, expected) => {
      expect(toEmbedUrl(input)).toBe(expected);
    });

    it("returns null for unrecognized hosts", () => {
      expect(toEmbedUrl("https://example.com/abc")).toBeNull();
    });
    it("returns null for invalid URLs", () => {
      expect(toEmbedUrl("not a url")).toBeNull();
    });
    it("returns null for empty input", () => {
      expect(toEmbedUrl(null)).toBeNull();
      expect(toEmbedUrl(undefined)).toBeNull();
      expect(toEmbedUrl("")).toBeNull();
    });
  });

  describe("formatDuration", () => {
    it.each([
      [null, null],
      [undefined, null],
      [0, null],
      [-5, null],
      [30, "0:30"],
      [125, "2:05"],
      [3665, "1:01:05"],
    ])("formats %p seconds as %p", (input, expected) => {
      expect(formatDuration(input)).toBe(expected);
    });
  });
});