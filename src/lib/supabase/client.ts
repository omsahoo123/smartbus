"use client";

import { createBrowserClient } from "@supabase/ssr";

// Not generic over the Database type on purpose: the hand-written types in
// src/types/database.ts are plain interfaces for use in component props,
// not a Supabase-shaped schema definition. Once you run
// `supabase gen types typescript --linked`, swap that output in here as
// createBrowserClient<GeneratedDatabase>(...) for full query type-safety.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
