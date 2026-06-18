import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Service-role client — server-only. Bypasses RLS; never import in client code.
export const supabaseAdmin: SupabaseClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Stateless client used purely to validate a bearer token.
const verifier: SupabaseClient = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Resolve the authenticated user from a request's `Authorization: Bearer`
 * header. Returns null when missing/invalid. Use to gate API routes.
 */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;
  if (!token) return null;

  const { data, error } = await verifier.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
