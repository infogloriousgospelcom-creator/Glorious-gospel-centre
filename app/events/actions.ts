"use server";

import { z } from "zod";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

const RegistrationSchema = z.object({
  event_id: z.string().uuid("Invalid event id."),
  full_name: z.string().trim().min(2, "Name is too short.").max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .max(254, "Email is too long.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(5, "Phone is too short.")
    .max(40, "Phone is too long.")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000, "Notes are too long.").optional().or(z.literal("")),
});

export type RegistrationState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

export async function registerForEvent(
  _prev: RegistrationState | null,
  formData: FormData,
): Promise<RegistrationState> {
  const parsed = RegistrationSchema.safeParse({
    event_id: formData.get("event_id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      errors[key] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("event_registrations").insert({
      event_id: parsed.data.event_id,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
    });
    if (error) return { ok: false, message: "We couldn't save your registration. Please try again." };
    revalidatePath(`/events`);
    return { ok: true, message: "Thank you. Your registration has been received." };
  } catch {
    return { ok: false, message: "We couldn't save your registration. Please try again." };
  }
}
