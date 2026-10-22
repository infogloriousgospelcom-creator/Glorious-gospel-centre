/**
 * Plain-text sanitization and slug helpers for Stories of Grace.
 * No HTML is stored or rendered as markup.
 */

export function toPlainText(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim();
}

export function slugifyTestimonyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "story";
}

export function uniqueTestimonySlug(title: string, id: string): string {
  const base = slugifyTestimonyTitle(title);
  const suffix = id.replace(/-/g, "").slice(0, 8);
  return `${base}-${suffix}`;
}

export function publicDisplayName(input: {
  anonymous: boolean;
  display_name: string | null;
}): string | null {
  if (input.anonymous) return null;
  return input.display_name?.trim() || null;
}
