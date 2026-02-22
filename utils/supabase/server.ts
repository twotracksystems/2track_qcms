import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function roleExtractor(supabase: SupabaseClient) {
  const { data: userRole } = await supabase.auth.getUser();
  return userRole.user?.user_metadata?.role;
}

/** Use in mutating API routes. Returns 403 if current user is Viewer. */
export async function requireNotViewer(supabase: SupabaseClient): Promise<
  | { allowed: true; role: string | undefined }
  | { allowed: false; role: string }
> {
  const role = await roleExtractor(supabase);
  if (role === "Viewer") {
    return { allowed: false, role: "Viewer" };
  }
  return { allowed: true, role };
}
