import sqlite3 from "sqlite3";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// 1. Connect to local SQLite
const localDb = new sqlite3.Database("./database.sqlite");

// 2. Connect to Turso
const tursoDb = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Helper: get all rows from local sqlite
function getAllRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    localDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper: insert row into Turso
async function insertRow(table, row) {
  const keys = Object.keys(row);
  const values = Object.values(row);

  const placeholders = keys.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${keys.join(
    ", "
  )}) VALUES (${placeholders})`;

  try {
    await tursoDb.execute({ sql, args: values });
  } catch (err) {
    console.error(`❌ Error inserting into ${table}:`, err.message);
  }
}

async function migrateTable(table) {
  console.log(`\n🔄 Migrating table: ${table}`);

  const rows = await getAllRows(`SELECT * FROM ${table}`);
  console.log(`Found ${rows.length} rows in local ${table}`);

  for (const row of rows) {
    await insertRow(table, row);
  }

  console.log(
    `✅ Migrated ${rows.length} rows into Turso.${
      rows.length === 0 ? " (Nothing to migrate)" : ""
    }`
  );
}

async function runMigration() {
  try {
    const tables = [
      "users",
      "otps",
      "pdfs",
      "discussions",
      "discussion_answers",
      "discussion_replies",
      "discussion_votes",
      "answer_votes",
      "reply_votes",
      "ebooks",
      "notifications",
    ];

    for (const table of tables) {
      await migrateTable(table);
    }

    console.log("\n🎉 Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
