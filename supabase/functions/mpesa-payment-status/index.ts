import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface TransactionStatus {
  id: string;
  status: string;
  externalReference: string | null;
  amountCents: number;
  currency: string;
  phone: string | null;
  categoryLabel: string | null;
  createdAt: string;
  updatedAt: string;
  mpesaReceiptNumber: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "GET") {
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
    const authHeader =
      req.headers.get("Authorization");

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

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    if (!supabaseUrl || !serviceRoleKey) {
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

    const accessToken =
      authHeader.replace(
        "Bearer ",
        "",
      );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(
      accessToken,
    );

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

    const url = new URL(req.url);

    const transactionId =
      url.searchParams.get(
        "transactionId",
      );

    const externalReference =
      url.searchParams.get(
        "externalReference",
      );

    if (
      !transactionId &&
      !externalReference
    ) {
      return new Response(
        JSON.stringify({
          error:
            "transactionId or externalReference required",
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

    /*
     * IMPORTANT:
     *
     * created_by references profiles.id, and profiles.id
     * references auth.users.id.
     *
     * Therefore user.id is the correct value to use here.
     */
    let query = supabase
      .from("giving_transactions")
      .select(
        `
          id,
          status,
          external_reference,
          amount_cents,
          currency,
          phone,
          created_at,
          updated_at,
          raw_callback,
          category:giving_categories(label)
        `,
      )
      .eq("created_by", user.id)
      .eq("provider", "mpesa-daraja");

    if (transactionId) {
      query = query.eq(
        "id",
        transactionId,
      );
    } else {
      query = query.eq(
        "external_reference",
        externalReference!,
      );
    }

    const {
      data,
      error,
    } = await query.maybeSingle();

    if (error) {
      console.error(
        "Transaction lookup failed:",
        error,
      );

      return new Response(
        JSON.stringify({
          error: "Could not retrieve transaction",
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

    if (!data) {
      return new Response(
        JSON.stringify({
          error: "Transaction not found",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    /*
     * Supabase may return the related category as an
     * object or array depending on the relationship shape.
     */
    const category = Array.isArray(
      data.category,
    )
      ? data.category[0]
      : data.category;

    /*
     * Extract the M-Pesa receipt from the stored
     * Daraja callback.
     */
    let mpesaReceiptNumber:
      | string
      | null = null;

    if (
      data.raw_callback &&
      typeof data.raw_callback === "object"
    ) {
      const raw =
        data.raw_callback as Record<
          string,
          unknown
        >;

      const body =
        raw.Body as
          | Record<string, unknown>
          | undefined;

      const stkCallback =
        body?.stkCallback as
          | Record<string, unknown>
          | undefined;

      const callbackMetadata =
        stkCallback?.CallbackMetadata as
          | Record<string, unknown>
          | undefined;

      const items =
        callbackMetadata?.Item as
          | Array<
              Record<string, unknown>
            >
          | undefined;

      if (Array.isArray(items)) {
        for (const item of items) {
          if (
            item.Name ===
              "MpesaReceiptNumber" &&
            typeof item.Value === "string"
          ) {
            mpesaReceiptNumber =
              item.Value;

            break;
          }
        }
      }
    }

    const transaction: TransactionStatus =
      {
        id: data.id,

        status: data.status,

        externalReference:
          data.external_reference,

        amountCents:
          data.amount_cents,

        currency:
          data.currency,

        phone:
          data.phone,

        categoryLabel:
          (
            category as
              | {
                  label?: string;
                }
              | null
              | undefined
          )?.label ?? null,

        createdAt:
          data.created_at,

        updatedAt:
          data.updated_at,

        mpesaReceiptNumber,
      };

    /*
     * Do NOT return raw_callback to the frontend.
     *
     * It remains stored server-side for auditing/debugging.
     */
    return new Response(
      JSON.stringify({
        ok: true,
        transaction,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "mpesa-payment-status error:",
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