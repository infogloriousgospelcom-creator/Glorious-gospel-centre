import "server-only";
import { createClient } from "@/supabase/server";
import {
  isSafeMemberNotificationHref,
  type MemberNotificationItem,
} from "@/lib/member-notifications";

export type { MemberNotificationItem } from "@/lib/member-notifications";
export { isSafeMemberNotificationHref } from "@/lib/member-notifications";

const MEMBER_NOTIFICATION_SELECT =
  "id,kind,title,body,href,source_type,source_id,event_key,read_at,created_at";

function mapRow(row: Record<string, unknown>): MemberNotificationItem | null {
  if (!row.id || !row.kind || !row.title || !row.source_type || !row.event_key || !row.created_at) {
    return null;
  }
  const href = row.href ? String(row.href) : null;
  return {
    id: String(row.id),
    kind: String(row.kind),
    title: String(row.title),
    body: row.body ? String(row.body) : null,
    href: href && isSafeMemberNotificationHref(href) ? href : null,
    source_type: String(row.source_type),
    source_id: row.source_id ? String(row.source_id) : null,
    event_key: String(row.event_key),
    read_at: row.read_at ? String(row.read_at) : null,
    created_at: String(row.created_at),
  };
}

/**
 * List the current user's notifications (RLS: recipient_id = auth.uid()).
 * Session client only — never service-role.
 */
export async function listOwnNotifications(): Promise<{
  ok: boolean;
  items: MemberNotificationItem[];
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return { ok: false, items: [] };
    }

    const { data, error } = await supabase
      .from("member_notifications")
      .select(MEMBER_NOTIFICATION_SELECT)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { ok: false, items: [] };
    }

    const items = (data as unknown as Record<string, unknown>[] | null)
      ?.map(mapRow)
      .filter((r): r is MemberNotificationItem => r !== null) ?? [];

    return { ok: true, items };
  } catch {
    return { ok: false, items: [] };
  }
}

export async function countOwnUnreadNotifications(): Promise<number> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return 0;

    const { count, error } = await supabase
      .from("member_notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
