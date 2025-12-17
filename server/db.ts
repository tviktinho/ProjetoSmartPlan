import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Usar PostgreSQL local se DATABASE_URL não estiver definido
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/smart_plan";

// Log para debug - verificar se a variável está sendo lida
console.log("[DB] DATABASE_URL defined:", !!process.env.DATABASE_URL);
console.log("[DB] Using connection:", DATABASE_URL.includes("localhost") ? "localhost (DEFAULT - WRONG!)" : "Railway PostgreSQL (OK)");

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  // Configurações para melhorar resiliência
  connectionTimeoutMillis: 10000, // 10 segundos para timeout de conexão
  idleTimeoutMillis: 30000,
  max: 20,
});

export const db = drizzle(pool, { schema });

// Função para aguardar o banco de dados ficar disponível
export async function waitForDatabase(maxRetries = 10, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`[DB] Conexão estabelecida com sucesso na tentativa ${attempt}`);
      return true;
    } catch (error) {
      console.log(`[DB] Tentativa ${attempt}/${maxRetries} falhou. Aguardando ${delayMs}ms...`);
      if (attempt === maxRetries) {
        console.error('[DB] Não foi possível conectar ao banco de dados após todas as tentativas');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
}
