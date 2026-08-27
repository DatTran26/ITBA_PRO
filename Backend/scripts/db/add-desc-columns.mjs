import pg from 'pg';

import { requireEnv } from '../load-root-env.mjs';

const { DATABASE_URL: connectionString } = requireEnv('DATABASE_URL');

async function main() {
    const client = new pg.Client({ connectionString });

    try {
        await client.connect();
        await client.query(`
            ALTER TABLE tests
            ADD COLUMN IF NOT EXISTS job_description TEXT,
            ADD COLUMN IF NOT EXISTS test_description TEXT;
        `);
        console.log('Migration successful');

        const result = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'tests'",
        );
        console.log(result.rows.map((row) => row.column_name));
    } catch (error) {
        console.error('Error executing query', error.stack);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

main();
