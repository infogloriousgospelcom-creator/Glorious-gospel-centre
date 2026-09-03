import { NextResponse, type NextRequest } from "next/server";
import { applyCallback } from "@/services/giving";
import { getPaymentProvider } from "@/services/payment";

/**
 * M-Pesa Daraja STK Push callback receiver.
 *
 * Verifies the request signature (HMAC-SHA256 of the raw body using
 * M_PESA_CALLBACK_SECRET), parses the provider payload, and updates
 * the matching `giving_transactions` row idempotently.
 *
 * Always responds 200 unless verification fails — Daraja retries on
 * non-2xx responses.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-daraja-signature") ?? request.headers.get("x-signature");

  const provider = getPaymentProvider();
  if (!provider.verifyCallback(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = provider.parseCallback(rawBody);
  if (!payload.externalReference) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const result = await applyCallback({
    externalReference: payload.externalReference,
    status: payload.status,
    raw: payload.raw,
  });
  return NextResponse.json({ ok: true, ...result });
}
