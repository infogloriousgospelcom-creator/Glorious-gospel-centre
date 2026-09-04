import "server-only";
import { createClient } from "@/supabase/server";

export interface DashboardCounts {
  upcomingEvents: number;
  publishedSermons: number;
  newPrayerRequests: number;
  galleryAlbums: number;
  unreadMessages: number;
  pendingContent: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const nowIso = new Date().toISOString();
  try {
    const supabase = createClient();
    const [
      { count: upcomingEvents },
      { count: publishedSermons },
      { count: newPrayerRequests },
      { count: galleryAlbums },
      { count: unreadMessages },
      { count: pendingEvents },
      { count: pendingSermons },
      { count: pendingAnnouncements },
      { count: pendingPages },
    ] = await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "PUBLISHED")
        .gte("starts_at", nowIso),
      supabase
        .from("sermons")
        .select("id", { count: "exact", head: true })
        .eq("status", "PUBLISHED"),
      supabase
        .from("prayer_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "NEW"),
      supabase
        .from("gallery_albums")
        .select("id", { count: "exact", head: true })
        .eq("status", "PUBLISHED"),
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING_APPROVAL"),
      supabase
        .from("sermons")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING_APPROVAL"),
      supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING_APPROVAL"),
      supabase
        .from("pages")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING_APPROVAL"),
    ]);
    return {
      upcomingEvents: upcomingEvents ?? 0,
      publishedSermons: publishedSermons ?? 0,
      newPrayerRequests: newPrayerRequests ?? 0,
      galleryAlbums: galleryAlbums ?? 0,
      unreadMessages: unreadMessages ?? 0,
      pendingContent:
        (pendingEvents ?? 0) +
        (pendingSermons ?? 0) +
        (pendingAnnouncements ?? 0) +
        (pendingPages ?? 0),
    };
  } catch {
    return {
      upcomingEvents: 0,
      publishedSermons: 0,
      newPrayerRequests: 0,
      galleryAlbums: 0,
      unreadMessages: 0,
      pendingContent: 0,
    };
  }
}

export interface DashboardActivity {
  id: string;
  kind: "event" | "sermon" | "prayer" | "message" | "announcement";
  title: string;
  subtitle: string;
  at: string;
  href: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export async function getRecentActivity(limit = 8): Promise<DashboardActivity[]> {
  try {
    const supabase = createClient();
    const [events, sermons, prayers, messages, announcements] = await Promise.all([
      supabase
        .from("events")
        .select("id,title,created_at,status")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("sermons")
        .select("id,title,preached_on,status,created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("prayer_requests")
        .select("id,full_name,request_text,created_at,status")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("contact_messages")
        .select("id,full_name,subject,created_at,is_read")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("announcements")
        .select("id,title,created_at,status")
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const items: DashboardActivity[] = [];
    const push = (
      kind: DashboardActivity["kind"],
      id: string,
      title: string,
      subtitle: string,
      at: string,
      href: string,
    ) => {
      items.push({ id: `${kind}:${id}`, kind, title, subtitle, at, href });
    };

    for (const e of events.data ?? []) {
      push("event", e.id, e.title, `Event · ${e.status}`, e.created_at, `/admin/events/${e.id}`);
    }
    for (const s of sermons.data ?? []) {
      push(
        "sermon",
        s.id,
        s.title,
        `Sermon · ${s.preached_on} · ${s.status}`,
        s.created_at,
        `/admin/sermons/${s.id}`,
      );
    }
    for (const p of prayers.data ?? []) {
      const preview = p.request_text.length > 80 ? `${p.request_text.slice(0, 77)}...` : p.request_text;
      push(
        "prayer",
        p.id,
        p.full_name ?? "Anonymous",
        `Prayer · ${p.status} · ${preview}`,
        p.created_at,
        `/admin/prayer-requests`,
      );
    }
    for (const m of messages.data ?? []) {
      push(
        "message",
        m.id,
        m.full_name,
        m.subject ? `Message · ${m.subject}` : "Message",
        m.created_at,
        `/admin/messages`,
      );
    }
    for (const a of announcements.data ?? []) {
      push("announcement", a.id, a.title, `Announcement · ${a.status}`, a.created_at, `/admin/announcements`);
    }

    items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    return items.slice(0, limit).map((it) => ({ ...it, subtitle: timeAgo(it.at) + " · " + it.subtitle }));
  } catch {
    return [];
  }
}
