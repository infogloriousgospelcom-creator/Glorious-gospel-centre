import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { randomUUID } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface StkPushRequest {
  transactionId: string;
  amountCents: number;
  currency: string;
  phone: string;
  description: string;
}

interface StkPushResult {
  externalReference: string;
  accepted: boolean;
  message?: string;
  raw: unknown;
}

interface ProviderConfig {
  mode: "live" | "mock";
  consumerKey?: string;
  consumerSecret?: string;
  shortcode?: string;
  passkey?: string;
  environment: "sandbox" | "production";
}

function isMockMode(config: ProviderConfig): boolean {
  return (
    config.mode === "mock" ||
    !config.consumerKey ||
    !config.consumerSecret ||
    !config.shortcode ||
    !config.passkey
  );
}

/**
 * Convert common Kenyan phone formats to 254XXXXXXXXX.
 *
 * Examples:
 * 0712345678 -> 254712345678
 * 712345678  -> 254712345678
 * +254712345678 -> 254712345678
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (
    (digits.startsWith("7") || digits.startsWith("1")) &&
    digits.length === 9
  ) {
    return `254${digits}`;
  }

  return digits;
}

/**
 * Temporary idempotency reference used before Daraja returns
 * the actual CheckoutRequestID.
 */
function generateIdempotencyKey(
  categoryId: string,
  amountCents: number,
  phone: string,
): string {
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000));

  return `${categoryId}|${amountCents}|${phone}|${bucket}`;
}

/**
 * Daraja expects:
 * YYYYMMDDHHmmss
 *
 * Use Africa/Nairobi explicitly because the Edge Function runtime
 * should not be assumed to use Kenya's timezone.
 */
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

  return (
    `${values.year}` +
    `${values.month}` +
    `${values.day}` +
    `${values.hour}` +
    `${values.minute}` +
    `${values.second}`
  );
}

async function fetchOAuthToken(
  config: ProviderConfig,
): Promise<string | null> {
  if (!config.consumerKey || !config.consumerSecret) {
    return null;
  }

  const base =
    config.environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const credentials = `${config.consumerKey}:${config.consumerSecret}`;
const encodedCredentials = btoa(credentials);

  const response = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
       Authorization: `Basic ${encodedCredentials}`,
      },
    },
  );

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Daraja OAuth failed:", {
      status: response.status,
      response: json,
    });

    return null;
  }

  return typeof json.access_token === "string"
    ? json.access_token
    : null;
}

async function stkPushLive(
  config: ProviderConfig,
  request: StkPushRequest,
  callbackUrl: string,
): Promise<StkPushResult> {
  if (
    !config.consumerKey ||
    !config.consumerSecret ||
    !config.shortcode ||
    !config.passkey
  ) {
    return {
      externalReference: "",
      accepted: false,
      message: "M-Pesa configuration is incomplete.",
      raw: null,
    };
  }

  const base =
    config.environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const token = await fetchOAuthToken(config);

  if (!token) {
    return {
      externalReference: "",
      accepted: false,
      message: "Daraja OAuth authentication failed.",
      raw: null,
    };
  }

  const timestamp = generateDarajaTimestamp();

  const password = btoa(
    `${config.shortcode}${config.passkey}${timestamp}`,
  );

  const phone = normalizePhone(request.phone);

  if (!/^254[17]\d{8}$/.test(phone)) {
    return {
      externalReference: "",
      accepted: false,
      message: "Invalid Kenyan M-Pesa phone number.",
      raw: null,
    };
  }

  const amount = Math.round(request.amountCents / 100);

  if (amount <= 0) {
    return {
      externalReference: "",
      accepted: false,
      message: "Invalid payment amount.",
      raw: null,
    };
  }

  const requestBody = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: config.shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: request.transactionId.slice(0, 12),
    TransactionDesc: request.description.slice(0, 200),
  };

  console.log("Sending Daraja STK Push:", {
    environment: config.environment,
    shortcode: config.shortcode,
    amount,
    phone: `${phone.slice(0, 6)}******`,
    callbackUrl,
    timestamp,
  });

  const response = await fetch(
    `${base}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  const json: Record<string, unknown> =
    await response.json().catch(() => ({}));

  console.log("Daraja STK Push response:", {
    status: response.status,
    response: json,
  });

  const checkoutId =
    typeof json.CheckoutRequestID === "string"
      ? json.CheckoutRequestID
      : "";

  const responseCode =
    typeof json.ResponseCode === "string"
      ? json.ResponseCode
      : "";

  const accepted =
    response.ok &&
    Boolean(checkoutId) &&
    (responseCode === "" || responseCode === "0");

  return {
    externalReference: checkoutId,
    accepted,
    message:
      typeof json.errorMessage === "string"
        ? json.errorMessage
        : typeof json.ResponseDescription === "string"
          ? json.ResponseDescription
          : undefined,
    raw: json,
  };
}

function stkPushMock(
  request: StkPushRequest,
): StkPushResult {
  const externalReference = `mock_${randomUUID()}`;

  return {
    externalReference,
    accepted: true,
    message:
      "Mock STK Push accepted. Configure Daraja sandbox credentials to enable real sandbox STK Pushes.",
    raw: {
      transactionId: request.transactionId,
      externalReference,
      mock: true,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase environment variables are missing.");

      return new Response(
        JSON.stringify({
          error: "Server configuration error",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    const accessToken = authHeader.replace(
      "Bearer ",
      "",
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Invalid token",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const body = await req.json();

    const {
      categoryId,
      amountCents,
      currency = "KES",
      phone,
      description,
    } = body as {
      categoryId?: string;
      amountCents?: number;
      currency?: string;
      phone?: string;
      description?: string;
    };

    if (
      !categoryId ||
      typeof amountCents !== "number" ||
      !Number.isFinite(amountCents) ||
      amountCents <= 0 ||
      amountCents > 10_000_000 ||
      !phone ||
      typeof phone !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const config: ProviderConfig = {
      mode: Deno.env.get("M_PESA_CONSUMER_KEY")
        ? "live"
        : "mock",

      consumerKey: Deno.env.get(
        "M_PESA_CONSUMER_KEY",
      ),

      consumerSecret: Deno.env.get(
        "M_PESA_CONSUMER_SECRET",
      ),

      shortcode: Deno.env.get(
        "M_PESA_SHORTCODE",
      ),

      passkey: Deno.env.get(
        "M_PESA_PASSKEY",
      ),

      environment:
        Deno.env.get("M_PESA_ENVIRONMENT") ===
        "production"
          ? "production"
          : "sandbox",
    };

    /*
     * Safaricom needs a publicly reachable HTTPS callback.
     * Embed HMAC(txId) so mpesa-callback can authenticate Daraja POSTs
     * (Daraja does not sign request bodies).
     */
    const callbackSecret =
      Deno.env.get("M_PESA_CALLBACK_SECRET") ??
      Deno.env.get("M_PESA_PASSKEY");

    if (!isMockMode(config) && !callbackSecret) {
      console.error("Callback secret missing for live STK.");
      return new Response(
        JSON.stringify({
          error: "Payment callback is not configured",
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const normalizedPhone = normalizePhone(phone);

    if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
      return new Response(
        JSON.stringify({
          error: "Invalid phone number",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Soft rate limit: max 10 STK attempts per user per 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("giving_transactions")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id)
      .gte("created_at", since);

    if ((recentCount ?? 0) >= 10) {
      return new Response(
        JSON.stringify({
          error: "Too many payment attempts. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const idempotencyKey = generateIdempotencyKey(
      categoryId,
      amountCents,
      normalizedPhone,
    );

    let transactionId: string;

    /*
     * Reuse an existing PENDING transaction for the same
     * user/category/amount/phone combination.
     */
    const { data: existing } = await supabase
      .from("giving_transactions")
      .select(
        "id, external_reference, status, created_by",
      )
      .eq("category_id", categoryId)
      .eq("amount_cents", amountCents)
      .eq("phone", normalizedPhone)
      .eq("created_by", user.id)
      .eq("status", "PENDING")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (existing) {
      transactionId = existing.id;
    } else {
      const { data, error } = await supabase
        .from("giving_transactions")
        .insert({
          category_id: categoryId,
          amount_cents: amountCents,
          currency,
          phone: normalizedPhone,
          status: "PENDING",
          provider: "mpesa-daraja",
          external_reference: idempotencyKey,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error(
          "Could not create giving transaction:",
          error,
        );

        return new Response(
          JSON.stringify({
            error: "Could not initiate giving",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      transactionId = data.id;
    }

    let callbackUrl =
      `${supabaseUrl}/functions/v1/mpesa-callback`;

    if (callbackSecret) {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(callbackSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sigBuf = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`ggc-callback:${transactionId}`),
      );
      const sig = [...new Uint8Array(sigBuf)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      callbackUrl =
        `${callbackUrl}?tx=${encodeURIComponent(transactionId)}&sig=${sig}`;
    }

    const request: StkPushRequest = {
      transactionId,
      amountCents,
      currency,
      phone: normalizedPhone,
      description:
        description?.trim() || "GGC Giving",
    };

    const result = isMockMode(config)
      ? stkPushMock(request)
      : await stkPushLive(
          config,
          request,
          callbackUrl,
        );

    const updatedReference =
      result.externalReference ||
      idempotencyKey;

    const updatedStatus = result.accepted
      ? "PROCESSING"
      : "FAILED";

    const { error: updateError } = await supabase
      .from("giving_transactions")
      .update({
        external_reference: updatedReference,
        status: updatedStatus,
        raw_callback: result.raw,
      })
      .eq("id", transactionId)
      .eq("created_by", user.id);

    if (updateError) {
      console.error(
        "Failed to update giving transaction:",
        updateError,
      );

      return new Response(
        JSON.stringify({
          error:
            "STK Push was processed, but transaction status could not be saved.",
          transactionId,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ok: result.accepted,

        message: result.accepted
          ? config.mode === "mock"
            ? "Mock STK Push accepted. Configure Daraja sandbox credentials to test a real sandbox prompt."
            : "STK Push initiated. Check your phone to complete the payment."
          : result.message ??
            "Daraja declined the STK Push request.",

        transactionId,

        externalReference:
          result.externalReference,

        mode: config.mode,

        environment: config.environment,
      }),
      {
        status: result.accepted ? 200 : 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "mpesa-stk-push error:",
      error,
    );

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});