import { PGlite } from "@electric-sql/pglite";
import { v4 as uuidv4 } from "uuid";

let dbInstance = null;
let dbInitialized = false;

export const initDB = async () => {
  if (dbInitialized) return dbInstance;

  const dbName = `patient-db-${window.location.origin}`;
  
  dbInstance = new PGlite(`idb://${dbName}`, {
    relaxedDurability: true,
  });

  await dbInstance.query(`
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

  dbInitialized = true;
  return dbInstance;
};

export const getDB = () => {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return dbInstance;
};
