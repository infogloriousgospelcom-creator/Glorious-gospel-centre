import "server-only";
import type {
  CallbackPayload,
  PaymentProvider,
  ProviderConfig,
  StkPushRequest,
  StkPushResult,
} from "./provider";
import { isMockMode } from "./provider";
import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Safaricom Daraja M-Pesa STK Push provider.
 *
 * Live mode: calls the Daraja OAuth + STK Push endpoints.
 * Mock mode: returns a deterministic simulated response so the
 *   application can be developed and tested without real credentials.
 *
 * Credentials are read from environment variables at construction time
 * and never logged.
 */
export class MpesaDarajaProvider implements PaymentProvider {
  readonly id = "mpesa-daraja";
  readonly mode: "live" | "mock";

  private readonly consumerKey?: string;
  private readonly consumerSecret?: string;
  private readonly shortcode?: string;
  private readonly passkey?: string;
  private readonly environment: "sandbox" | "production";
  private readonly callbackSecret?: string;

  constructor(cfg: ProviderConfig & { callbackSecret?: string }) {
    this.consumerKey = cfg.consumerKey;
    this.consumerSecret = cfg.consumerSecret;
    this.shortcode = cfg.shortcode;
    this.passkey = cfg.passkey;
    this.environment = cfg.environment;
    this.callbackSecret = cfg.callbackSecret;
    this.mode = isMockMode(cfg) ? "mock" : "live";
  }

  async stkPush(req: StkPushRequest): Promise<StkPushResult> {
    if (this.mode === "mock") {
      return this.stkPushMock(req);
    }
    return this.stkPushLive(req);
  }

  verifyCallback(rawBody: string, signature: string | null): boolean {
    if (this.mode === "mock") {
      // Mock mode: accept a fixed dev signature.
      return signature === "dev-signature" || signature === null;
    }
    if (!this.callbackSecret || !signature) return false;
    const expected = createHmac("sha256", this.callbackSecret).update(rawBody).digest("hex");
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(signature, "hex");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  parseCallback(rawBody: string): CallbackPayload {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      parsed = { _raw: rawBody };
    }
    // Live Daraja uses Body.stkCallback.CallbackMetadata; mock accepts flat fields.
    if (this.mode === "mock") {
      const ref = typeof parsed.external_reference === "string" ? parsed.external_reference : "";
      const statusRaw = typeof parsed.status === "string" ? parsed.status.toUpperCase() : "FAILED";
      const status: CallbackPayload["status"] =
        statusRaw === "SUCCESS" || statusRaw === "FAILED" || statusRaw === "CANCELLED"
          ? statusRaw
          : "FAILED";
      return { externalReference: ref, status, raw: parsed };
    }
    const stk = (parsed.Body as Record<string, unknown> | undefined)?.stkCallback as
      | Record<string, unknown>
      | undefined;
    const checkoutId = (stk?.CheckoutRequestID as string | undefined) ?? "";
    const resultCode = Number(stk?.ResultCode ?? 1);
    const status: CallbackPayload["status"] =
      resultCode === 0 ? "SUCCESS" : resultCode === 1032 ? "CANCELLED" : "FAILED";
    return { externalReference: checkoutId, status, raw: parsed };
  }

  private async stkPushMock(req: StkPushRequest): Promise<StkPushResult> {
    const externalReference = `mock_${randomUUID()}`;
    return {
      externalReference,
      accepted: true,
      message: "Mock STK Push accepted. Provide live Daraja credentials to enable real charges.",
      raw: { transactionId: req.transactionId, externalReference, mock: true },
    };
  }

  private async stkPushLive(req: StkPushRequest): Promise<StkPushResult> {
    const base = this.environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
    const token = await this.fetchOAuthToken(base);
    if (!token) {
      return { externalReference: "", accepted: false, message: "OAuth failed.", raw: null };
    }
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString("base64");

    const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(req.amountCents / 100),
        PartyA: this.normalizePhone(req.phone),
        PartyB: this.shortcode,
        PhoneNumber: this.normalizePhone(req.phone),
        CallBackURL: req.callbackUrl,
        AccountReference: req.transactionId.slice(0, 12),
        TransactionDesc: req.description.slice(0, 200),
      }),
    });
    const json: Record<string, unknown> = await res.json().catch(() => ({}));
    const checkoutId = typeof json.CheckoutRequestID === "string" ? json.CheckoutRequestID : "";
    return {
      externalReference: checkoutId,
      accepted: res.ok && Boolean(checkoutId),
      message: typeof json.errorMessage === "string" ? json.errorMessage : undefined,
      raw: json,
    };
  }

  private async fetchOAuthToken(base: string): Promise<string | null> {
    if (!this.consumerKey || !this.consumerSecret) return null;
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64");
    const res = await fetch(
      `${base}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    if (!res.ok) return null;
    const json: Record<string, unknown> = await res.json().catch(() => ({}));
    return typeof json.access_token === "string" ? json.access_token : null;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
    if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
    return digits;
  }
}
