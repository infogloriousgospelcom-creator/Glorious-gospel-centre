/**
 * Escape characters that can break out of a JSON-LD <script> tag.
 * JSON.stringify alone does not escape `<`.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
