import "server-only";
import { createClient } from "@/supabase/server";

export interface AdminEventRow {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  poster_url: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  speaker: string | null;
  status: string;
  registration_required: boolean;
  published_at: string | null;
  created_at: string;
}

export async function listAllEvents(): Promise<AdminEventRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,slug,title,starts_at,ends_at,location,status,registration_required,published_at,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as AdminEventRow[];
  } catch {
    return [];
  }
}

export async function getEventForAdmin(id: string): Promise<AdminEventRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,slug,title,short_description,description,poster_url,starts_at,ends_at,location,speaker,registration_required,status,published_at,created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as AdminEventRow | null;
  } catch {
    return null;
  }
}

export async function listEventRegistrations(eventId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("event_registrations")
      .select("id,full_name,email,phone,notes,created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}
