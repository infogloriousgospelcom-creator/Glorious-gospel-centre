-- 0024 — Create leader-images storage bucket
-- Migration 0010 was a placeholder that documented intended buckets but never
-- created them. This migration creates the leader-images bucket so that the
-- admin Leadership image upload can function.

-- Create the bucket (public read, 5 MB file size limit, image types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('leader-images', 'leader-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
