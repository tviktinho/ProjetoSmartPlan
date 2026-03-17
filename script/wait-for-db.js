import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/smart_plan";

const pool = new Pool({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 5000,
});

async function main() {
    const maxRetries = 15;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[wait-for-db] attempt ${attempt}/${maxRetries}...`);
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('[wait-for-db] Database is ready!');
            process.exit(0);
        } catch (err) {
            console.log(`[wait-for-db] failed: ${err.message}`);
            if (attempt === maxRetries) {
                console.error('[wait-for-db] giving up.');
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
}

main();
