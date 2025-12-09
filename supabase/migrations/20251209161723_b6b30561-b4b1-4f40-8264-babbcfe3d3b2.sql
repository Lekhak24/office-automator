-- Add Google OAuth token columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS google_access_token text,
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_token_expires_at timestamp with time zone;