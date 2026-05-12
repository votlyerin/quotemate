-- Migration 002: Add has_used_trial flag to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_used_trial boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.has_used_trial IS
  'Set to true the moment a Stripe trial subscription is created. Never resets — '
  'prevents users from cycling free trials indefinitely.';
