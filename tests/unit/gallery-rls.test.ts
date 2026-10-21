import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const m = readFileSync("supabase/migrations/0040_gallery_items_policies.sql", "utf8");

describe("gallery_items policies", () => {
  it("exposes items only via a published album", () => {
    expect(m).toMatch(/create policy gallery_items_public_select/i);
    expect(m).toMatch(/public\.is_published\(a\.status\)/);
  });
  it("grants only the safe columns to the public roles", () => {
    expect(m).toMatch(/grant select \(id, album_id, storage_path, caption, alt_text, sort_order, created_at\)/i);
  });
  it("does not expose uploaded_by through a select grant", () => {
    expect(m).not.toMatch(/grant select \([^)]*uploaded_by/i);
  });
  it("lets media managers read items in draft albums", () => {
    expect(m).toMatch(/create policy gallery_items_admin_select/i);
    expect(m).toMatch(/has_permission\('media\.manage'\)/);
  });
  it("lets media managers insert and delete items", () => {
    expect(m).toMatch(/create policy gallery_items_admin_write/i);
    expect(m).toMatch(/grant insert/i);
    expect(m).toMatch(/grant delete/i);
  });
  it("grants insert on every column the admin insert sends", () => {
    expect(m).toMatch(
      /grant insert \([^)]*album_id[^)]*storage_path[^)]*caption[^)]*alt_text[^)]*sort_order[^)]*uploaded_by[^)]*\)/i,
    );
  });
  it("sets uploaded_by server-side so staff cannot forge it", () => {
    expect(m).toMatch(/new\.uploaded_by := auth\.uid\(\)/);
    expect(m).toMatch(/before insert on public\.gallery_items/i);
  });
});
