import "server-only";
import { createClient } from "@/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import type { TestimonyAdminRow, TestimonyStatus } from "@/types/content";

const ADMIN_SELECT =
  "id,slug,title,story,display_name,anonymous,submitter_email,submitter_phone,consent_to_publish,consent_at,status,internal_notes,reviewed_by,reviewed_at,published_at,created_at,updated_at";

/**
 * Authenticate + authorize before any service-role private read.
 * Service-role credentials never leave this server module.
 */
async function assertTestimonyManagerForRead(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;
    const { data: allowed } = await supabase.rpc("has_permission", {
      permission_key: "testimonies.manage",
    });
    return Boolean(allowed);
  } catch {
    return false;
  }
}

export async function listTestimoniesForAdmin(input: {
  status?: string;
  search?: string;
}): Promise<TestimonyAdminRow[]> {
  if (!(await assertTestimonyManagerForRead())) return [];
  if (!isServiceRoleConfigured()) return [];
  try {
    const supabase = createServiceRoleClient();
    let q = supabase.from("testimonies").select(ADMIN_SELECT);
    if (input.status && input.status !== "all") {
      q = q.eq("status", input.status);
    }
    const s = input.search?.trim();
    if (s) {
      const escaped = s.replace(/[%_]/g, (m) => `\\${m}`);
      q = q.or(
        `title.ilike.%${escaped}%,story.ilike.%${escaped}%,display_name.ilike.%${escaped}%,submitter_email.ilike.%${escaped}%`,
      );
    }
    q = q.order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []) as TestimonyAdminRow[];
  } catch {
    return [];
  }
}

export async function getTestimonyForAdmin(
  id: string,
): Promise<TestimonyAdminRow | null> {
  if (!(await assertTestimonyManagerForRead())) return null;
  if (!isServiceRoleConfigured()) return null;
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("testimonies")
      .select(ADMIN_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as TestimonyAdminRow | null;
  } catch {
    return null;
  }
}

export async function countTestimoniesByStatus(): Promise<
  Record<TestimonyStatus | "all", number>
> {
  const counts: Record<TestimonyStatus | "all", number> = {
    all: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  };
  if (!(await assertTestimonyManagerForRead())) return counts;
  if (!isServiceRoleConfigured()) return counts;
  try {
    const rows = await listTestimoniesForAdmin({ status: "all" });
    counts.all = rows.length;
    for (const r of rows) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  } catch {
    return counts;
  }
}
