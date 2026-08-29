import pkg from 'pg';
const { Client } = pkg;

import { requireEnv } from '../load-root-env.mjs';

const { DATABASE_URL: connectionString } = requireEnv('DATABASE_URL');

const client = new Client({
    connectionString
});

async function run() {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

run().catch(console.error);
