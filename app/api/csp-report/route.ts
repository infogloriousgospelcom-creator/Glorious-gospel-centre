import { type NextRequest, NextResponse } from "next/server";

/**
 * CSP violation report endpoint.
 * Receives violation reports from browsers when Content-Security-Policy-Report-Only
 * is active. Logs the violation for analysis.
 *
 * Once the report stream is clean, flip the header in middleware.ts from
 * "Content-Security-Policy-Report-Only" to "Content-Security-Policy" to enforce.
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    // Log the violation for analysis — in production you might forward to a
    // SIEM, Sentry, or a dedicated CSP reporting service.
    console.warn("[CSP Violation]", JSON.stringify(report, null, 2));
    return NextResponse.json({ received: true });
  } catch {
    // If parsing fails, still acknowledge receipt to avoid browser retries
    return NextResponse.json({ received: true, parseError: true });
  }
}