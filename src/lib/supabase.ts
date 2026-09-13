import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client com service role — usar SOMENTE em rotas de servidor (API routes),
// nunca expor ao client.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export const BUCKET_AVATARS = "avatars";
export const BUCKET_BOLETINS = "boletins";
