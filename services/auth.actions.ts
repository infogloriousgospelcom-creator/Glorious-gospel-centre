"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { createClient } from "@/supabase/server";
import { consumeAsync } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";
import { getCurrentAdmin, getCurrentUser } from "@/services/auth";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ProfileUpdateSchema,
  RegisterSchema,
  UpdatePasswordSchema,
} from "@/lib/auth-schemas";
import {
  resolveMemberNext,
  safeAdminRedirect,
  safeLegacyMemberRedirect,
  safeMemberRedirect,
} from "@/lib/auth-redirects";
import { publicEnv } from "@/lib/env";

export type AuthState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Set after signup when email confirmation is required. */
  needsEmailConfirmation?: boolean;
};

function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

function siteOrigin(): string {
  return publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

function zodFieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = issue.path[0]?.toString() ?? "form";
    if (!errors[k]) errors[k] = issue.message;
  }
  return errors;
}

function isNextRedirect(err: unknown): boolean {
  return err instanceof Error && err.message === "NEXT_REDIRECT";
}

/**
 * Admin login form (`/admin/login`).
 * Admins → /admin/*; non-admins → allowlisted /give or home (unchanged).
 */
export async function signInAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: zodFieldErrors(parsed.error),
    };
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

    const admin = await getCurrentAdmin();
    if (admin) {
      redirect(safeAdminRedirect(redirect_to) ?? "/admin/dashboard");
    }

    redirect(safeLegacyMemberRedirect(redirect_to) ?? "/");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, message: "Sign-in failed. Please try again." };
  }
}

/**
 * Member login (`/login`).
 * Admins still go to the admin dashboard; congregants go to /account (or safe next).
 */
export async function memberSignInAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: zodFieldErrors(parsed.error),
    };
  }
  const { email, password, redirect_to } = parsed.data;

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(`member-login:${ipHash}:${emailHash(email)}`, {
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
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        return {
          ok: false,
          message: "Please confirm your email before signing in. Check your inbox for a link.",
        };
      }
      return {
        ok: false,
        message: msg.includes("invalid")
          ? "Invalid email or password."
          : "Sign-in failed. Please try again.",
      };
    }

    revalidatePath("/", "layout");

    const admin = await getCurrentAdmin();
    if (admin) {
      redirect(safeAdminRedirect(redirect_to) ?? "/admin/dashboard");
    }

    redirect(safeMemberRedirect(redirect_to) ?? "/account");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, message: "Sign-in failed. Please try again." };
  }
}

/** Admin sign-out — returns to admin login. */
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

/** Member sign-out — returns to the public homepage. */
export async function memberSignOutAction(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  revalidatePath("/", "layout");
  redirect("/");
}

/** Congregant registration via Supabase Auth (no service role, no admins row). */
export async function memberSignUpAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: zodFieldErrors(parsed.error),
    };
  }

  const { email, password, full_name } = parsed.data;
  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(`register:${ipHash}:${emailHash(email)}`, {
    capacity: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.ok) {
    return {
      ok: false,
      message: "Too many registration attempts. Please try again later.",
    };
  }

  const genericSuccess =
    "If this email can be registered, you will receive a confirmation message shortly. Check your inbox to continue.";

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent("/account")}`,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return { ok: true, message: genericSuccess, needsEmailConfirmation: true };
      }
      if (msg.includes("signups not allowed") || msg.includes("signup is disabled")) {
        return {
          ok: false,
          message:
            "Account registration is not available yet. Please try again later or contact the church office.",
        };
      }
      return {
        ok: false,
        message: "We couldn't create your account. Please try again.",
      };
    }

    // Identities empty often means "user already exists" when confirmations are on.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { ok: true, message: genericSuccess, needsEmailConfirmation: true };
    }

    const sessionCreated = Boolean(data.session);
    if (sessionCreated) {
      revalidatePath("/", "layout");
      redirect("/account");
    }

    return {
      ok: true,
      message:
        "Check your email to confirm your account. After you confirm, you can sign in.",
      needsEmailConfirmation: true,
    };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, message: "We couldn't create your account. Please try again." };
  }
}

/** Admin password-reset request → /admin/reset-password. */
export async function requestPasswordResetAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = ForgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(`reset:${ipHash}:${emailHash(parsed.data.email)}`, {
    capacity: 3,
    windowMs: 60 * 60 * 1000,
  });
  const antiEnumMessage =
    "If an account exists for that email, a reset link has been sent.";
  if (!rate.ok) {
    return { ok: true, message: antiEnumMessage };
  }

  try {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteOrigin()}/admin/reset-password`,
    });
    return { ok: true, message: antiEnumMessage };
  } catch {
    return { ok: true, message: antiEnumMessage };
  }
}

/** Member password-reset request → callback then /reset-password. */
export async function memberRequestPasswordResetAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = ForgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const ipHash = getClientIpHash() ?? "anon";
  const rate = await consumeAsync(`member-reset:${ipHash}:${emailHash(parsed.data.email)}`, {
    capacity: 3,
    windowMs: 60 * 60 * 1000,
  });
  const antiEnumMessage =
    "If an account exists for that email, a reset link has been sent.";
  if (!rate.ok) {
    return { ok: true, message: antiEnumMessage };
  }

  try {
    const supabase = createClient();
    const next = encodeURIComponent("/reset-password");
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteOrigin()}/auth/callback?next=${next}`,
    });
    return { ok: true, message: antiEnumMessage };
  } catch {
    return { ok: true, message: antiEnumMessage };
  }
}

/**
 * Update password for the current recovery/authenticated session.
 * `audience=member` → /account; default/admin → /admin/account.
 * Session-bound only — never service-role; never accepts a target user id.
 */
export async function updatePasswordAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const parsed = UpdatePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: zodFieldErrors(parsed.error),
    };
  }

  const audience = parsed.data.audience === "member" ? "member" : "admin";

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return {
        ok: false,
        message:
          audience === "member"
            ? "Please sign in to update your password."
            : "Please sign in to update your password.",
      };
    }

    const ipHash = getClientIpHash() ?? "anon";
    const rate = await consumeAsync(`password-update:${ipHash}:${user.id}`, {
      capacity: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.ok) {
      return { ok: false, message: "Too many password attempts. Please try again later." };
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return { ok: false, message: "We couldn't update your password. Please try again." };
    }
    revalidatePath("/", "layout");
    if (audience === "member") {
      redirect("/account?password=updated");
    }
    redirect("/admin/account?password=updated");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { ok: false, message: "We couldn't update your password. Please try again." };
  }
}

/**
 * Resend signup confirmation for the currently authenticated user only.
 * Never accepts a client-supplied email address.
 */
export async function resendMemberEmailVerificationAction(
  _prev: AuthState | null,
  _formData: FormData,
): Promise<AuthState> {
  const genericOk =
    "If your email still needs confirmation, a verification message has been sent. Check your inbox.";

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return { ok: false, message: "Please sign in to resend a verification email." };
    }

    if (user.email_confirmed_at) {
      return { ok: true, message: "Your email is already verified." };
    }

    const email = user.email?.trim();
    if (!email) {
      return { ok: false, message: "We couldn't send a verification email. Please try again." };
    }

    const ipHash = getClientIpHash() ?? "anon";
    const rate = await consumeAsync(`verify-resend:${ipHash}:${user.id}`, {
      capacity: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.ok) {
      return { ok: true, message: genericOk };
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent("/account")}`,
      },
    });

    if (error) {
      return { ok: true, message: genericOk };
    }

    return { ok: true, message: genericOk };
  } catch {
    return { ok: false, message: "We couldn't send a verification email. Please try again." };
  }
}

/** Self-service profile update (full_name, phone) — RLS enforces own row only. */
export async function updateMemberProfileAction(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to update your profile." };
  }

  const parsed = ProfileUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = createClient();
    const phone = parsed.data.phone?.trim() ? parsed.data.phone.trim() : null;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        phone,
      })
      .eq("id", user.userId);

    if (error) {
      return { ok: false, message: "We couldn't save your profile. Please try again." };
    }

    revalidatePath("/account");
    revalidatePath("/", "layout");
    return { ok: true, message: "Your profile has been updated." };
  } catch {
    return { ok: false, message: "We couldn't save your profile. Please try again." };
  }
}

/** Exported for tests / callback helpers — re-export resolve. */
export { resolveMemberNext };
