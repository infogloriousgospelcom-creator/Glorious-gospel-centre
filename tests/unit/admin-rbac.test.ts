import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/0039_admins_self_select.sql", "utf8");
const auth = readFileSync("services/auth.ts", "utf8");

describe("admin self-read RBAC", () => {
  it("grants admins SELECT on their own row", () => {
    expect(migration).toMatch(/create policy admins_self_select/i);
    expect(migration).toMatch(/profile_id = auth\.uid\(\)/i);
  });
  it("exposes a SECURITY DEFINER role lookup", () => {
    expect(migration).toMatch(/create or replace function public\.roles_for_user/i);
    expect(migration).toMatch(/security definer/i);
  });
  it("stops reading the admins table through RLS for the session user", () => {
    expect(auth).not.toMatch(/from\("admins"\)\s*\.select\("role:roles\(key\)"\)/);
    expect(auth).toMatch(/rpc\("roles_for_user"/);
  });
});