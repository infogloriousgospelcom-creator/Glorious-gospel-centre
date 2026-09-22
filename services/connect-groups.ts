import "server-only";
import { createClient } from "@/supabase/server";
import { isPublicConnectGroupStatus } from "@/lib/connect-groups";
import type { ConnectGroupPublic } from "@/types/content";

const PUBLIC_SELECT =
  "id,slug,name,short_description,description,meeting_day,meeting_time,meeting_frequency,location_note,capacity,leader_display_name,ministry_id,status,sort_order,published_at,created_at,updated_at";

function mapPublic(row: Record<string, unknown>): ConnectGroupPublic | null {
  const status = String(row.status ?? "");
  if (!isPublicConnectGroupStatus(status)) return null;
  if (!row.slug || !row.name) return null;
  if (!row.published_at) return null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    short_description: (row.short_description as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    meeting_day: (row.meeting_day as number | null) ?? null,
    meeting_time: (row.meeting_time as string | null) ?? null,
    meeting_frequency: (row.meeting_frequency as string | null) ?? null,
    location_note: (row.location_note as string | null) ?? null,
    capacity: (row.capacity as number | null) ?? null,
    leader_display_name: (row.leader_display_name as string | null) ?? null,
    ministry_id: (row.ministry_id as string | null) ?? null,
    status,
    sort_order: Number(row.sort_order ?? 0),
    published_at: (row.published_at as string | null) ?? null,
  };
}

export async function getPublicConnectGroups(filters?: {
  meeting_day?: number;
}): Promise<ConnectGroupPublic[]> {
  try {
    const supabase = createClient();
    let q = supabase
      .from("connect_groups")
      .select(PUBLIC_SELECT)
      .in("status", ["OPEN", "FULL", "CLOSED"])
      .not("published_at", "is", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (
      typeof filters?.meeting_day === "number" &&
      filters.meeting_day >= 0 &&
      filters.meeting_day <= 6
    ) {
      q = q.eq("meeting_day", filters.meeting_day);
    }

    const { data, error } = await q;
    if (error) return [];
    return (data ?? [])
      .map((row) => mapPublic(row as Record<string, unknown>))
      .filter((g): g is ConnectGroupPublic => g !== null);
  } catch {
    return [];
  }
}

export async function getPublicConnectGroupBySlug(
  slug: string,
): Promise<ConnectGroupPublic | null> {
  if (!slug || slug.length > 120) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("connect_groups")
      .select(PUBLIC_SELECT)
      .eq("slug", slug)
      .in("status", ["OPEN", "FULL", "CLOSED"])
      .not("published_at", "is", null)
      .maybeSingle();
    if (error || !data) return null;
    return mapPublic(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function countPublicConnectGroups(): Promise<number> {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("connect_groups")
      .select("id", { count: "exact", head: true })
      .in("status", ["OPEN", "FULL", "CLOSED"])
      .not("published_at", "is", null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
