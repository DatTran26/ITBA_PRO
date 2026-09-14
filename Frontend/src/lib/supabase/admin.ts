import { createClient } from '@supabase/supabase-js';

export const createAdminClient = () => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        key!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};
