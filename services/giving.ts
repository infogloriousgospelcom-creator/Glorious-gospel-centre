import "server-only";
import { createClient } from "@/supabase/server";
import { getServiceRoleClient } from "@/lib/service-role";
import { getPaymentProvider } from "@/services/payment";
import type { GivingCategory } from "@/types/content";

export interface GivingCategoryView extends GivingCategory {
  is_default: boolean;
}

export async function listActiveGivingCategories(): Promise<GivingCategoryView[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("giving_categories")
      .select("id,kind,label,description,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []).map((row, i) => ({ ...(row as GivingCategory), is_default: i === 0 }));
  } catch {
    return [];
  }
}

export interface InitiateGivingInput {
  categoryId: string;
  amountCents: number;
  currency: string;
  phone: string;
  description: string;
  donorName?: string;
}

export interface InitiateGivingResult {
  ok: boolean;
  message: string;
  transactionId?: string;
  externalReference?: string;
  mode: "live" | "mock";
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function initiateGiving(input: InitiateGivingInput): Promise<InitiateGivingResult> {
  if (input.amountCents <= 0) {
    return { ok: false, message: "Amount must be greater than zero.", mode: "live" };
  }
  try {
    const supabase = createClient();
    // Idempotency key derived from category + amount + phone + a 5-minute window.
    // Two submissions within the window with the same inputs collapse into one transaction.
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
    const idempotencyKey = `${input.categoryId}|${input.amountCents}|${input.phone}|${bucket}`;
    const { data: existing } = await supabase
      .from("giving_transactions")
      .select("id,external_reference,status")
      .eq("category_id", input.categoryId)
      .eq("amount_cents", input.amountCents)
      .eq("phone", input.phone)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let transactionId: string;
    if (existing) {
      transactionId = existing.id;
    } else {
      const { data, error } = await supabase
        .from("giving_transactions")
        .insert({
          category_id: input.categoryId,
          amount_cents: input.amountCents,
          currency: input.currency,
          phone: input.phone,
          status: "PENDING",
          provider: getPaymentProvider().id,
          external_reference: idempotencyKey,
        })
        .select("id")
        .single();
      if (error || !data) {
        return { ok: false, message: "Could not initiate giving.", mode: "live" };
      }
      transactionId = data.id;
    }

    const provider = getPaymentProvider();
    const result = await provider.stkPush({
      transactionId,
      amountCents: input.amountCents,
      currency: input.currency,
      phone: input.phone,
      description: input.description,
      callbackUrl: `${siteUrl()}/api/mpesa/callback`,
    });

    await supabase
      .from("giving_transactions")
      .update({
        external_reference: result.externalReference || idempotencyKey,
        status: result.accepted ? "PROCESSING" : "FAILED",
        raw_callback: result.raw,
      })
      .eq("id", transactionId);

    return {
      ok: result.accepted,
      message: result.accepted
        ? provider.mode === "mock"
          ? "Mock STK Push accepted. In live mode, the customer would now receive a Daraja prompt on their phone."
          : "STK Push initiated. Check your phone to complete the payment."
        : result.message ?? "Provider declined the request.",
      transactionId,
      externalReference: result.externalReference,
      mode: provider.mode,
    };
  } catch {
    return { ok: false, message: "Could not initiate giving.", mode: "live" };
  }
}

export async function applyCallback(payload: {
  externalReference: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
  raw: unknown;
}): Promise<{ updated: boolean; status: string | null }> {
  try {
    // The webhook is unauthenticated; RLS on giving_transactions only
    // allows admins to mutate. Bypass RLS via the service-role client —
    // analogous to how approval_history and audit_logs are written.
    const supabase = getServiceRoleClient();
    const { data: tx, error: lookupErr } = await supabase
      .from("giving_transactions")
      .select("id,status")
      .eq("external_reference", payload.externalReference)
      .maybeSingle();
    if (lookupErr || !tx) return { updated: false, status: null };
    if (tx.status === "SUCCESS") return { updated: false, status: tx.status };
    const next = payload.status;
    const { error } = await supabase
      .from("giving_transactions")
      .update({
        status: next,
        raw_callback: payload.raw,
      })
      .eq("id", tx.id)
      .neq("status", "SUCCESS");
    if (error) return { updated: false, status: tx.status };
    return { updated: true, status: next };
  } catch {
    return { updated: false, status: null };
  }
}
