import { NextResponse, type NextRequest } from "next/server";
import { applyCallback } from "@/services/giving";
import { getPaymentProvider } from "@/services/payment";
import { getServerEnv } from "@/lib/env";
import { verifyCallbackToken } from "@/lib/callback-auth";

/**
 * Secondary M-Pesa callback receiver (Next.js).
 *
 * Production callbacks should hit the Edge Function with a signed CallBackURL.
 * This route remains for local/dev and as a compatibility endpoint.
 *
 * Auth: query `tx` + `sig` HMAC (preferred) OR body HMAC header in live mode.
 * Never accepts missing signatures in production.
 */
export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const secret = env.M_PESA_CALLBACK_SECRET ?? env.M_PESA_PASSKEY ?? null;

  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ error: "Callback secret not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const { searchParams } = new URL(request.url);
  const txId = searchParams.get("tx");
  const sig = searchParams.get("sig");

  let authorized = false;

  if (txId && sig && secret) {
    authorized = verifyCallbackToken(txId, sig, secret);
  } else {
    const signature =
      request.headers.get("x-daraja-signature") ?? request.headers.get("x-signature");
    const provider = getPaymentProvider();
    authorized = provider.verifyCallback(rawBody, signature);
  }

  if (!authorized) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const provider = getPaymentProvider();
  const payload = provider.parseCallback(rawBody);
  if (!payload.externalReference) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const result = await applyCallback({
    externalReference: payload.externalReference,
    status: payload.status,
    raw: payload.raw,
    transactionId: txId ?? undefined,
  });
  return NextResponse.json({ ok: true, ...result });
}
