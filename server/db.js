import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "database.sqlite");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_verified INTEGER DEFAULT 0,
          verification_token TEXT,
          reset_token TEXT,
          reset_token_expires DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating users table:", err.message);
            reject(err);
            return;
          }
          console.log("Users table ready");
        }
      );

      // Create OTP table for verification codes
      db.run(
        `
        CREATE TABLE IF NOT EXISTS otps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          otp_code TEXT NOT NULL,
          otp_type TEXT NOT NULL, -- 'signup' or 'reset'
          expires_at DATETIME NOT NULL,
          used INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating otps table:", err.message);
            reject(err);
            return;
          }
          console.log("OTPs table ready");
        }
      );

      // Create pdfs table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS pdfs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          semester TEXT NOT NULL,
          course TEXT,
          department TEXT,
          year_of_study TEXT,
          blob_url TEXT NOT NULL,
          uploaded_by_user_id INTEGER NOT NULL,
          upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating pdfs table:", err.message);
            reject(err);
            return;
          }
          console.log("PDFs table ready");
        }
      );

      // Create ebooks table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS ebooks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          semester TEXT NOT NULL,
          course TEXT,
          department TEXT,
          year_of_study TEXT,
          blob_url TEXT NOT NULL,
          uploaded_by_user_id INTEGER NOT NULL,
          upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating ebooks table:", err.message);
            reject(err);
            return;
          }
          console.log("E-books table ready");
          resolve();
        }
      );
    });
  });
};

// Database query helpers
export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Initialize database on import
initializeDatabase().catch(console.error);

export default db;
