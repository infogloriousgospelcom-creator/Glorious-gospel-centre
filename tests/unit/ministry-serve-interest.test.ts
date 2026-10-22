import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SubmitServeInterestSchema,
  UpdateServeInterestSchema,
} from "@/lib/ministry-serve-interest-schema";
import {
  isOpenServeInterestStatus,
  isServeInterestStatus,
  SERVE_INTEREST_OPEN_STATUSES,
  SERVE_INTEREST_STATUSES,
  serveInterestStatusExplanation,
  serveInterestStatusLabel,
} from "@/lib/ministry-serve-interest";
import { safeMemberRedirect } from "@/lib/auth-redirects";

const migration0036 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0036_ministry_serve_interests.sql"),
  "utf8",
);
const actionSrc = readFileSync(
  resolve(process.cwd(), "services/ministry-serve-interest.actions.ts"),
  "utf8",
);
const memberSrc = readFileSync(
  resolve(process.cwd(), "services/ministry-serve-interest.ts"),
  "utf8",
);
const adminActionSrc = readFileSync(
  resolve(process.cwd(), "services/admin/serve-interests.ts"),
  "utf8",
);
const adminReadSrc = readFileSync(
  resolve(process.cwd(), "services/admin/serve-interests.read.ts"),
  "utf8",
);
const formSrc = readFileSync(
  resolve(process.cwd(), "app/serve/_components/ServeInterestForm.tsx"),
  "utf8",
);
const panelSrc = readFileSync(
  resolve(process.cwd(), "app/serve/_components/ServeInterestPanel.tsx"),
  "utf8",
);
const accountSectionSrc = readFileSync(
  resolve(process.cwd(), "app/account/_components/AccountServeInterests.tsx"),
  "utf8",
);
const accountPageSrc = readFileSync(
  resolve(process.cwd(), "app/account/page.tsx"),
  "utf8",
);
const servePageSrc = readFileSync(resolve(process.cwd(), "app/serve/page.tsx"), "utf8");
const ministryPageSrc = readFileSync(
  resolve(process.cwd(), "app/ministries/[slug]/page.tsx"),
  "utf8",
);
const adminListSrc = readFileSync(
  resolve(process.cwd(), "app/admin/(protected)/serve-interests/page.tsx"),
  "utf8",
);
const adminDetailSrc = readFileSync(
  resolve(process.cwd(), "app/admin/(protected)/serve-interests/[id]/page.tsx"),
  "utf8",
);
const updateFormSrc = readFileSync(
  resolve(
    process.cwd(),
    "app/admin/(protected)/serve-interests/_components/ServeInterestUpdateForm.tsx",
  ),
  "utf8",
);
const sidebarSrc = readFileSync(
  resolve(process.cwd(), "components/layout/AdminSidebar.tsx"),
  "utf8",
);
const sitemapSrc = readFileSync(resolve(process.cwd(), "app/sitemap.ts"), "utf8");
const memberUx = readFileSync(resolve(process.cwd(), "docs/MEMBER_UX.md"), "utf8");
const migration0035 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0035_membership_lifecycle_reliability.sql"),
  "utf8",
);

const MEMBER_SELECT_COLUMNS = [
  "id",
  "profile_id",
  "ministry_id",
  "status",
  "member_note",
  "created_at",
  "updated_at",
] as const;

const STAFF_PRIVATE_COLUMNS = ["staff_note", "reviewed_by", "reviewed_at"] as const;

function grantSelectBlock(sql: string): string {
  const start = sql.indexOf("grant select");
  if (start < 0) return "";
  const end = sql.indexOf("to authenticated", start);
  if (end < 0) return "";
  return sql.slice(start, end);
}

function grantInsertBlock(sql: string): string {
  const start = sql.indexOf("grant insert");
  if (start < 0) return "";
  const end = sql.indexOf("to authenticated", start);
  if (end < 0) return "";
  return sql.slice(start, end);
}

describe("Phase K schema / validation", () => {
  it("accepts a valid ministry interest and optional note", () => {
    const r = SubmitServeInterestSchema.safeParse({
      ministry_id: "11111111-1111-4111-8111-111111111111",
      member_note: "I would like to help on Sundays.",
    });
    expect(r.success).toBe(true);
  });

  it("accepts general serve interest with empty ministry", () => {
    expect(
      SubmitServeInterestSchema.safeParse({ ministry_id: "", member_note: "" }).success,
    ).toBe(true);
  });

  it("rejects an invalid ministry id", () => {
    expect(
      SubmitServeInterestSchema.safeParse({
        ministry_id: "not-a-uuid",
        member_note: "",
      }).success,
    ).toBe(false);
  });

  it("rejects notes over 500 characters", () => {
    expect(
      SubmitServeInterestSchema.safeParse({
        ministry_id: "",
        member_note: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("accepts empty notes", () => {
    expect(
      SubmitServeInterestSchema.safeParse({
        ministry_id: "11111111-1111-4111-8111-111111111111",
        member_note: "   ",
      }).success,
    ).toBe(true);
  });

  it("validates staff status updates and rejects unknown statuses", () => {
    expect(
      UpdateServeInterestSchema.safeParse({
        interest_id: "22222222-2222-4222-8222-222222222222",
        status: "CONTACTED",
        staff_note: "Called on Sunday",
      }).success,
    ).toBe(true);
    expect(
      UpdateServeInterestSchema.safeParse({
        interest_id: "22222222-2222-4222-8222-222222222222",
        status: "ASSIGNED",
        staff_note: "",
      }).success,
    ).toBe(false);
    expect(
      UpdateServeInterestSchema.safeParse({
        interest_id: "not-a-uuid",
        status: "NEW",
      }).success,
    ).toBe(false);
  });

  it("rejects oversized staff notes", () => {
    expect(
      UpdateServeInterestSchema.safeParse({
        interest_id: "22222222-2222-4222-8222-222222222222",
        status: "NEW",
        staff_note: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe("Phase K status model", () => {
  it("uses the small explicit status set", () => {
    expect(SERVE_INTEREST_STATUSES).toEqual([
      "NEW",
      "CONTACTED",
      "ACCEPTED",
      "DECLINED",
      "CLOSED",
    ]);
    expect(SERVE_INTEREST_OPEN_STATUSES).toEqual(["NEW", "CONTACTED", "ACCEPTED"]);
    for (const s of SERVE_INTEREST_STATUSES) {
      expect(isServeInterestStatus(s)).toBe(true);
    }
    expect(isServeInterestStatus("ASSIGNED")).toBe(false);
    expect(isOpenServeInterestStatus("NEW")).toBe(true);
    expect(isOpenServeInterestStatus("DECLINED")).toBe(false);
    expect(isOpenServeInterestStatus("CLOSED")).toBe(false);
  });

  it("uses pastoral member-facing labels", () => {
    expect(serveInterestStatusLabel("NEW")).toBe("Received");
    expect(serveInterestStatusLabel("CONTACTED")).toBe("We are in touch");
    expect(serveInterestStatusLabel("ACCEPTED")).toBe("Accepted");
    expect(serveInterestStatusLabel("DECLINED")).toBe("Not moving forward");
    expect(serveInterestStatusLabel("CLOSED")).toBe("Closed");
    expect(serveInterestStatusExplanation("DECLINED")).toMatch(/still welcome/i);
    expect(serveInterestStatusExplanation("DECLINED")).not.toMatch(/rejected|unworthy|failed/i);
  });
});

describe("Phase K migration 0036 — table, RLS, grants", () => {
  it("creates ministry_serve_interests with ownership and staff columns", () => {
    expect(migration0036).toMatch(/create table if not exists public\.ministry_serve_interests/);
    expect(migration0036).toMatch(
      /profile_id uuid not null references public\.profiles\(id\) on delete cascade/,
    );
    expect(migration0036).toMatch(
      /ministry_id uuid references public\.ministries\(id\) on delete set null/,
    );
    expect(migration0036).toMatch(/staff_note text/);
    expect(migration0036).toMatch(/reviewed_by uuid references public\.profiles\(id\)/);
    expect(migration0036).toMatch(/reviewed_at timestamptz/);
    expect(migration0036).toMatch(/ministry_serve_interests_member_note_len/);
    expect(migration0036).toMatch(/ministry_serve_interests_staff_note_len/);
  });

  it("indexes newest-first lists and unique open interests", () => {
    expect(migration0036).toMatch(/idx_serve_interests_profile_created/);
    expect(migration0036).toMatch(/idx_serve_interests_status_created/);
    expect(migration0036).toMatch(/idx_serve_interests_open_ministry/);
    expect(migration0036).toMatch(/idx_serve_interests_open_general/);
    expect(migration0036).toMatch(/where status in \([\s\S]*NEW[\s\S]*CONTACTED[\s\S]*ACCEPTED/);
  });

  it("seeds serve_interests.manage for SUPER_ADMIN and ADMIN only", () => {
    expect(migration0036).toMatch(/'serve_interests\.manage'/);
    expect(migration0036).toMatch(/roles where key = 'SUPER_ADMIN'/);
    expect(migration0036).toMatch(/roles where key = 'ADMIN'/);
    expect(migration0036).not.toMatch(/EDITOR/);
    expect(migration0036).not.toMatch(/FINANCE/);
  });

  it("enforces verified email via the existing I-B10 helper", () => {
    expect(migration0036).toMatch(/perform public\.require_verified_email_for_membership\(\)/);
    expect(migration0035).toMatch(
      /create or replace function public\.require_verified_email_for_membership\(\)/,
    );
  });

  it("forces ownership and strips staff fields on INSERT", () => {
    expect(migration0036).toMatch(/new\.profile_id := auth\.uid\(\)/);
    expect(migration0036).toMatch(/new\.status := 'NEW'/);
    expect(migration0036).toMatch(/new\.staff_note := null/);
    expect(migration0036).toMatch(/new\.reviewed_by := null/);
    expect(migration0036).toMatch(/new\.reviewed_at := null/);
    expect(migration0036).toMatch(/cannot create interest for another profile/);
    expect(migration0036).toMatch(/ministry is not available/);
    expect(migration0036).toMatch(/m\.status = 'PUBLISHED'/);
  });

  it("blocks member UPDATE and congregant-field mutation by staff", () => {
    expect(migration0036).toMatch(/members cannot modify serve interests/);
    expect(migration0036).toMatch(/staff cannot change congregant-owned fields/);
    expect(migration0036).toMatch(/has_permission\('serve_interests\.manage'\)/);
  });

  it("derives reviewer identity in the staff RPC", () => {
    expect(migration0036).toMatch(/create or replace function public\.update_ministry_serve_interest/);
    expect(migration0036).toMatch(/security definer/);
    expect(migration0036).toMatch(/set search_path = public/);
    expect(migration0036).toMatch(/reviewed_by = auth\.uid\(\)/);
    expect(migration0036).toMatch(/reviewed_at = now\(\)/);
    expect(migration0036).toMatch(
      /revoke all on function public\.update_ministry_serve_interest\([\s\S]*?\) from anon/,
    );
    expect(migration0036).toMatch(
      /grant execute on function public\.update_ministry_serve_interest\([\s\S]*?\) to authenticated/,
    );
    expect(migration0036).not.toMatch(/p_reviewed_by/);
    expect(migration0036).not.toMatch(/p_reviewed_at/);
  });

  it("enables RLS with self SELECT/INSERT and staff SELECT only", () => {
    expect(migration0036).toMatch(/enable row level security/);
    expect(migration0036).toMatch(/serve_interests_self_select/);
    expect(migration0036).toMatch(/using \(profile_id = auth\.uid\(\)\)/);
    expect(migration0036).toMatch(/serve_interests_self_insert/);
    expect(migration0036).toMatch(/serve_interests_admin_select/);
    expect(migration0036).not.toMatch(/for update to authenticated/);
    expect(migration0036).not.toMatch(/for delete to authenticated/);
    expect(migration0036).not.toMatch(/to anon/);
  });

  it("grants only safe columns and withholds staff-private fields", () => {
    expect(migration0036).toMatch(
      /revoke all on table public\.ministry_serve_interests from anon, authenticated/,
    );
    const selectGrant = grantSelectBlock(migration0036);
    const insertGrant = grantInsertBlock(migration0036);
    for (const col of MEMBER_SELECT_COLUMNS) {
      expect(selectGrant).toMatch(new RegExp(`\\b${col}\\b`));
    }
    for (const col of STAFF_PRIVATE_COLUMNS) {
      expect(selectGrant).not.toMatch(new RegExp(`\\b${col}\\b`));
      expect(insertGrant).not.toMatch(new RegExp(`\\b${col}\\b`));
    }
    expect(migration0036).not.toMatch(
      /grant (update|delete)[\s\S]*on table public\.ministry_serve_interests to authenticated/i,
    );
  });
});

describe("Phase K congregant service security (static)", () => {
  it("requires auth, verified email, and rate limiting", () => {
    expect(actionSrc).toMatch(/getCurrentUser/);
    expect(actionSrc).toMatch(/emailConfirmed/);
    expect(actionSrc).toMatch(/verify your email address before expressing interest/i);
    expect(actionSrc).toMatch(/consumeAsync/);
    expect(actionSrc).toMatch(/serve-interest:/);
    expect(actionSrc).toMatch(/profile_id: user\.userId/);
    expect(actionSrc).not.toMatch(/formData\.get\(["']profile_id["']\)/);
    expect(actionSrc).not.toMatch(/formData\.get\(["']status["']\)/);
    expect(actionSrc).not.toMatch(/formData\.get\(["']staff_note["']\)/);
    expect(actionSrc).not.toMatch(/formData\.get\(["']reviewed_by["']\)/);
  });

  it("does not use service-role for member submit or read", () => {
    expect(actionSrc).not.toMatch(/createServiceRoleClient/);
    expect(actionSrc).not.toMatch(/from "@\/supabase\/admin"/);
    expect(memberSrc).not.toMatch(/createServiceRoleClient/);
    expect(memberSrc).toMatch(/from "@\/supabase\/server"/);
    expect(memberSrc).toMatch(/MEMBER_SELECT = "id,ministry_id,status,member_note,created_at"/);
    expect(memberSrc).not.toMatch(/staff_note/);
    expect(memberSrc).not.toMatch(/reviewed_by/);
  });

  it("handles duplicate open interests without overwrite", () => {
    expect(actionSrc).toMatch(/findOpenOwnServeInterest/);
    expect(actionSrc).toMatch(/duplicate/);
    expect(actionSrc).toMatch(/already have an open serve interest/);
    expect(actionSrc).toMatch(/error\.code === "23505"/);
    expect(actionSrc).not.toMatch(/ministry_serve_interests"\)\.update\(/);
    expect(actionSrc).not.toMatch(/\.upsert\(/);
  });

  it("maps database errors to safe member copy", () => {
    expect(actionSrc).toMatch(/We couldn't submit your interest/);
    expect(actionSrc).not.toMatch(/console\.(error|log|debug)/);
  });
});

describe("Phase K staff authorization (static)", () => {
  it("gates admin reads with serve_interests.manage before service-role", () => {
    expect(adminReadSrc).toMatch(/serve_interests\.manage/);
    expect(adminReadSrc).toMatch(/has_permission/);
    expect(adminReadSrc).toMatch(/createServiceRoleClient/);
    expect(adminReadSrc).toMatch(/assertServeInterestManager/);
    expect(adminReadSrc).toMatch(/staff_note/);
  });

  it("updates via RPC after permission check and derives reviewer server-side", () => {
    expect(adminActionSrc).toMatch(/serve_interests\.manage/);
    expect(adminActionSrc).toMatch(/update_ministry_serve_interest/);
    expect(adminActionSrc).not.toMatch(/createServiceRoleClient/);
    expect(adminActionSrc).not.toMatch(/formData\.get\(["']reviewed_by["']\)/);
    expect(adminActionSrc).not.toMatch(/formData\.get\(["']reviewed_at["']\)/);
    expect(adminActionSrc).toMatch(/writeAuditLog/);
    expect(adminActionSrc).toMatch(/serve_interest\.status_change/);
    expect(adminActionSrc).toMatch(/from: prior\?\.status/);
    expect(adminActionSrc).toMatch(/to: parsed\.data\.status/);
  });

  it("admin pages require the dedicated permission and stay noindex", () => {
    expect(adminListSrc).toMatch(/requirePermission\("serve_interests\.manage"\)/);
    expect(adminDetailSrc).toMatch(/requirePermission\("serve_interests\.manage"\)/);
    expect(adminListSrc).toMatch(/index: false/);
    expect(adminDetailSrc).toMatch(/index: false/);
    expect(sidebarSrc).toMatch(/\/admin\/serve-interests/);
    expect(updateFormSrc).toMatch(/Staff note \(private\)/);
    expect(updateFormSrc).toMatch(/useFormState/);
  });
});

describe("Phase K UI + privacy", () => {
  it("sends anonymous users through the existing login redirect", () => {
    expect(panelSrc).toMatch(/\/login\?redirect_to=/);
    expect(safeMemberRedirect("/serve")).toBe("/serve");
    expect(safeMemberRedirect("/serve?ministry=hospitality")).toBe(
      "/serve?ministry=hospitality",
    );
    expect(safeMemberRedirect("/ministries/youth")).toBe("/ministries/youth");
    expect(safeMemberRedirect("https://evil.com")).toBeNull();
    expect(safeMemberRedirect("/admin/serve-interests")).toBeNull();
  });

  it("does not promise placement or expose staff notes to members", () => {
    expect(formSrc).toMatch(/not an automatic placement/);
    expect(formSrc).not.toMatch(/staff_note/);
    expect(formSrc).not.toMatch(/reviewed_by/);
    expect(accountSectionSrc).not.toMatch(/staff_note/);
    expect(accountSectionSrc).not.toMatch(/reviewed_by/);
    expect(accountSectionSrc).toMatch(/serveInterestStatusLabel/);
    expect(accountPageSrc).toMatch(/Serving Interests/);
    expect(accountPageSrc).toMatch(/listOwnServeInterests/);
    expect(accountPageSrc).toMatch(/robots:\s*\{\s*index:\s*false/);
  });

  it("wires public serve and ministry CTAs without merging Contact", () => {
    expect(servePageSrc).toMatch(/Express your interest/);
    expect(servePageSrc).toMatch(/ServeInterestPanel/);
    expect(servePageSrc).toMatch(/Contact GGCC/);
    expect(ministryPageSrc).toMatch(/ServeInterestPanel/);
    expect(ministryPageSrc).toMatch(/Express interest/);
  });

  it("keeps serve interests out of the public sitemap", () => {
    expect(sitemapSrc).not.toMatch(/serve-interest/);
    expect(sitemapSrc).not.toMatch(/ministry_serve_interests/);
    expect(sitemapSrc).not.toMatch(/\/account/);
    expect(sitemapSrc).not.toMatch(/\/admin/);
  });

  it("documents the owned workflow and deferred volunteer platform", () => {
    expect(memberUx).toMatch(/Ministry Serve Interest/);
    expect(memberUx).toMatch(/serve_interests\.manage/);
    expect(memberUx).toMatch(/one \*\*open\*\* interest/i);
    expect(memberUx).toMatch(/Guest \(anonymous\) serve-interest applications/);
    expect(memberUx).toMatch(/volunteer roster/);
  });
});
