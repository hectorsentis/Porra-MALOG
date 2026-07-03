import { createClient } from "@supabase/supabase-js";

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function supabaseServiceRole() {
  return process.env.SUPABASE_SERVICE_ROLE ?? process.env.NEXT_SUPABASE_SECRET_KEY ?? "";
}

export function hasSupabaseAdminConfig() {
  return Boolean(supabaseUrl() && supabaseServiceRole());
}

export function supabaseAdmin() {
  if (!hasSupabaseAdminConfig()) throw new Error("Supabase server config is missing");
  return createClient(supabaseUrl(), supabaseServiceRole(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
