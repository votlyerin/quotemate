-- Migration: 003_email_tracking
-- Adds boolean flags to profiles so each automated email fires exactly once per user.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sent_welcome_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_day3_email    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_day5_email    boolean NOT NULL DEFAULT false;
