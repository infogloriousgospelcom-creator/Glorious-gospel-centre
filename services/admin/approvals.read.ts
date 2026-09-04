import "server-only";
import { createClient } from "@/supabase/server";
export interface PendingItem {
  table: "events" | "sermons" | "announcements" | "pages";
  id: string;
  title: string;
  created_at: string;
}

export async function listPendingContent(): Promise<PendingItem[]> {
  try {
    const supabase = createClient();
    const [events, sermons, announcements, pages] = await Promise.all([
      supabase.from("events").select("id,title,created_at").eq("status", "PENDING_APPROVAL").order("created_at", { ascending: false }),
      supabase.from("sermons").select("id,title,created_at").eq("status", "PENDING_APPROVAL").order("created_at", { ascending: false }),
      supabase.from("announcements").select("id,title,created_at").eq("status", "PENDING_APPROVAL").order("created_at", { ascending: false }),
      supabase.from("pages").select("id,title,created_at").eq("status", "PENDING_APPROVAL").order("created_at", { ascending: false }),
    ]);
    const out: PendingItem[] = [];
    for (const e of events.data ?? []) out.push({ table: "events", id: e.id, title: e.title, created_at: e.created_at });
    for (const s of sermons.data ?? []) out.push({ table: "sermons", id: s.id, title: s.title, created_at: s.created_at });
    for (const a of announcements.data ?? []) out.push({ table: "announcements", id: a.id, title: a.title, created_at: a.created_at });
    for (const p of pages.data ?? []) out.push({ table: "pages", id: p.id, title: p.title, created_at: p.created_at });
    return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  } catch { return []; }
}
