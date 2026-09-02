import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const rootEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));

dotenv.config({ path: rootEnvPath });

export function requireEnv(...names) {
    const missing = names.filter((name) => !process.env[name]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}
