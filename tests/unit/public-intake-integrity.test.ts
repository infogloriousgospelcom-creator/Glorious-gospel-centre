import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  eventHasEnded,
  eventRegistrationBlockReason,
} from "@/lib/event-registration";

const migration0037 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0037_public_intake_integrity.sql"),
  "utf8",
);
const messagesSrc = readFileSync(
  resolve(process.cwd(), "services/admin/messages.ts"),
  "utf8",
);
const prayerSrc = readFileSync(
  resolve(process.cwd(), "services/admin/prayer.ts"),
  "utf8",
);
const prayerPageSrc = readFileSync(
  resolve(process.cwd(), "app/admin/(protected)/prayer-requests/page.tsx"),
  "utf8",
);
const messagesPageSrc = readFileSync(
  resolve(process.cwd(), "app/admin/(protected)/messages/page.tsx"),
  "utf8",
);
const eventActionSrc = readFileSync(
  resolve(process.cwd(), "app/events/actions.ts"),
  "utf8",
);
const eventPageSrc = readFileSync(
  resolve(process.cwd(), "app/events/[slug]/page.tsx"),
  "utf8",
);
const serveActionSrc = readFileSync(
  resolve(process.cwd(), "services/ministry-serve-interest.actions.ts"),
  "utf8",
);
const memberUx = readFileSync(resolve(process.cwd(), "docs/MEMBER_UX.md"), "utf8");

function grantSelectBlock(sql: string, table: string): string {
  const marker = `grant select (`;
  let from = 0;
  while (from < sql.length) {
    const start = sql.indexOf(marker, from);
    if (start < 0) return "";
    const end = sql.indexOf("to authenticated", start);
    if (end < 0) return "";
    const endOfStmt = sql.indexOf(";", end);
    const block = sql.slice(start, endOfStmt < 0 ? end + 80 : endOfStmt);
    if (block.includes(`public.${table}`)) return block;
    from = end + 1;
  }
  return "";
}

describe("Phase M event eligibility", () => {
  const now = new Date("2026-09-23T12:00:00.000Z");

  it("rejects a missing event", () => {
    expect(eventRegistrationBlockReason(null, now)).toMatch(/could not be found/i);
  });

  it("rejects unpublished events", () => {
    expect(
      eventRegistrationBlockReason(
        {
          status: "DRAFT",
          registration_required: true,
          starts_at: "2026-10-01T10:00:00.000Z",
          ends_at: null,
        },
        now,
      ),
    ).toMatch(/not open/i);
  });

  it("rejects registration-disabled events", () => {
    expect(
      eventRegistrationBlockReason(
        {
          status: "PUBLISHED",
          registration_required: false,
          starts_at: "2026-10-01T10:00:00.000Z",
          ends_at: null,
        },
        now,
      ),
    ).toMatch(/not enabled/i);
  });

  it("rejects ended events using ends_at, or starts_at when ends_at is null", () => {
    expect(
      eventHasEnded(
        { starts_at: "2026-09-01T10:00:00.000Z", ends_at: "2026-09-01T12:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      eventHasEnded({ starts_at: "2026-09-01T10:00:00.000Z", ends_at: null }, now),
    ).toBe(true);
    expect(
      eventRegistrationBlockReason(
        {
          status: "PUBLISHED",
          registration_required: true,
          starts_at: "2026-09-01T10:00:00.000Z",
          ends_at: "2026-09-01T12:00:00.000Z",
        },
        now,
      ),
    ).toMatch(/closed/i);
  });

  it("allows a published, required, future event", () => {
    expect(
      eventRegistrationBlockReason(
        {
          status: "PUBLISHED",
          registration_required: true,
          starts_at: "2026-10-01T10:00:00.000Z",
          ends_at: "2026-10-01T12:00:00.000Z",
        },
        now,
      ),
    ).toBeNull();
  });

  it("allows an in-progress event that has not ended", () => {
    expect(
      eventRegistrationBlockReason(
        {
          status: "PUBLISHED",
          registration_required: true,
          starts_at: "2026-09-23T10:00:00.000Z",
          ends_at: "2026-09-23T18:00:00.000Z",
        },
        now,
      ),
    ).toBeNull();
  });
});

describe("Phase M migration 0037 — RLS + grants", () => {
  it("adds permission-gated contact UPDATE/DELETE policies", () => {
    expect(migration0037).toMatch(/contact_messages_admin_update/);
    expect(migration0037).toMatch(/contact_messages_admin_delete/);
    expect(migration0037).toMatch(/has_permission\('contact\.manage'\)/);
    expect(migration0037).not.toMatch(/for update to anon/);
    expect(migration0037).not.toMatch(/for delete to anon/);
  });

  it("adds permission-gated prayer DELETE and does not grant ADMIN the permission", () => {
    expect(migration0037).toMatch(/prayer_requests_admin_delete/);
    expect(migration0037).toMatch(/has_permission\('prayer\.manage'\)/);
    expect(migration0037).not.toMatch(/roles where key = 'ADMIN'/);
  });

  it("revokes table access from anon and withholds ip_hash", () => {
    expect(migration0037).toMatch(
      /revoke all on table public\.contact_messages from anon, authenticated/,
    );
    expect(migration0037).toMatch(
      /revoke all on table public\.prayer_requests from anon, authenticated/,
    );
    expect(migration0037).toMatch(
      /revoke all on table public\.event_registrations from anon, authenticated/,
    );
    const contactGrant = grantSelectBlock(migration0037, "contact_messages");
    const prayerGrant = grantSelectBlock(migration0037, "prayer_requests");
    expect(contactGrant).toMatch(/grant select \(/);
    expect(contactGrant).not.toMatch(/\bip_hash\b/);
    expect(prayerGrant).not.toMatch(/\bip_hash\b/);
    expect(migration0037).toMatch(/prayer_requests\.ip_hash/);
    expect(migration0037).not.toMatch(
      /grant insert[\s\S]*on table public\.(contact_messages|prayer_requests|event_registrations)/i,
    );
  });
});

describe("Phase M contact / prayer staff actions (static)", () => {
  it("requires contact.manage, audits mark-read and delete, no service-role", () => {
    expect(messagesSrc).toMatch(/contact\.manage/);
    expect(messagesSrc).toMatch(/contact\.mark_read/);
    expect(messagesSrc).toMatch(/contact\.delete/);
    expect(messagesSrc).toMatch(/writeAuditLog/);
    expect(messagesSrc).not.toMatch(/createServiceRoleClient/);
    expect(messagesSrc).not.toMatch(/formData\.get\(["']email["']\)/);
    expect(messagesPageSrc).toMatch(/requirePermission\("contact\.manage"\)/);
  });

  it("requires prayer.manage on the page and delete path; keeps delete audited", () => {
    expect(prayerPageSrc).toMatch(/requirePermission\("prayer\.manage"\)/);
    expect(prayerPageSrc).not.toMatch(/requireAdmin\(\)/);
    expect(prayerSrc).toMatch(/prayer\.delete/);
    expect(prayerSrc).toMatch(/writeAuditLog/);
    expect(prayerSrc).toMatch(/\.delete\(\)/);
    expect(prayerSrc).not.toMatch(/createServiceRoleClient/);
    expect(prayerSrc).not.toMatch(/profile_id/);
  });
});

describe("Phase M event registration action (static)", () => {
  it("loads the event and applies eligibility before insert", () => {
    expect(eventActionSrc).toMatch(/eventRegistrationBlockReason/);
    expect(eventActionSrc).toMatch(/createServiceRoleClient/);
    expect(eventActionSrc).toMatch(/registration_required/);
    expect(eventActionSrc).toMatch(/status/);
    expect(eventActionSrc).toMatch(/consumeAsync/);
    expect(eventActionSrc).toMatch(/Capacity: deferred/);
    expect(eventPageSrc).toMatch(/eventHasEnded/);
    expect(eventPageSrc).toMatch(/Registration closed/);
  });
});

describe("Phase M regression — Phase K serve interest untouched", () => {
  it("keeps session-client submit and verified-email checks", () => {
    expect(serveActionSrc).toMatch(/emailConfirmed/);
    expect(serveActionSrc).not.toMatch(/createServiceRoleClient/);
    expect(memberUx).toMatch(/Event registration capacity/);
  });
});
