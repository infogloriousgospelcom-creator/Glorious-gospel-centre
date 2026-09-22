import "server-only";
import { createClient } from "@/supabase/server";
import {
  MEMBER_MEMBERSHIP_PUBLIC_COLUMNS,
  type ConnectGroupMembershipOwn,
  isConnectGroupMemberStatus,
} from "@/lib/connect-group-members";

const OWN_SELECT = MEMBER_MEMBERSHIP_PUBLIC_COLUMNS.join(",");

function mapOwn(row: Record<string, unknown>): ConnectGroupMembershipOwn | null {
  const status = String(row.status ?? "");
  if (!isConnectGroupMemberStatus(status)) return null;
  if (!row.id || !row.connect_group_id || !row.profile_id) return null;
  return {
    id: String(row.id),
    connect_group_id: String(row.connect_group_id),
    profile_id: String(row.profile_id),
    status,
    requested_at: String(row.requested_at ?? ""),
    decided_at: (row.decided_at as string | null) ?? null,
    left_at: (row.left_at as string | null) ?? null,
    member_note: (row.member_note as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getOwnMembershipForGroup(
  connectGroupId: string,
): Promise<ConnectGroupMembershipOwn | null> {
  if (!connectGroupId) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("connect_group_members")
      .select(OWN_SELECT)
      .eq("connect_group_id", connectGroupId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (error || !data) return null;
    return mapOwn(data as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export interface OwnMembershipWithGroup extends ConnectGroupMembershipOwn {
  group_name: string | null;
  group_slug: string | null;
  group_status: string | null;
  group_meeting_day: number | null;
  group_meeting_time: string | null;
  group_location_note: string | null;
}

/** List the caller's own memberships with public group labels (RLS-scoped). */
export async function listOwnMembershipsWithGroups(): Promise<OwnMembershipWithGroup[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("connect_group_members")
      .select(
        `${OWN_SELECT}, connect_groups ( name, slug, status, meeting_day, meeting_time, location_note )`,
      )
      .eq("profile_id", user.id)
      .order("requested_at", { ascending: false });
    if (error || !data) return [];

    return (data as unknown as Record<string, unknown>[])
      .map((row) => {
        const base = mapOwn(row);
        if (!base) return null;
        const g = row.connect_groups as
          | {
              name?: string;
              slug?: string;
              status?: string;
              meeting_day?: number | null;
              meeting_time?: string | null;
              location_note?: string | null;
            }
          | {
              name?: string;
              slug?: string;
              status?: string;
              meeting_day?: number | null;
              meeting_time?: string | null;
              location_note?: string | null;
            }[]
          | null;
        const group = Array.isArray(g) ? g[0] : g;
        return {
          ...base,
          group_name: group?.name ?? null,
          group_slug: group?.slug ?? null,
          group_status: group?.status ?? null,
          group_meeting_day:
            typeof group?.meeting_day === "number" ? group.meeting_day : null,
          group_meeting_time: group?.meeting_time ?? null,
          group_location_note: group?.location_note ?? null,
        } satisfies OwnMembershipWithGroup;
      })
      .filter((m): m is OwnMembershipWithGroup => m !== null);
  } catch {
    return [];
  }
}
