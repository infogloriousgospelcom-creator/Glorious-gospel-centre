import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { initiateGiving } from "@/services/giving";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

const Body = z.object({
  category_id: z.string().uuid(),
  amount: z.coerce.number().positive().max(10_000_000),
  currency: z.string().trim().min(3).max(8).default("KES"),
  phone: z.string().trim().min(7).max(20),
  description: z.string().trim().max(120).optional(),
});

/**
 * Programmatic STK Push initiation endpoint.
 *
 * Decision: KEEP this route. Primary giving uses the server action → Edge
 * Function path. This route exists for programmatic callers and must validate
 * the JWT (not merely check for a `Bearer ` prefix).
 *
 * Authorization model matches giving: any authenticated Supabase user may
 * initiate a gift for themselves (Edge Function binds `created_by`).
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Not configured." }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || token.length < 20) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifier = createSupabaseClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const {
      data: { user },
      error: authError,
    } = await verifier.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = (await request.json()) as Record<string, unknown>;
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await initiateGiving({
      categoryId: parsed.data.category_id,
      amountCents: Math.round(parsed.data.amount * 100),
      currency: parsed.data.currency,
      phone: parsed.data.phone,
      description: parsed.data.description ?? "GGC Giving",
      accessToken: token,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
