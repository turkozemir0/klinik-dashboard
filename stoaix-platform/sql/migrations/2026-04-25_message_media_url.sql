-- Add media_url column to messages table for storing image/media URLs
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
