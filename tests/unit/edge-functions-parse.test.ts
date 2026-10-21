import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { transformSync } from "esbuild";

const functionsDir = resolve(process.cwd(), "supabase/functions");

function findTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = findTsFiles(functionsDir);

describe("edge functions parse", () => {
  it("every Edge Function file parses successfully", () => {
    let ok = 0;
    const failed: Array<{ file: string; error: string }> = [];
    for (const path of files) {
      const source = readFileSync(path, "utf8");
      try {
        transformSync(source, { loader: "ts" });
        ok++;
      } catch (e: unknown) {
        const fileName = path.replace(functionsDir + "/", "");
        failed.push({
          file: fileName,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    if (failed.length > 0) {
      console.error("Failed to parse Edge Functions:", failed);
    }
    expect(failed).toHaveLength(0);
    expect(ok).toBe(files.length);
  });
});
