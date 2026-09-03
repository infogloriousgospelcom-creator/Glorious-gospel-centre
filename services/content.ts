import "server-only";
import { createClient } from "@/supabase/server";
import type {
  Announcement,
  EventItem,
  GalleryAlbum,
  GalleryItem,
  LeaderItem,
  MinistryItem,
  SermonItem,
  ServiceItem,
  SiteSettings,
  SocialLink,
} from "@/types/content";

const DEFAULT_SETTINGS: SiteSettings = {
  church_name: "Glorious Gospel Centre",
  tagline: "A community anchored in grace.",
  phone: null,
  email: null,
  address: null,
  office_hours: null,
  google_maps_url: null,
  whatsapp: null,
  mpesa_paybill: null,
  mpesa_till: null,
  bank_instructions: null,
  seo_default_title: null,
  seo_default_description: null,
  seo_default_og_image: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error || !data) return DEFAULT_SETTINGS;
    return {
      church_name: data.church_name ?? DEFAULT_SETTINGS.church_name,
      tagline: data.tagline ?? DEFAULT_SETTINGS.tagline,
      phone: data.phone,
      email: data.email,
      address: data.address,
      office_hours: data.office_hours,
      google_maps_url: data.google_maps_url,
      whatsapp: data.whatsapp,
      mpesa_paybill: data.mpesa_paybill,
      mpesa_till: data.mpesa_till,
      bank_instructions: data.bank_instructions,
      seo_default_title: data.seo_default_title,
      seo_default_description: data.seo_default_description,
      seo_default_og_image: data.seo_default_og_image,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getActiveSocialLinks(): Promise<SocialLink[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []) as SocialLink[];
  } catch {
    return [];
  }
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("id,title,body,starts_at,ends_at,is_pinned,published_at")
      .eq("status", "PUBLISHED")
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order("is_pinned", { ascending: false })
      .order("starts_at", { ascending: false })
      .limit(5);
    if (error) return [];
    return (data ?? []) as Announcement[];
  } catch {
    return [];
  }
}

export async function getUpcomingEvents(limit = 3): Promise<EventItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,slug,title,short_description,description,poster_url,starts_at,ends_at,location,speaker,registration_required,published_at",
      )
      .eq("status", "PUBLISHED")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as EventItem[];
  } catch {
    return [];
  }
}

export async function getLatestSermon(): Promise<SermonItem | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sermons")
      .select(
        "id,slug,title,description,speaker,preached_on,scripture,category,thumbnail_url,video_url,audio_url,livestream_url,duration_seconds,published_at",
      )
      .eq("status", "PUBLISHED")
      .order("preached_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as SermonItem | null;
  } catch {
    return null;
  }
}

export async function getFeaturedMinistries(limit = 6): Promise<MinistryItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministries")
      .select(
        "id,slug,name,short_description,description,hero_image,meeting_info,contact_email,contact_phone,sort_order,published_at",
      )
      .eq("status", "PUBLISHED")
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as MinistryItem[];
  } catch {
    return [];
  }
}

export async function getAllPublishedMinistries(): Promise<MinistryItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministries")
      .select(
        "id,slug,name,short_description,description,hero_image,meeting_info,contact_email,contact_phone,sort_order,published_at",
      )
      .eq("status", "PUBLISHED")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as MinistryItem[];
  } catch {
    return [];
  }
}

export async function getMinistryBySlug(slug: string): Promise<MinistryItem | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministries")
      .select(
        "id,slug,name,short_description,description,hero_image,meeting_info,contact_email,contact_phone,sort_order,published_at",
      )
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as MinistryItem | null;
  } catch {
    return null;
  }
}

export interface MinistryLeaderLink {
  role: string | null;
  sort_order: number;
  leader: LeaderItem;
}

export async function getMinistryLeaders(ministryId: string): Promise<MinistryLeaderLink[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministry_leaders")
      .select(
        "role,sort_order,leader:leaders(id,full_name,title,bio,image_url,email,phone,sort_order,is_featured)",
      )
      .eq("ministry_id", ministryId)
      .order("sort_order", { ascending: true });
    if (error) return [];
    type Row = { role: string | null; sort_order: number; leader: LeaderItem | LeaderItem[] | null };
    return (data ?? [])
      .map((row: Row) => {
        const leader = Array.isArray(row.leader) ? row.leader[0] : row.leader;
        if (!leader) return null;
        return { role: row.role, sort_order: row.sort_order, leader };
      })
      .filter((m): m is MinistryLeaderLink => m !== null);
  } catch {
    return [];
  }
}

export async function getPublishedServices(): Promise<ServiceItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("services")
      .select(
        "id,name,description,day_of_week,start_time,end_time,location,ministry_id,sort_order",
      )
      .eq("status", "PUBLISHED")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) return [];
    return (data ?? []) as ServiceItem[];
  } catch {
    return [];
  }
}

export async function getFeaturedLeaders(limit = 4): Promise<LeaderItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("leaders")
      .select(
        "id,full_name,title,bio,image_url,email,phone,sort_order,is_featured",
      )
      .eq("status", "PUBLISHED")
      .eq("is_featured", true)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as LeaderItem[];
  } catch {
    return [];
  }
}

export async function getPublishedGalleryAlbums(
  limit = 6,
): Promise<Array<GalleryAlbum & { item_count: number; cover_path: string | null }>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gallery_albums")
      .select(
        "id,slug,title,description,cover_image,category,event_date,sort_order,published_at",
      )
      .eq("status", "PUBLISHED")
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data ?? []).map((a) => ({
      ...(a as GalleryAlbum),
      item_count: 0,
      cover_path: null,
    }));
  } catch {
    return [];
  }
}

export async function getAlbumPreviewItems(
  albumId: string,
  limit = 4,
): Promise<GalleryItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,album_id,storage_path,caption,alt_text,sort_order")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as GalleryItem[];
  } catch {
    return [];
  }
}
