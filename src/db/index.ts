import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { eq } from 'drizzle-orm';

// Function to create a new connection pool.
export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

/**
 * Retrieves a user by their UID (e.g. Firebase Auth UID or "demo-user" placeholder),
 * creating them dynamically if they do not yet exist, to guarantee reliable, zero-crash operations.
 */
export async function getOrCreateUser(uid: string, email: string = "demo-user@example.com", name: string = "Sarah Jenkins") {
  try {
    // 1. Try to find the user first
    const existing = await db.select().from(schema.users).where(eq(schema.users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    // 2. Wrap insertion to handle concurrent insert conditions safely
    const inserted = await db.insert(schema.users)
      .values({
        uid,
        email,
        name,
      })
      .onConflictDoUpdate({
        target: schema.users.uid,
        set: { email, name }
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error(`Failed to get/create user with uid: ${uid}:`, error);
    // Standard failover select query
    const fallback = await db.select().from(schema.users).where(eq(schema.users.uid, uid)).limit(1);
    if (fallback.length > 0) {
      return fallback[0];
    }
    throw new Error("User database profile resolution failed.", { cause: error });
  }
}
