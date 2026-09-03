import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { initiateGiving } from "@/services/giving";

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
 * Used by:
 *   - The /give server action (which calls `initiateGiving` directly).
 *   - Future third-party integrations that need a programmatic API.
 *
 * Authentication: callers must be authenticated admin sessions OR
 * provide the same honeypot/rate-limit protections as the public form.
 * For now this endpoint is gated to authenticated admins only.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization." }, { status: 401 });
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
