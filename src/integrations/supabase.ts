import { createClient } from "@supabase/supabase-js";
import type { SupabaseProviderSettingsClient } from "./supabase-provider-settings";

export function getSupabaseServiceClient(
  env: Record<string, string | undefined> = process.env
) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) as unknown as SupabaseProviderSettingsClient & {
    auth: {
      getUser(token: string): Promise<{
        data: {
          user: {
            id: string;
          } | null;
        };
        error: Error | null;
      }>;
    };
  };
}
