import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSafeMemberNotificationHref } from "@/lib/member-notifications";

const migration0034 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0034_member_notifications.sql"),
  "utf8",
);
const memberNotifSrc = readFileSync(
  resolve(process.cwd(), "services/member-notifications.ts"),
  "utf8",
);
const markActionSrc = readFileSync(
  resolve(process.cwd(), "services/member-notifications.actions.ts"),
  "utf8",
);
const accountNotifSrc = readFileSync(
  resolve(process.cwd(), "app/account/_components/AccountNotificationsSection.tsx"),
  "utf8",
);
const accountPageSrc = readFileSync(
  resolve(process.cwd(), "app/account/page.tsx"),
  "utf8",
);

function grantSelectBlock(sql: string): string {
  const start = sql.indexOf("grant select");
  if (start < 0) return "";
  const end = sql.indexOf("to authenticated", start);
  if (end < 0) return "";
  return sql.slice(start, end);
}

describe("I-B8 migration 0034 — schema + RLS + grants", () => {
  it("creates member_notifications with required columns and unique dedupe_key", () => {
    expect(migration0034).toMatch(/create table if not exists public\.member_notifications/);
    for (const col of [
      "recipient_id",
      "kind",
      "title",
      "body",
      "href",
      "source_type",
      "source_id",
      "event_key",
      "dedupe_key",
      "read_at",
      "created_at",
    ]) {
      expect(migration0034).toMatch(new RegExp(`\\b${col}\\b`));
    }
    expect(migration0034).toMatch(/unique \(dedupe_key\)/);
    expect(migration0034).toMatch(/idx_member_notifications_recipient_created/);
  });

  it("enforces safe relative href at the DB layer", () => {
    expect(migration0034).toMatch(/member_notifications_href_safe/);
    expect(migration0034).toMatch(/\^\/\[a-zA-Z0-9\]/);
    expect(migration0034).toMatch(/\/admin/);
    expect(migration0034).toMatch(/position\(':' in href\)/);
  });

  it("member self_select only; no member INSERT/UPDATE/DELETE policies", () => {
    expect(migration0034).toMatch(/member_notifications_self_select/);
    expect(migration0034).toMatch(/using \(recipient_id = auth\.uid\(\)\)/);
    expect(migration0034).not.toMatch(/for insert to authenticated/i);
    expect(migration0034).not.toMatch(/for update to authenticated/i);
    expect(migration0034).not.toMatch(/for delete to authenticated/i);
    expect(migration0034).toMatch(
      /revoke all on table public\.member_notifications from anon, authenticated/,
    );
  });

  it("grants SELECT of safe columns only (not dedupe_key)", () => {
    const grant = grantSelectBlock(migration0034);
    for (const col of [
      "id",
      "recipient_id",
      "kind",
      "title",
      "body",
      "href",
      "source_type",
      "source_id",
      "event_key",
      "read_at",
      "created_at",
    ]) {
      expect(grant).toMatch(new RegExp(`\\b${col}\\b`));
    }
    expect(grant).not.toMatch(/\bdedupe_key\b/);
  });
});

describe("I-B8 RPC security", () => {
  it("defines emit_member_notification as SECURITY DEFINER with fixed search_path", () => {
    expect(migration0034).toMatch(/create or replace function public\.emit_member_notification/);
    expect(migration0034).toMatch(/security definer/);
    expect(migration0034).toMatch(/set search_path = public/);
    expect(migration0034).toMatch(/on conflict \(dedupe_key\) do nothing/);
  });

  it("revokes emit EXECUTE from public, anon, and authenticated", () => {
    expect(migration0034).toMatch(
      /revoke all on function public\.emit_member_notification\([\s\S]*?\) from public/,
    );
    expect(migration0034).toMatch(
      /revoke all on function public\.emit_member_notification\([\s\S]*?\) from anon/,
    );
    expect(migration0034).toMatch(
      /revoke all on function public\.emit_member_notification\([\s\S]*?\) from authenticated/,
    );
  });

  it("defines mark_member_notification_read with auth.uid ownership", () => {
    expect(migration0034).toMatch(/create or replace function public\.mark_member_notification_read/);
    expect(migration0034).toMatch(/recipient_id is distinct from auth\.uid\(\)/);
    expect(migration0034).toMatch(/set read_at = now\(\)/);
    expect(migration0034).toMatch(
      /grant execute on function public\.mark_member_notification_read\(uuid\) to authenticated/,
    );
    expect(migration0034).toMatch(
      /revoke all on function public\.mark_member_notification_read\(uuid\) from anon/,
    );
  });
});

describe("I-B8 Connect Group emit wiring", () => {
  it("approve/decline/remove emit after successful transition", () => {
    expect(migration0034).toMatch(/create or replace function public\.approve_connect_group_membership/);
    expect(migration0034).toMatch(/create or replace function public\.decline_connect_group_membership/);
    expect(migration0034).toMatch(/create or replace function public\.remove_connect_group_membership/);
    expect(migration0034).toMatch(/'connect_group\.approved'/);
    expect(migration0034).toMatch(/'connect_group\.declined'/);
    expect(migration0034).toMatch(/'connect_group\.removed'/);
    expect(migration0034).toMatch(/emit_member_notification\(/);
    expect(migration0034).toMatch(/m\.profile_id/);
  });

  it("preserves permission, capacity, and decided_by behavior", () => {
    expect(migration0034).toMatch(/has_permission\('connect_groups\.members\.manage'\)/);
    expect(migration0034).toMatch(/connect_group_has_membership_capacity/);
    expect(migration0034).toMatch(/decided_by = auth\.uid\(\)/);
    expect(migration0034).toMatch(/decided_at = now\(\)/);
  });

  it("does not emit leave or re-request notifications", () => {
    expect(migration0034).not.toMatch(/leave_connect_group/);
    expect(migration0034).not.toMatch(/rerequest_connect_group/);
    expect(migration0034).not.toMatch(/connect_group\.left/);
    expect(migration0034).not.toMatch(/connect_group\.rerequest/);
  });

  it("never exposes admin_note in notification content", () => {
    const emitBodies = migration0034.match(/n_body :=[\s\S]*?;/g) ?? [];
    expect(emitBodies.length).toBeGreaterThanOrEqual(3);
    for (const body of emitBodies) {
      expect(body).not.toMatch(/admin_note/);
    }
  });
});

describe("I-B8 href safety helper", () => {
  it("accepts safe internal relative paths", () => {
    expect(isSafeMemberNotificationHref("/account")).toBe(true);
    expect(isSafeMemberNotificationHref("/give")).toBe(true);
    expect(isSafeMemberNotificationHref("/connect/example-group")).toBe(true);
  });

  it("rejects absolute, protocol-relative, admin, and scheme URLs", () => {
    expect(isSafeMemberNotificationHref("https://evil.example")).toBe(false);
    expect(isSafeMemberNotificationHref("http://evil.example")).toBe(false);
    expect(isSafeMemberNotificationHref("//evil.example")).toBe(false);
    expect(isSafeMemberNotificationHref("/admin")).toBe(false);
    expect(isSafeMemberNotificationHref("/admin/giving")).toBe(false);
    expect(isSafeMemberNotificationHref("javascript:alert(1)")).toBe(false);
    expect(isSafeMemberNotificationHref("data:text/html,hi")).toBe(false);
  });
});

describe("I-B8 member read path + Account UI", () => {
  it("uses session client and never service-role", () => {
    expect(memberNotifSrc).toMatch(/from "@\/supabase\/server"/);
    expect(memberNotifSrc).not.toMatch(/createServiceRoleClient/);
    expect(memberNotifSrc).not.toMatch(/from "@\/supabase\/admin"/);
    expect(memberNotifSrc).toMatch(/listOwnNotifications/);
  });

  it("mark-read action uses RPC without client recipient_id", () => {
    expect(markActionSrc).toMatch(/mark_member_notification_read/);
    expect(markActionSrc).toMatch(/p_notification_id/);
    expect(markActionSrc).not.toMatch(/formData\.get\(\s*["']recipient_id["']/);
    expect(markActionSrc).not.toMatch(/\.eq\(\s*["']recipient_id["']/);
  });

  it("renders Activity section between My Giving and next steps", () => {
    expect(accountPageSrc).toMatch(/AccountNotificationsSection/);
    expect(accountPageSrc).toMatch(/>Activity</);
    const givingIdx = accountPageSrc.indexOf("My Giving");
    const activityIdx = accountPageSrc.indexOf(">Activity<");
    const nextIdx = accountPageSrc.indexOf("Your next steps");
    expect(givingIdx).toBeGreaterThan(-1);
    expect(activityIdx).toBeGreaterThan(givingIdx);
    expect(nextIdx).toBeGreaterThan(activityIdx);
  });

  it("shows empty/error states and mark-as-read without admin notes", () => {
    expect(accountNotifSrc).toMatch(/No activity yet/);
    expect(accountNotifSrc).toMatch(/Unable to load activity/);
    expect(accountNotifSrc).toMatch(/Mark as read/);
    expect(accountNotifSrc).not.toMatch(/admin_note/);
    expect(accountNotifSrc).not.toMatch(/supabase/i);
  });
});
