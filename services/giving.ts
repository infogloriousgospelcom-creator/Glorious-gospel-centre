import "server-only";

import { createClient } from "@/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import { getServerEnv, publicEnv } from "@/lib/env";
import { canTransition, isTerminalSuccess } from "@/lib/payment-transitions";
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

    return (data ?? []).map((row, i) => ({
      ...(row as GivingCategory),
      is_default: i === 0,
    }));
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
  /** When set (e.g. API Bearer), use this JWT instead of the cookie session. */
  accessToken?: string;
}

export interface InitiateGivingResult {
  ok: boolean;
  message: string;
  transactionId?: string;
  externalReference?: string;
  mode: "live" | "mock";
}

export async function initiateGiving(
  input: InitiateGivingInput,
): Promise<InitiateGivingResult> {
  if (input.amountCents <= 0 || input.amountCents > 10_000_000) {
    return {
      ok: false,
      message: "Amount must be greater than zero and within allowed limits.",
      mode: "live",
    };
  }

  try {
    const supabase = createClient();
    const env = getServerEnv();

    const isMock =
      !env.M_PESA_CONSUMER_KEY ||
      !env.M_PESA_CONSUMER_SECRET ||
      !env.M_PESA_SHORTCODE ||
      !env.M_PESA_PASSKEY;

    let accessToken = input.accessToken;
    let userId: string | undefined;

    if (accessToken) {
      const {
        data: { user },
        error: tokenError,
      } = await supabase.auth.getUser(accessToken);
      if (tokenError || !user) {
        return {
          ok: false,
          message: "You must be signed in to make a gift.",
          mode: isMock ? "mock" : "live",
        };
      }
      userId = user.id;
    } else {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          ok: false,
          message: "You must be signed in to make a gift.",
          mode: "live",
        };
      }
      userId = user.id;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          ok: false,
          message: "Your session has expired. Please sign in again.",
          mode: isMock ? "mock" : "live",
        };
      }
      accessToken = session.access_token;
    }

    void userId;

    const supabaseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || !accessToken) {
      return {
        ok: false,
        message: "Supabase is not configured correctly.",
        mode: isMock ? "mock" : "live",
      };
    }

    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/functions/v1/mpesa-stk-push`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          categoryId: input.categoryId,
          amountCents: input.amountCents,
          currency: input.currency,
          phone: input.phone,
          description: input.description,
          donorName: input.donorName,
        }),
      },
    );

    let result: {
      ok?: boolean;
      message?: string;
      error?: string;
      transactionId?: string;
      externalReference?: string;
      mode?: "live" | "mock";
    };

    try {
      result = await response.json();
    } catch {
      return {
        ok: false,
        message: "The payment service returned an invalid response.",
        mode: isMock ? "mock" : "live",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        message: result.error ?? result.message ?? "Could not initiate giving.",
        mode: result.mode ?? (isMock ? "mock" : "live"),
      };
    }

    return {
      ok: result.ok ?? false,
      message: result.message ?? "Payment request submitted.",
      transactionId: result.transactionId,
      externalReference: result.externalReference,
      mode: result.mode ?? (isMock ? "mock" : "live"),
    };
  } catch (error) {
    console.error("initiateGiving error:", error);

    return {
      ok: false,
      message: "Could not connect to the payment service.",
      mode: "live",
    };
  }
}

export async function applyCallback(payload: {
  externalReference: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
  raw: unknown;
  /** When present, must match the row id (signed CallBackURL). */
  transactionId?: string;
}): Promise<{ updated: boolean; status: string | null; reason?: string }> {
  try {
    if (!isServiceRoleConfigured()) {
      return { updated: false, status: null, reason: "service_role_unavailable" };
    }
    const supabase = createServiceRoleClient();

    let query = supabase
      .from("giving_transactions")
      .select("id,status,external_reference")
      .eq("external_reference", payload.externalReference);

    if (payload.transactionId) {
      query = supabase
        .from("giving_transactions")
        .select("id,status,external_reference")
        .eq("id", payload.transactionId);
    }

    const { data: tx, error: lookupErr } = await query.maybeSingle();

    if (lookupErr || !tx) {
      return { updated: false, status: null, reason: "not_found" };
    }

    if (payload.transactionId && tx.id !== payload.transactionId) {
      return { updated: false, status: tx.status, reason: "tx_mismatch" };
    }

    if (
      payload.transactionId &&
      tx.external_reference &&
      !String(tx.external_reference).includes("|") &&
      tx.external_reference !== payload.externalReference
    ) {
      return { updated: false, status: tx.status, reason: "ref_mismatch" };
    }

    if (isTerminalSuccess(tx.status)) {
      return { updated: false, status: tx.status };
    }

    if (!canTransition(tx.status, payload.status)) {
      return { updated: false, status: tx.status, reason: "forbidden_transition" };
    }

    const { error } = await supabase
      .from("giving_transactions")
      .update({
        status: payload.status,
        external_reference: payload.externalReference,
        raw_callback: payload.raw,
      })
      .eq("id", tx.id)
      .neq("status", "SUCCESS");

    if (error) {
      return { updated: false, status: tx.status, reason: "update_failed" };
    }

    return { updated: true, status: payload.status };
  } catch {
    return { updated: false, status: null, reason: "error" };
  }
}
