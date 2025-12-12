import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Usar PostgreSQL local se DATABASE_URL não estiver definido
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/smart_plan";

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });
