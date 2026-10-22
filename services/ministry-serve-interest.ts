import "server-only";
import { createClient } from "@/supabase/server";
import { getCurrentUser } from "@/services/auth";
import {
  isOpenServeInterestStatus,
  type OwnServeInterest,
  type ServeInterestOption,
} from "@/lib/ministry-serve-interest";

const MEMBER_SELECT = "id,ministry_id,status,member_note,created_at";

export async function listOwnServeInterests(): Promise<{
  ok: boolean;
  items: OwnServeInterest[];
}> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, items: [] };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministry_serve_interests")
      .select(MEMBER_SELECT)
      .eq("profile_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { ok: false, items: [] };

    const rows = data ?? [];
    const ministryIds = [
      ...new Set(rows.map((r) => r.ministry_id).filter((id): id is string => Boolean(id))),
    ];
    const names = new Map<string, string>();
    if (ministryIds.length > 0) {
      const { data: ministries } = await supabase
        .from("ministries")
        .select("id,name")
        .in("id", ministryIds);
      for (const m of ministries ?? []) names.set(m.id, m.name);
    }

    return {
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        ministry_id: r.ministry_id,
        ministry_name: r.ministry_id ? (names.get(r.ministry_id) ?? "Ministry") : null,
        status: r.status,
        member_note: r.member_note,
        created_at: r.created_at,
      })),
    };
  } catch {
    return { ok: false, items: [] };
  }
}

export async function findOpenOwnServeInterest(input: {
  ministryId: string | null;
}): Promise<OwnServeInterest | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const supabase = createClient();
    let q = supabase
      .from("ministry_serve_interests")
      .select(MEMBER_SELECT)
      .eq("profile_id", user.userId)
      .in("status", ["NEW", "CONTACTED", "ACCEPTED"]);
    if (input.ministryId) q = q.eq("ministry_id", input.ministryId);
    else q = q.is("ministry_id", null);
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    if (!isOpenServeInterestStatus(data.status)) return null;
    return {
      id: data.id,
      ministry_id: data.ministry_id,
      ministry_name: null,
      status: data.status,
      member_note: data.member_note,
      created_at: data.created_at,
    };
  } catch {
    return null;
  }
}

export async function listPublishedMinistryOptions(): Promise<ServeInterestOption[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministries")
      .select("id,name,slug")
      .eq("status", "PUBLISHED")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as ServeInterestOption[];
  } catch {
    return [];
  }
}
