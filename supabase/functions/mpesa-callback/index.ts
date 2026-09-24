import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TxStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED";

interface CallbackPayload {
  externalReference: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
  raw: unknown;
  resultCode: number;
  resultDescription: string;
}

const ALLOWED_TRANSITIONS: Record<TxStatus, ReadonlySet<string>> = {
  PENDING: new Set(["PROCESSING", "SUCCESS", "FAILED", "CANCELLED"]),
  PROCESSING: new Set(["SUCCESS", "FAILED", "CANCELLED"]),
  SUCCESS: new Set(),
  FAILED: new Set(["FAILED"]),
  CANCELLED: new Set(["CANCELLED"]),
};

function canTransition(from: string, to: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[from as TxStatus];
  if (!allowed) return false;
  return allowed.has(to);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyCallbackToken(
  transactionId: string,
  token: string | null,
  secret: string,
): Promise<boolean> {
  if (!token || !transactionId) return false;
  const expected = await hmacHex(secret, `ggc-callback:${transactionId}`);
  return timingSafeEqualHex(expected, token.toLowerCase());
}

function parseCallback(rawBody: string): CallbackPayload {
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON callback payload");
  }

  const body = parsed.Body as Record<string, unknown> | undefined;
  const stkCallback = body?.stkCallback as Record<string, unknown> | undefined;

  if (!stkCallback) {
    throw new Error("Missing Body.stkCallback in Daraja callback");
  }

  const checkoutRequestId =
    typeof stkCallback.CheckoutRequestID === "string"
      ? stkCallback.CheckoutRequestID
      : "";

  const resultCodeRaw = stkCallback.ResultCode;
  const resultCode =
    typeof resultCodeRaw === "number"
      ? resultCodeRaw
      : Number(resultCodeRaw ?? 1);

  const resultDescription =
    typeof stkCallback.ResultDesc === "string" ? stkCallback.ResultDesc : "";

  let status: CallbackPayload["status"];
  if (resultCode === 0) {
    status = "SUCCESS";
  } else if (resultCode === 1032) {
    status = "CANCELLED";
  } else {
    status = "FAILED";
  }

  return {
    externalReference: checkoutRequestId,
    status,
    raw: parsed,
    resultCode,
    resultDescription,
  };
}

function generateDarajaTimestamp(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

async function confirmWithDarajaQuery(
  checkoutRequestId: string,
): Promise<boolean> {
  const consumerKey = Deno.env.get("M_PESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("M_PESA_CONSUMER_SECRET");
  const shortcode = Deno.env.get("M_PESA_SHORTCODE");
  const passkey = Deno.env.get("M_PESA_PASSKEY");
  const environment = Deno.env.get("M_PESA_ENVIRONMENT");

  if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
    console.error("Daraja Query skipped: credentials missing.");
    return false;
  }

  const base =
    environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  const tokenRes = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );
  if (!tokenRes.ok) return false;
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const accessToken =
    typeof tokenJson.access_token === "string" ? tokenJson.access_token : null;
  if (!accessToken) return false;

  const timestamp = generateDarajaTimestamp();
  const password = btoa(`${shortcode}${passkey}${timestamp}`);

  const queryRes = await fetch(`${base}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const queryJson = (await queryRes.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const resultCode = Number(queryJson.ResultCode ?? queryJson.resultCode ?? 1);
  return queryRes.ok && resultCode === 0;
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const callbackSecret =
      Deno.env.get("M_PESA_CALLBACK_SECRET") ??
      Deno.env.get("M_PESA_PASSKEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase environment variables are missing.");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    // Fail closed: callback authenticity requires a shared secret.
    if (!callbackSecret) {
      console.error("M_PESA_CALLBACK_SECRET / M_PESA_PASSKEY missing.");
      return jsonResponse({ error: "Callback secret not configured" }, 503);
    }

    const url = new URL(req.url);
    const txId = url.searchParams.get("tx");
    const sig = url.searchParams.get("sig");

    if (!txId || !sig) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const tokenOk = await verifyCallbackToken(txId, sig, callbackSecret);
    if (!tokenOk) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const rawBody = await req.text();
    const payload = parseCallback(rawBody);

    if (!payload.externalReference) {
      return jsonResponse({
        ok: true,
        updated: false,
        reason: "missing_checkout_request_id",
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: transaction, error: lookupError } = await supabase
      .from("giving_transactions")
      .select("id, status, provider, external_reference")
      .eq("id", txId)
      .eq("provider", "mpesa-daraja")
      .maybeSingle();

    if (lookupError) {
      console.error("Transaction lookup failed:", lookupError);
      return jsonResponse({ ok: false, error: "Transaction lookup failed" }, 500);
    }

    if (!transaction) {
      return jsonResponse({
        ok: true,
        updated: false,
        reason: "not_found",
      });
    }

    // Once CheckoutRequestID is stored, reject callbacks for a different id.
    // Temporary idempotency keys use `|` and may be replaced by CheckoutRequestID.
    const storedRef = transaction.external_reference as string | null;
    const isTempIdempotencyKey = Boolean(storedRef?.includes("|"));
    if (
      storedRef &&
      !isTempIdempotencyKey &&
      storedRef !== payload.externalReference
    ) {
      console.error("CheckoutRequestID mismatch for transaction", txId);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (transaction.status === "SUCCESS") {
      return jsonResponse({
        ok: true,
        updated: false,
        status: transaction.status,
      });
    }

    if (!canTransition(transaction.status, payload.status)) {
      return jsonResponse({
        ok: true,
        updated: false,
        reason: "forbidden_transition",
        from: transaction.status,
        to: payload.status,
      });
    }

    const finalStatus = payload.status;

    const { error: updateError } = await supabase
      .from("giving_transactions")
      .update({
        status: finalStatus,
        external_reference: payload.externalReference,
        raw_callback: payload.raw,
      })
      .eq("id", transaction.id)
      .neq("status", "SUCCESS");

    if (updateError) {
      console.error("Transaction update failed:", updateError);
      return jsonResponse({ ok: false, error: "Transaction update failed" }, 500);
    }

    // Reconciliation only: never gate SUCCESS and never write status from query.
    if (finalStatus === "SUCCESS") {
      void confirmWithDarajaQuery(payload.externalReference).catch(() => undefined);
    }

    return jsonResponse({
      ok: true,
      updated: true,
      status: finalStatus,
    });
  } catch (error) {
    console.error("mpesa-callback error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    const isInvalidCallback =
      message.includes("Invalid JSON") ||
      message.includes("Missing Body.stkCallback");

    return jsonResponse(
      {
        error: isInvalidCallback ? message : "Internal server error",
      },
      isInvalidCallback ? 400 : 500,
    );
  }
});
