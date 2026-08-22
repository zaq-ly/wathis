import { createBrowserClient } from '@supabase/ssr';

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    key !== 'your-supabase-anon-key'
  );
};

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export const createClient = () => {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  browserClient = createBrowserClient(url, key);
  return browserClient;
};
