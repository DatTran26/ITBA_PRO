import { createClient } from '@supabase/supabase-js';

import { requireEnv } from '../load-root-env.mjs';

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = requireEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
);

const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
    } else {
        console.log('Columns:', Object.keys(data[0] || {}));
    }
}

check();
