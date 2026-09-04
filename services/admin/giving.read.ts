import "server-only";
import { createClient } from "@/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";

export interface AdminTransactionDetail {
  id: string;
  category_id: string | null;
  provider: string;
  external_reference: string | null;
  amount_cents: number;
  currency: string;
  phone: string | null;
  status: string;
  raw_callback: unknown;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  category_label?: string;
}

export async function listAllGivingFiltered(input: {
  status?: string;
  search?: string;
  actorId: string;
}): Promise<Array<AdminTransactionDetail & { category_label?: string }>> {
  try {
    const supabase = createClient();
    let q = supabase
      .from("giving_transactions")
      .select(
        "id,category_id,provider,external_reference,amount_cents,currency,phone,status,raw_callback,admin_notes,created_at,updated_at,category:giving_categories(label)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (input.status && input.status !== "all") q = q.eq("status", input.status);
    const s = input.search?.trim();
    if (s) {
      const escaped = s.replace(/[%_]/g, (m) => `\\${m}`);
      q = q.or(`phone.ilike.%${escaped}%,external_reference.ilike.%${escaped}%,admin_notes.ilike.%${escaped}%`);
    }
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []).map((r) => {
      const cat = Array.isArray(r.category) ? r.category[0] : r.category;
      return { ...(r as AdminTransactionDetail), category_label: (cat as { label?: string } | null)?.label };
    });
  } catch { return []; }
}

export async function getTransactionForAdmin(input: {
  id: string;
  actorId: string;
}): Promise<AdminTransactionDetail | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("giving_transactions")
      .select(
        "id,category_id,provider,external_reference,amount_cents,currency,phone,status,raw_callback,admin_notes,created_at,updated_at,category:giving_categories(label)",
      )
      .eq("id", input.id)
      .maybeSingle();
    if (error) return null;
    await writeAuditLog({
      actorId: input.actorId,
      action: "giving.read",
      entityType: "giving_transaction",
      entityId: input.id,
      metadata: { found: Boolean(data) },
      ipHash: getClientIpHash(),
    });
    if (!data) return null;
    const cat = Array.isArray(data.category) ? data.category[0] : data.category;
    return { ...(data as AdminTransactionDetail), category_label: (cat as { label?: string } | null)?.label };
  } catch { return null; }
}
