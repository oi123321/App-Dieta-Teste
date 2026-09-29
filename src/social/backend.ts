import { createCloudBackend } from './cloud/backend';
import { demoBackend } from './demo/backend';
import type { SocialBackend } from './types';

// Set these in .env (see .env.example) to connect the community to Supabase.
// Without them the app runs in demo mode: everything stays on the device.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const social: SocialBackend =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createCloudBackend(SUPABASE_URL, SUPABASE_ANON_KEY) : demoBackend;

export const isDemo = social.mode === 'demo';
