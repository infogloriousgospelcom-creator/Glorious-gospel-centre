import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration0033 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0033_member_giving_history.sql"),
  "utf8",
);
const memberGivingSrc = readFileSync(
  resolve(process.cwd(), "services/member-giving.ts"),
  "utf8",
);
const accountGivingSrc = readFileSync(
  resolve(process.cwd(), "app/account/_components/AccountGivingSection.tsx"),
  "utf8",
);
const accountPageSrc = readFileSync(
  resolve(process.cwd(), "app/account/page.tsx"),
  "utf8",
);
const adminGivingReadSrc = readFileSync(
  resolve(process.cwd(), "services/admin/giving.read.ts"),
  "utf8",
);
const adminGivingActionsSrc = readFileSync(
  resolve(process.cwd(), "services/admin/giving.actions.ts"),
  "utf8",
);
const givingFormSrc = readFileSync(
  resolve(process.cwd(), "app/give/_components/GivingForm.tsx"),
  "utf8",
);
const stkPushSrc = readFileSync(
  resolve(process.cwd(), "supabase/functions/mpesa-stk-push/index.ts"),
  "utf8",
);

const MEMBER_GRANT_COLUMNS = [
  "id",
  "category_id",
  "external_reference",
  "amount_cents",
  "currency",
  "status",
  "created_at",
] as const;

const EXCLUDED_FROM_MEMBER = [
  "phone",
  "provider",
  "updated_at",
  "admin_notes",
  "raw_callback",
  "created_by",
] as const;

function grantSelectBlock(sql: string): string {
  const start = sql.indexOf("grant select");
  if (start < 0) return "";
  const end = sql.indexOf("to authenticated", start);
  if (end < 0) return "";
  return sql.slice(start, end);
}

function memberSelectList(src: string): string {
  const m = src.match(/MEMBER_GIVING_SELECT\s*=\s*"([^"]+)"/);
  return m?.[1] ?? "";
}

/** Mirrors services/member-giving.ts display helpers (avoid importing server-only module). */
function formatGivingAmount(amountCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

function givingStatusLabel(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "Successful";
    case "PENDING":
      return "Pending";
    case "PROCESSING":
      return "Processing";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

describe("I-B7 migration 0033 — RLS + grants", () => {
  it("adds member self_select only (created_by = auth.uid())", () => {
    expect(migration0033).toMatch(/giving_transactions_self_select/);
    expect(migration0033).toMatch(/for select to authenticated/);
    expect(migration0033).toMatch(/using \(created_by = auth\.uid\(\)\)/);
    expect(migration0033).not.toMatch(/for insert/i);
    expect(migration0033).not.toMatch(/for update/i);
    expect(migration0033).not.toMatch(/for delete/i);
    expect(migration0033).not.toMatch(/to anon/);
  });

  it("preserves admin giving.manage policy and does not drop it", () => {
    expect(migration0033).toMatch(/giving_transactions_admin_all/);
    expect(migration0033).toMatch(/giving\.manage/);
    expect(migration0033).not.toMatch(/drop policy.*giving_transactions_admin_all/i);
  });

  it("revokes broad DML then grants only UI-required SELECT columns", () => {
    expect(migration0033).toMatch(
      /revoke all on table public\.giving_transactions from anon, authenticated/,
    );
    const grant = grantSelectBlock(migration0033);
    expect(grant).toMatch(/grant select \(/);
    for (const col of MEMBER_GRANT_COLUMNS) {
      expect(grant).toMatch(new RegExp(`\\b${col}\\b`));
    }
  });

  it("does not grant phone, unused internals, or sensitive columns", () => {
    const grant = grantSelectBlock(migration0033);
    for (const col of EXCLUDED_FROM_MEMBER) {
      expect(grant).not.toMatch(new RegExp(`\\b${col}\\b`));
    }
    expect(migration0033).toMatch(/admin_notes/);
    expect(migration0033).toMatch(/raw_callback/);
    expect(migration0033).toMatch(/\bphone\b/);
  });

  it("adds created_by + created_at index", () => {
    expect(migration0033).toMatch(
      /idx_giving_tx_created_by_created[\s\S]*created_by,\s*created_at/,
    );
  });
});

describe("I-B7 member read path", () => {
  it("uses session client and never service-role", () => {
    expect(memberGivingSrc).toMatch(/from "@\/supabase\/server"/);
    expect(memberGivingSrc).not.toMatch(/createServiceRoleClient/);
    expect(memberGivingSrc).not.toMatch(/from "@\/supabase\/admin"/);
    expect(memberGivingSrc).toMatch(/listOwnGivingHistory/);
    expect(memberGivingSrc).toMatch(/auth\.getUser\(\)/);
  });

  it("selects only least-privilege columns (no star, no phone, no sensitive fields)", () => {
    expect(memberGivingSrc).not.toMatch(/\.select\(\s*["']\*["']\s*\)/);
    const select = memberSelectList(memberGivingSrc);
    expect(select).toBeTruthy();
    expect(select).not.toMatch(/\*/);
    for (const col of [
      "id",
      "external_reference",
      "amount_cents",
      "currency",
      "status",
      "created_at",
    ]) {
      expect(select).toContain(col);
    }
    expect(select).toContain("category:giving_categories(label)");
    // category_id is granted for FK embed resolution but not returned in the select list
    expect(select).not.toMatch(/(^|,)category_id(,|$)/);
    for (const col of EXCLUDED_FROM_MEMBER) {
      expect(select).not.toMatch(new RegExp(`\\b${col}\\b`));
    }
    expect(memberGivingSrc).toMatch(/MEMBER_GIVING_EXCLUDED_COLUMNS/);
  });

  it("does not map phone or unused internal fields on MemberGivingHistoryItem", () => {
    expect(memberGivingSrc).toMatch(/export interface MemberGivingHistoryItem/);
    expect(memberGivingSrc).not.toMatch(/phone\s*:/);
    expect(memberGivingSrc).not.toMatch(/provider\s*:/);
    expect(memberGivingSrc).not.toMatch(/category_id\s*:/);
    expect(memberGivingSrc).not.toMatch(/updated_at\s*:/);
    expect(memberGivingSrc).not.toMatch(/admin_notes\s*:/);
    expect(memberGivingSrc).not.toMatch(/raw_callback\s*:/);
    expect(memberGivingSrc).not.toMatch(/created_by\s*:/);
    // excluded list documents sensitive/unused columns; category_id is granted for embed only
    expect(memberGivingSrc).toMatch(/"phone"/);
    expect(memberGivingSrc).toMatch(/"admin_notes"/);
    expect(memberGivingSrc).toMatch(/"raw_callback"/);
    expect(memberGivingSrc).toMatch(/"created_by"/);
    expect(memberGivingSrc).toMatch(/"category_id"/);
  });

  it("does not accept client-supplied user_id / created_by filters", () => {
    expect(memberGivingSrc).not.toMatch(/\.eq\(\s*["']created_by["']/);
    expect(memberGivingSrc).not.toMatch(/user_id/);
    expect(memberGivingSrc).not.toMatch(/input\.created_by/);
  });

  it("maps known statuses only (SUCCESS, PENDING, PROCESSING, FAILED, CANCELLED)", () => {
    for (const s of ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"]) {
      expect(memberGivingSrc).toContain(`"${s}"`);
      expect(givingStatusLabel(s).length).toBeGreaterThan(0);
    }
    expect(givingStatusLabel("SUCCESS")).toBe("Successful");
    expect(givingStatusLabel("PENDING")).toBe("Pending");
    expect(givingStatusLabel("FAILED")).toBe("Failed");
    expect(givingStatusLabel("CANCELLED")).toBe("Cancelled");
  });

  it("formats amounts for display without phone helpers", () => {
    expect(formatGivingAmount(150000, "KES")).toMatch(/1,?500/);
    expect(memberGivingSrc).toMatch(/function formatGivingAmount/);
    expect(memberGivingSrc).not.toMatch(/maskGivingPhone/);
  });
});

describe("I-B7 ownership model (write path + legacy)", () => {
  it("STK push sets created_by to authenticated user id", () => {
    expect(stkPushSrc).toMatch(/created_by:\s*user\.id/);
  });

  it("documents that NULL created_by rows stay invisible (RLS equality)", () => {
    expect(migration0033).toMatch(/created_by IS NULL/);
    expect(migration0033).toMatch(/created_by = auth\.uid\(\)/);
  });
});

describe("I-B7 admin regression", () => {
  it("admin reads use service-role AFTER giving.manage check", () => {
    expect(adminGivingReadSrc).toMatch(/has_permission/);
    expect(adminGivingReadSrc).toMatch(/giving\.manage/);
    expect(adminGivingReadSrc).toMatch(/createServiceRoleClient/);
    expect(adminGivingReadSrc).toMatch(/assertGivingManagerForRead/);
    expect(adminGivingReadSrc).toMatch(/admin_notes/);
    expect(adminGivingReadSrc).toMatch(/raw_callback/);
  });

  it("admin status override uses service-role AFTER permission check", () => {
    expect(adminGivingActionsSrc).toMatch(/has_permission/);
    expect(adminGivingActionsSrc).toMatch(/giving\.manage/);
    expect(adminGivingActionsSrc).toMatch(/createServiceRoleClient/);
    expect(adminGivingActionsSrc).toMatch(/admin_notes/);
  });
});

describe("I-B7 Account Hub UI", () => {
  it("renders My Giving section on /account", () => {
    expect(accountPageSrc).toMatch(/My Giving/);
    expect(accountPageSrc).toMatch(/listOwnGivingHistory/);
    expect(accountPageSrc).toMatch(/AccountGivingSection/);
  });

  it("shows empty state with /give link and safe error copy", () => {
    expect(accountGivingSrc).toMatch(/No giving history is available/);
    expect(accountGivingSrc).toMatch(/href=["']\/give["']/);
    expect(accountGivingSrc).toMatch(/Unable to load giving history/);
    expect(accountGivingSrc).not.toMatch(/supabase/i);
    expect(accountGivingSrc).not.toMatch(/admin_notes/);
    expect(accountGivingSrc).not.toMatch(/raw_callback/);
  });

  it("does not render phone, provider, or sensitive fields", () => {
    expect(accountGivingSrc).not.toMatch(/phone/i);
    expect(accountGivingSrc).not.toMatch(/maskGivingPhone/);
    expect(accountGivingSrc).not.toMatch(/provider/i);
    expect(accountGivingSrc).not.toMatch(/admin_notes/);
    expect(accountGivingSrc).not.toMatch(/raw_callback/);
    expect(accountGivingSrc).not.toMatch(/created_by/);
  });

  it("surfaces actual statuses with badges", () => {
    for (const s of ["SUCCESS", "PENDING", "PROCESSING", "FAILED", "CANCELLED"]) {
      expect(accountGivingSrc).toContain(s);
    }
  });

  it("optionally links from /give success to /account history", () => {
    expect(givingFormSrc).toMatch(/View your giving history/);
    expect(givingFormSrc).toMatch(/href=["']\/account["']/);
  });
});
