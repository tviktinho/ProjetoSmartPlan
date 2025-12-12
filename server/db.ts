import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Usar PostgreSQL local se DATABASE_URL não estiver definido
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/smart_plan";

// Log para debug - verificar se a variável está sendo lida
console.log("[DB] DATABASE_URL defined:", !!process.env.DATABASE_URL);
console.log("[DB] Using connection:", DATABASE_URL.includes("localhost") ? "localhost (DEFAULT - WRONG!)" : "Railway PostgreSQL (OK)");

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });
