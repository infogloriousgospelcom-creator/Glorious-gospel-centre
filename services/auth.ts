import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export interface AdminSession {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  roleKeys: string[];
  permissionKeys: string[];
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
        .select("full_name,avatar_url")
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
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
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
