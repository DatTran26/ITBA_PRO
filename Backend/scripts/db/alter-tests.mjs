import pg from 'pg';

import { requireEnv } from '../load-root-env.mjs';

const { DATABASE_URL: connectionString } = requireEnv('DATABASE_URL');

async function main() {
    const client = new pg.Client({ connectionString });

    try {
        await client.connect();
        await client.query(`
            ALTER TABLE tests
            ADD COLUMN IF NOT EXISTS question_count INT DEFAULT 10,
            ADD COLUMN IF NOT EXISTS max_participants INT DEFAULT null,
            ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT null;
        `);
        console.log('Migration successful');
    } catch (error) {
        console.error('Error executing query', error.stack);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

main();
