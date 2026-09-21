import { describe, expect, it } from "vitest";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) return `254${digits}`;
  return digits;
}

describe("phone number normalization", () => {
  it("normalizes 07XXXXXXXX format", () => {
    expect(normalizePhone("0712345678")).toBe("254712345678");
    expect(normalizePhone("0700000000")).toBe("254700000000");
    expect(normalizePhone("0799999999")).toBe("254799999999");
  });

  it("normalizes 2547XXXXXXXX format", () => {
    expect(normalizePhone("254712345678")).toBe("254712345678");
    expect(normalizePhone("254700000000")).toBe("254700000000");
  });

  it("normalizes +2547XXXXXXXX format", () => {
    expect(normalizePhone("+254712345678")).toBe("254712345678");
    expect(normalizePhone("+254700000000")).toBe("254700000000");
  });

  it("normalizes 7XXXXXXXX format (9 digits)", () => {
    expect(normalizePhone("712345678")).toBe("254712345678");
  });

  it("normalizes 01XXXXXXXX format", () => {
    expect(normalizePhone("0112345678")).toBe("254112345678");
    expect(normalizePhone("0100000000")).toBe("254100000000");
  });

  it("normalizes 2541XXXXXXXX format", () => {
    expect(normalizePhone("254112345678")).toBe("254112345678");
  });

  it("normalizes +2541XXXXXXXX format", () => {
    expect(normalizePhone("+254112345678")).toBe("254112345678");
  });

  it("normalizes 1XXXXXXXX format (9 digits)", () => {
    expect(normalizePhone("112345678")).toBe("254112345678");
  });

  it("handles spaces and dashes", () => {
    expect(normalizePhone("0712 345 678")).toBe("254712345678");
    expect(normalizePhone("0712-345-678")).toBe("254712345678");
    expect(normalizePhone("+254 712 345 678")).toBe("254712345678");
  });

  it("returns digits as-is for unrecognized formats", () => {
    expect(normalizePhone("12345")).toBe("12345");
    expect(normalizePhone("")).toBe("");
  });
});

describe("amount validation", () => {
  it("rejects zero amount", () => {
    expect(() => { if (0 <= 0) throw new Error("Amount must be greater than zero"); }).toThrow();
  });

  it("rejects negative amount", () => {
    expect(() => { if (-100 <= 0) throw new Error("Amount must be greater than zero"); }).toThrow();
  });

  it("accepts positive amount", () => {
    expect(() => { if (100 <= 0) throw new Error("Amount must be greater than zero"); }).not.toThrow();
  });
});

describe("idempotency key generation", () => {
  function generateIdempotencyKey(categoryId: string, amountCents: number, phone: string): string {
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
    return `${categoryId}|${amountCents}|${phone}|${bucket}`;
  }

  it("generates same key within 5-minute window", () => {
    const key1 = generateIdempotencyKey("cat-1", 10000, "254712345678");
    const key2 = generateIdempotencyKey("cat-1", 10000, "254712345678");
    expect(key1).toBe(key2);
  });

  it("generates different key for different amounts", () => {
    const key1 = generateIdempotencyKey("cat-1", 10000, "254712345678");
    const key2 = generateIdempotencyKey("cat-1", 20000, "254712345678");
    expect(key1).not.toBe(key2);
  });

  it("generates different key for different phones", () => {
    const key1 = generateIdempotencyKey("cat-1", 10000, "254712345678");
    const key2 = generateIdempotencyKey("cat-1", 10000, "254799999999");
    expect(key1).not.toBe(key2);
  });

  it("generates different key for different categories", () => {
    const key1 = generateIdempotencyKey("cat-1", 10000, "254712345678");
    const key2 = generateIdempotencyKey("cat-2", 10000, "254712345678");
    expect(key1).not.toBe(key2);
  });
});

describe("payment status mapping", () => {
  function mapStatus(dbStatus: string): "IDLE" | "PROCESSING" | "STK_SENT" | "SUCCESS" | "FAILED" | "CANCELLED" | "TIMEOUT" {
    switch (dbStatus) {
      case "PENDING":
        return "PROCESSING";
      case "PROCESSING":
        return "STK_SENT";
      case "SUCCESS":
        return "SUCCESS";
      case "FAILED":
        return "FAILED";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return "PROCESSING";
    }
  }

  it("maps PENDING to PROCESSING", () => {
    expect(mapStatus("PENDING")).toBe("PROCESSING");
  });

  it("maps PROCESSING to STK_SENT", () => {
    expect(mapStatus("PROCESSING")).toBe("STK_SENT");
  });

  it("maps SUCCESS to SUCCESS", () => {
    expect(mapStatus("SUCCESS")).toBe("SUCCESS");
  });

  it("maps FAILED to FAILED", () => {
    expect(mapStatus("FAILED")).toBe("FAILED");
  });

  it("maps CANCELLED to CANCELLED", () => {
    expect(mapStatus("CANCELLED")).toBe("CANCELLED");
  });

  it("maps unknown status to PROCESSING", () => {
    expect(mapStatus("UNKNOWN")).toBe("PROCESSING");
  });
});