import "server-only";
import { createClient } from "@/supabase/server";

/** Safe member-facing giving history row (never includes admin_notes / raw_callback / phone). */
export interface MemberGivingHistoryItem {
  id: string;
  category_label: string | null;
  external_reference: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

/** Columns granted to authenticated + queried for My Giving (must match migration 0033). */
const MEMBER_GIVING_SELECT =
  "id,external_reference,amount_cents,currency,status,created_at,category:giving_categories(label)";

export const MEMBER_GIVING_SAFE_COLUMNS = [
  "id",
  "category_id",
  "external_reference",
  "amount_cents",
  "currency",
  "status",
  "created_at",
] as const;

export const MEMBER_GIVING_EXCLUDED_COLUMNS = [
  "phone",
  "provider",
  "updated_at",
  "admin_notes",
  "raw_callback",
  "created_by",
] as const;

const KNOWN_STATUSES = new Set([
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
]);

function mapRow(row: Record<string, unknown>): MemberGivingHistoryItem | null {
  if (!row.id || row.amount_cents == null || !row.currency || !row.status || !row.created_at) {
    return null;
  }
  const status = String(row.status);
  if (!KNOWN_STATUSES.has(status)) return null;

  const cat = row.category as { label?: string } | { label?: string }[] | null;
  const category = Array.isArray(cat) ? cat[0] : cat;

  return {
    id: String(row.id),
    category_label: category?.label ?? null,
    external_reference: row.external_reference ? String(row.external_reference) : null,
    amount_cents: Number(row.amount_cents),
    currency: String(row.currency),
    status,
    created_at: String(row.created_at),
  };
}

/**
 * List the current user's giving transactions (RLS: created_by = auth.uid()).
 * Uses the authenticated session client — never service-role.
 */
export async function listOwnGivingHistory(): Promise<{
  ok: boolean;
  items: MemberGivingHistoryItem[];
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
      .from("giving_transactions")
      .select(MEMBER_GIVING_SELECT)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { ok: false, items: [] };
    }

    const items = (data as unknown as Record<string, unknown>[] | null)
      ?.map(mapRow)
      .filter((r): r is MemberGivingHistoryItem => r !== null) ?? [];

    return { ok: true, items };
  } catch {
    return { ok: false, items: [] };
  }
}

export function formatGivingAmount(amountCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

export function givingStatusLabel(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "Successful";
    case "PENDING":
      return "Pending";
    case "PROCESSING":
      return "Processing";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}
