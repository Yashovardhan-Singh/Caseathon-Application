import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SBASE_URL!,
    process.env.NEXT_PUBLIC_SBASE_ANON_KEY!
);