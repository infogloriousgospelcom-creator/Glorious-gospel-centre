import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { initiateGiving } from "@/services/giving";
import { getCurrentAdmin } from "@/services/auth";

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
 * Reserved for authenticated administrators who hold the
 * `giving.manage` permission. The endpoint validates the session cookie
 * (issued by Supabase Auth via @supabase/ssr) before initiating any
 * payment request, and rejects any caller who lacks the permission.
 *
 * Public giving is performed via the /give server action which applies
 * its own rate-limit, honeypot, and CAPTCHA-style protections.
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }
  if (!session.permissionKeys.includes("giving.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  try {
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
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}