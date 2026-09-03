"use server";

import "server-only";
import { z } from "zod";
import { consume } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";
import { initiateGiving } from "@/services/giving";

const SubmitSchema = z.object({
  category_id: z.string().uuid("Select a category."),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero.")
    .max(10_000_000, "Amount too large."),
  currency: z.string().trim().min(3).max(8).default("KES"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Phone is too long."),
  description: z.string().trim().max(120).optional().or(z.literal("")),
  // Honeypot
  website: z.string().max(0).optional().or(z.literal("")),
});

export type GivingState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  transactionId?: string;
  externalReference?: string;
  mode?: "live" | "mock";
};

export async function submitGiving(
  _prev: GivingState | null,
  formData: FormData,
): Promise<GivingState> {
  const ipHash = getClientIpHash();
  const rate = consume(`giving:${ipHash ?? "anon"}`, { capacity: 5, windowMs: 10 * 60 * 1000 });
  if (!rate.ok) {
    const minutes = Math.ceil(rate.resetMs / 60000);
    return { ok: false, message: `Too many requests. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const parsed = SubmitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString() ?? "form";
      if (!errors[k]) errors[k] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }
  if (parsed.data.website) {
    // Honeypot
    return { ok: true, message: "Your giving has been received." };
  }

  const amountCents = Math.round(parsed.data.amount * 100);
  const result = await initiateGiving({
    categoryId: parsed.data.category_id,
    amountCents,
    currency: parsed.data.currency,
    phone: parsed.data.phone,
    description: parsed.data.description || "GGC Giving",
  });

  return {
    ok: result.ok,
    message: result.message,
    transactionId: result.transactionId,
    externalReference: result.externalReference,
    mode: result.mode,
  };
}
