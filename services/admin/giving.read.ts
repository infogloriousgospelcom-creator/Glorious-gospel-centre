import "server-only";
import { createClient } from "@/supabase/server";
export interface AdminGivingRow {
  id: string; category_id: string | null; provider: string; external_reference: string | null;
  amount_cents: number; currency: string; phone: string | null;
  status: string; created_at: string;
  category_label?: string;
}
export async function listAllGiving(): Promise<AdminGivingRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("giving_transactions").select(
      "id,category_id,provider,external_reference,amount_cents,currency,phone,status,created_at,category:giving_categories(label)"
    ).order("created_at", { ascending: false }).limit(200);
    if (error) return [];
    return (data ?? []).map((r) => {
      const cat = Array.isArray(r.category) ? r.category[0] : r.category;
      return { ...(r as Omit<AdminGivingRow, "category_label">), category_label: (cat as { label?: string } | null)?.label };
    });
  } catch { return []; }
}

export interface AdminCategoryRow {
  id: string; kind: string; label: string; description: string | null;
  is_active: boolean; sort_order: number;
}
export async function listAllGivingCategories(): Promise<AdminCategoryRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("giving_categories").select("id,kind,label,description,is_active,sort_order").order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []) as AdminCategoryRow[];
  } catch { return []; }
}
