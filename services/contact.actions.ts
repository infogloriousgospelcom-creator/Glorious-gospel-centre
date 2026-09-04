"use server";

import "server-only";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { consume } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";

const SUBMIT_SCHEMA = z.object({
  full_name: z.string().trim().min(2, "Name is required.").max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(254, "Email is too long.")
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please share at least a sentence so we can help.")
    .max(4000, "Message is too long (max 4000 characters)."),
  // Honeypot
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

export async function submitContactMessage(
  _prev: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  const ipHash = getClientIpHash();
  const rate = consume(`contact:${ipHash ?? "anon"}`, { capacity: 5, windowMs: 10 * 60 * 1000 });
  if (!rate.ok) {
    const minutes = Math.ceil(rate.resetMs / 60000);
    return { ok: false, message: `Too many submissions. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const parsed = SUBMIT_SCHEMA.safeParse(Object.fromEntries(formData));
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
    return { ok: true, message: "Thank you. We will be in touch shortly." };
  }

  const d = parsed.data;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("contact_messages").insert({
      full_name: d.full_name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject || null,
      message: d.message,
      ip_hash: ipHash,
    });
    if (error) return { ok: false, message: "We couldn't send your message. Please try again." };
    return { ok: true, message: "Thank you. We will be in touch shortly." };
  } catch {
    return { ok: false, message: "We couldn't send your message. Please try again." };
  }
}
