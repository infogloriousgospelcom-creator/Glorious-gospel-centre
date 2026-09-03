-- 0010 — Storage buckets
-- Buckets are created via the Supabase storage API; this migration is a placeholder
-- for documentation. Actual bucket creation happens via the management API or the
-- dashboard. Storage object policies are managed in 0011.

-- Buckets to create:
--   church-images      public read (published assets)
--   event-posters      public read (published events)
--   leader-images      public read (published leaders)
--   sermon-thumbnails  public read (published sermons)
--   gallery-images     public read (published albums)
--   media              admin-only read

do $$ begin
  -- placeholder; intentional no-op
  perform 1;
end $$;
