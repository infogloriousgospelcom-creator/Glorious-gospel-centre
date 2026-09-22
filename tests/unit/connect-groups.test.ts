import { describe, expect, it } from "vitest";
import {
  connectGroupAvailabilityLabel,
  isPublicConnectGroupStatus,
  slugifyConnectGroupName,
  toPlainConnectText,
  uniqueConnectGroupSlug,
} from "@/lib/connect-groups";

describe("connect group public status", () => {
  it("allows OPEN FULL CLOSED publicly", () => {
    expect(isPublicConnectGroupStatus("OPEN")).toBe(true);
    expect(isPublicConnectGroupStatus("FULL")).toBe(true);
    expect(isPublicConnectGroupStatus("CLOSED")).toBe(true);
  });

  it("blocks DRAFT and ARCHIVED from public", () => {
    expect(isPublicConnectGroupStatus("DRAFT")).toBe(false);
    expect(isPublicConnectGroupStatus("ARCHIVED")).toBe(false);
  });
});

describe("connect group public field surface", () => {
  const publicColumns = [
    "id",
    "slug",
    "name",
    "short_description",
    "description",
    "meeting_day",
    "meeting_time",
    "meeting_frequency",
    "location_note",
    "capacity",
    "leader_display_name",
    "ministry_id",
    "status",
    "sort_order",
    "published_at",
    "created_at",
    "updated_at",
  ] as const;

  it("does not include internal audit UUID columns", () => {
    expect(publicColumns).not.toContain("created_by");
    expect(publicColumns).not.toContain("updated_by");
  });
});

describe("connect group helpers", () => {
  it("slugifies names safely", () => {
    expect(slugifyConnectGroupName("Young Adults!!")).toBe("young-adults");
  });

  it("creates unique slugs", () => {
    expect(uniqueConnectGroupSlug("Hello", "abcdef12-3456-7890-abcd-ef1234567890")).toBe(
      "hello-abcdef12",
    );
  });

  it("strips HTML from plain text", () => {
    expect(toPlainConnectText("<b>Hi</b> <script>x</script>there")).toBe("Hi there");
  });

  it("labels availability", () => {
    expect(connectGroupAvailabilityLabel("OPEN")).toBe("Open to connect");
    expect(connectGroupAvailabilityLabel("FULL")).toBe("Currently full");
    expect(connectGroupAvailabilityLabel("CLOSED")).toBe("Not accepting new members");
  });
});
