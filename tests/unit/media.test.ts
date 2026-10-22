import { describe, expect, it } from "vitest";
import { toEmbedUrl, formatDuration, getYouTubeVideoId, youtubeThumbnailUrl } from "@/lib/media";

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

  describe("getYouTubeVideoId", () => {
    it.each([
      ["https://youtu.be/BJ4R4qJCVDc", "BJ4R4qJCVDc"],
      ["https://youtu.be/k-PT118S11U", "k-PT118S11U"],
      ["https://youtu.be/abc123?si=xyz", "abc123"],
      ["https://www.youtube.com/watch?v=abc123", "abc123"],
      ["https://www.youtube.com/watch?v=abc123&t=120", "abc123"],
      ["https://www.youtube.com/embed/abc123", "abc123"],
      ["https://www.youtube.com/shorts/abc123", "abc123"],
      ["https://www.youtube-nocookie.com/embed/abc123", "abc123"],
    ])("extracts %s → %s", (input, expected) => {
      expect(getYouTubeVideoId(input)).toBe(expected);
    });

    it("returns null for non-YouTube URLs", () => {
      expect(getYouTubeVideoId("https://vimeo.com/12345")).toBeNull();
      expect(getYouTubeVideoId("https://example.com/abc")).toBeNull();
    });

    it("returns null for empty / invalid input", () => {
      expect(getYouTubeVideoId(null)).toBeNull();
      expect(getYouTubeVideoId(undefined)).toBeNull();
      expect(getYouTubeVideoId("")).toBeNull();
      expect(getYouTubeVideoId("not a url")).toBeNull();
    });
  });

  describe("youtubeThumbnailUrl", () => {
    it("generates thumbnail from youtu.be short URL", () => {
      expect(youtubeThumbnailUrl("https://youtu.be/BJ4R4qJCVDc")).toBe(
        "https://img.youtube.com/vi/BJ4R4qJCVDc/maxresdefault.jpg",
      );
    });

    it("generates thumbnail from full YouTube URL", () => {
      expect(youtubeThumbnailUrl("https://www.youtube.com/watch?v=k-PT118S11U")).toBe(
        "https://img.youtube.com/vi/k-PT118S11U/maxresdefault.jpg",
      );
    });

    it("ignores ?si= tracking parameter", () => {
      expect(youtubeThumbnailUrl("https://youtu.be/abc123?si=R0N1aOfiOgST3qT9")).toBe(
        "https://img.youtube.com/vi/abc123/maxresdefault.jpg",
      );
    });

    it("returns null for non-YouTube URLs", () => {
      expect(youtubeThumbnailUrl("https://vimeo.com/12345")).toBeNull();
      expect(youtubeThumbnailUrl(null)).toBeNull();
      expect(youtubeThumbnailUrl(undefined)).toBeNull();
    });
  });
});