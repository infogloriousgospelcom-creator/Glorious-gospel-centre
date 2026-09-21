"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { createClient } from "@/supabase/server";
import { consumeAsync } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Password is required.").max(200),
  redirect_to: z.string().optional().or(z.literal("")),
});

export type AuthState = { ok: boolean; message: string; errors?: Record<string, string> };

function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

function safeAdminRedirect(redirect_to: string | undefined): string {
  if (
    redirect_to &&
    redirect_to.startsWith("/admin/") &&
    !redirect_to.includes("//") &&
    !redirect_to.includes("\\") &&
    !redirect_to.includes("@")
  ) {
    return redirect_to;
  }
  return "/admin/dashboard";
}

export async function signInAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString() ?? "form";
      if (!errors[k]) errors[k] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }
  const { email, password, redirect_to } = parsed.data;

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(`login:${ipHash}:${emailHash(email)}`, {
    capacity: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.ok) {
    return {
      ok: false,
      message: "Too many sign-in attempts. Please try again later.",
    };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        ok: false,
        message: error.message.toLowerCase().includes("invalid")
          ? "Invalid email or password."
          : "Sign-in failed. Please try again.",
      };
    }
    revalidatePath("/", "layout");
    redirect(safeAdminRedirect(redirect_to));
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { ok: false, message: "Sign-in failed. Please try again." };
  }
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  revalidatePath("/", "layout");
  redirect("/admin/login");
}

const ForgotSchema = z.object({ email: z.string().trim().email("Enter a valid email.").max(254) });

export async function requestPasswordResetAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = ForgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(`reset:${ipHash}:${emailHash(parsed.data.email)}`, {
    capacity: 3,
    windowMs: 60 * 60 * 1000,
  });
  // Always return the same success message (anti-enumeration), even when rate-limited.
  const antiEnumMessage =
    "If an account exists for that email, a reset link has been sent.";
  if (!rate.ok) {
    return { ok: true, message: antiEnumMessage };
  }

  try {
    const supabase = createClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${site}/admin/reset-password`,
    });
    return { ok: true, message: antiEnumMessage };
  } catch {
    return { ok: true, message: antiEnumMessage };
  }
}

const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters.").max(200),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export async function updatePasswordAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = UpdatePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString() ?? "form";
      if (!errors[k]) errors[k] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { ok: false, message: "We couldn't update your password. Please try again." };
    revalidatePath("/", "layout");
    redirect("/admin/account?password=updated");
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { ok: false, message: "We couldn't update your password. Please try again." };
  }
}
