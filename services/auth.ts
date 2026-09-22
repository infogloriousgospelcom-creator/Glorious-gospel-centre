import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export interface UserSession {
  userId: string;
  email: string;
  emailConfirmed: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
}

export interface AdminSession extends UserSession {
  roleKeys: string[];
  permissionKeys: string[];
}

/**
 * Any authenticated Supabase user (not necessarily an admin).
 * Used for member account pages and session checks such as online giving.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const supabase = createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return null;

    const userId = userData.user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,avatar_url,phone")
      .eq("id", userId)
      .maybeSingle();

    return {
      userId,
      email: userData.user.email ?? "",
      emailConfirmed: Boolean(userData.user.email_confirmed_at),
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      phone: profile?.phone ?? null,
    };
  } catch {
    return null;
  }
}

/** Require any authenticated user; default redirect to member login. */
export async function requireUser(redirectTo = "/login"): Promise<UserSession> {
  const session = await getCurrentUser();
  if (!session) redirect(redirectTo);
  return session;
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  try {
    const supabase = createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return null;

    const userId = userData.user.id;

    const [{ data: profile }, { data: roles }, { data: perms }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name,avatar_url,phone")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("admins")
        .select("role:roles(key)")
        .eq("profile_id", userId)
        .eq("is_active", true),
      supabase.rpc("permissions_for_user", { p_user_id: userId }),
    ]);

    const roleKeys = (roles ?? [])
      .map((r) => {
        const role = Array.isArray(r.role) ? r.role[0] : r.role;
        return (role as { key?: string } | null)?.key;
      })
      .filter((k): k is string => Boolean(k));

    const permissionKeys = (perms ?? []).map((p: { key: string }) => p.key);

    if (roleKeys.length === 0) return null;

    return {
      userId,
      email: userData.user.email ?? "",
      emailConfirmed: Boolean(userData.user.email_confirmed_at),
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      phone: profile?.phone ?? null,
      roleKeys,
      permissionKeys,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requirePermission(permissionKey: string): Promise<AdminSession> {
  const session = await requireAdmin();
  if (!session.permissionKeys.includes(permissionKey)) {
    redirect("/admin/dashboard?error=forbidden");
  }
  return session;
}
