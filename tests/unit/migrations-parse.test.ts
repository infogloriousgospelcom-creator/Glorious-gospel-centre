import { describe, expect, it } from "vitest";
import { parse } from "libpg-query";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const migrationDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationDir).filter((f) => f.endsWith(".sql"));

describe("migration parse", () => {
  it("every migration file parses successfully", async () => {
    let ok = 0;
    let failed: Array<{ file: string; error: string }> = [];
    for (const f of files) {
      const path = resolve(migrationDir, f);
      const sql = await import("node:fs").then((mod) => mod.readFileSync(path, "utf8"));
      try {
        parse(sql);
        ok++;
      } catch (e: any) {
        failed.push({ file: f, error: e.message || String(e) });
      }
    }
    expect(failed).toHaveLength(0);
    expect(ok).toBe(files.length);
  });
});