import { PGlite } from "@electric-sql/pglite";

let db = null;

const DB_URL = "idb://patient-db";

// Creating patients table column
const CREATE_PATIENTS_TABLE = `
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
`;

// initializing Database
export const initDB = async () => {
  if (db) return db;

  db = new PGlite(DB_URL, {
    relaxedDurability: true 
  });

  await db.waitReady;

  // Initialize schema
  await db.exec(CREATE_PATIENTS_TABLE);

  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_timestamp
    AFTER UPDATE ON patients
    FOR EACH ROW
    BEGIN
      UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `).catch(() => {
    console.warn("Trigger setup skipped or failed");
  });

  return db;
};


//Get Database
export const getDB = () => {
  if (!db) throw new Error("Database not initialized. Call initDB() first.");
  return db;
};

// A wrapper to handle transactions safely 
// We could use it without transaction but it's safe that's why
export const transaction = async (callback) => {
  const db = getDB();
  await db.exec("BEGIN");
  try {
    const result = await callback(db);
    await db.exec("COMMIT");
    return result;
  } catch (err) {
    await db.exec("ROLLBACK");
    console.error("Transaction failed and rolled back:", err.message);
    throw err;
  }
};
