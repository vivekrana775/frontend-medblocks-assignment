import { PGlite } from "@electric-sql/pglite";

// Singleton database instance
let db;

export const initDB = async () => {
  if (db) return db;
  
  // Initialize with proper IndexedDB connection
  db = new PGlite("idb://patient-db", {
    relaxedDurability: true // Better performance for this use case
  });

  // Wait for connection to be ready
  await db.waitReady;
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth DATE NOT NULL,
      gender TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
};

export const getDB = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};

// Add this for clean transactions
export const transaction = async (callback) => {
  const db = getDB();
  await db.exec("BEGIN");
  try {
    const result = await callback(db);
    await db.exec("COMMIT");
    return result;
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
};