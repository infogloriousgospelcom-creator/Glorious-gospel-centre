export type ContentStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export interface SiteSettings {
  church_name: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  google_maps_url: string | null;
  whatsapp: string | null;
  mpesa_paybill: string | null;
  mpesa_till: string | null;
  bank_instructions: string | null;
  seo_default_title: string | null;
  seo_default_description: string | null;
  seo_default_og_image: string | null;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
  is_pinned: boolean;
  published_at: string | null;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  poster_url: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  speaker: string | null;
  registration_required: boolean;
  published_at: string | null;
}

export interface SermonItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  speaker: string | null;
  preached_on: string;
  scripture: string | null;
  category: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  livestream_url: string | null;
  duration_seconds: number | null;
  series_id: string | null;
  published_at: string | null;
}

export interface SermonSeries {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  hero_image: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  published_at: string | null;
}

export interface MinistryItem {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  hero_image: string | null;
  meeting_info: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  sort_order: number;
  published_at: string | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  location: string | null;
  ministry_id: string | null;
  sort_order: number;
  is_recurring: boolean;
}

export interface LeaderItem {
  id: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  phone: string | null;
  sort_order: number;
  is_featured: boolean;
}

export interface PageItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  hero_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  published_at: string | null;
}

export interface GalleryAlbum {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  category: string | null;
  event_date: string | null;
  sort_order: number;
  published_at: string | null;
}

export interface GalleryItem {
  id: string;
  album_id: string;
  storage_path: string;
  caption: string | null;
  alt_text: string | null;
  sort_order: number;
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function dayName(dayOfWeek: number): string {
  return DAYS_OF_WEEK[dayOfWeek] ?? "";
}
