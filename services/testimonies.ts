"use server";

import "server-only";
import { createClient } from "@/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import { consumeAsync } from "@/lib/rate-limit";
import { getClientIpHash } from "@/lib/ip-hash";
import { toPlainText, publicDisplayName } from "@/lib/testimonies";
import { TESTIMONY_SUBMIT_SCHEMA } from "@/lib/testimony-schema";
import type { TestimonyPublic } from "@/types/content";

export type TestimonySubmitState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

const PUBLIC_SELECT =
  "id,slug,title,story,display_name,anonymous,published_at,created_at";

function mapPublic(row: {
  id: string;
  slug: string | null;
  title: string;
  story: string;
  display_name: string | null;
  anonymous: boolean;
  published_at: string | null;
  created_at: string;
}): TestimonyPublic | null {
  if (!row.slug || !row.published_at) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    story: row.story,
    display_name: publicDisplayName(row),
    anonymous: row.anonymous,
    published_at: row.published_at,
    created_at: row.created_at,
  };
}

export async function submitTestimony(
  _prev: TestimonySubmitState | null,
  formData: FormData,
): Promise<TestimonySubmitState> {
  const ipHash = getClientIpHash();
  const rate = await consumeAsync(`testimony:${ipHash ?? "anon"}`, {
    capacity: 3,
    windowMs: 30 * 60 * 1000,
  });
  if (!rate.ok) {
    const minutes = Math.ceil(rate.resetMs / 60000);
    return {
      ok: false,
      message: `Too many submissions. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const parsed = TESTIMONY_SUBMIT_SCHEMA.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString() ?? "form";
      if (!errors[k]) errors[k] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", errors };
  }

  const d = parsed.data;
  if (d.website) {
    return {
      ok: true,
      message: "Thank you. Your story has been received for review.",
    };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: false, message: "We couldn't save your story. Please try again." };
  }

  const anonymous = d.anonymous === "on";
  const title = toPlainText(d.title);
  const story = toPlainText(d.story);
  const displayName = anonymous ? null : toPlainText(d.display_name ?? "") || null;

  if (title.length < 3 || story.length < 40) {
    return { ok: false, message: "Please correct the highlighted fields." };
  }

  try {
    const supabase = createServiceRoleClient();
    const consentAt = new Date().toISOString();
    const { error } = await supabase.from("testimonies").insert({
      title,
      story,
      display_name: displayName,
      anonymous,
      submitter_email: d.email || null,
      submitter_phone: d.phone || null,
      consent_to_publish: true,
      consent_at: consentAt,
      status: "PENDING",
      ip_hash: ipHash,
    });
    if (error) {
      return { ok: false, message: "We couldn't save your story. Please try again." };
    }
    return {
      ok: true,
      message:
        "Thank you. Your story has been received. Our team will review it before anything is published.",
    };
  } catch {
    return { ok: false, message: "We couldn't save your story. Please try again." };
  }
}

export async function getApprovedTestimonies(limit = 50): Promise<TestimonyPublic[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("testimonies")
      .select(PUBLIC_SELECT)
      .eq("status", "APPROVED")
      .not("slug", "is", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? [])
      .map((row) => mapPublic(row as Parameters<typeof mapPublic>[0]))
      .filter((t): t is TestimonyPublic => t !== null);
  } catch {
    return [];
  }
}

export async function getApprovedTestimonyBySlug(
  slug: string,
): Promise<TestimonyPublic | null> {
  if (!slug || slug.length > 120) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("testimonies")
      .select(PUBLIC_SELECT)
      .eq("status", "APPROVED")
      .eq("slug", slug)
      .not("published_at", "is", null)
      .maybeSingle();
    if (error || !data) return null;
    return mapPublic(data as Parameters<typeof mapPublic>[0]);
  } catch {
    return null;
  }
}

export async function countApprovedTestimonies(): Promise<number> {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("testimonies")
      .select("id", { count: "exact", head: true })
      .eq("status", "APPROVED")
      .not("published_at", "is", null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
