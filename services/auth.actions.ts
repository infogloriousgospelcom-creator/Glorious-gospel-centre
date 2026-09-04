"use server";

import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Password is required.").max(200),
  redirect_to: z.string().optional().or(z.literal("")),
});

export type AuthState = { ok: boolean; message: string; errors?: Record<string, string> };

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
    const safeRedirect = redirect_to && redirect_to.startsWith("/admin") ? redirect_to : "/admin/dashboard";
    redirect(safeRedirect);
  } catch (err) {
    // Next.js redirect throws — let it bubble.
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
  try {
    const supabase = createClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${site}/admin/reset-password`,
    });
    // Always return success to avoid email enumeration.
    return {
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    };
  } catch {
    return { ok: true, message: "If an account exists for that email, a reset link has been sent." };
  }
}

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
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
