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

      // Create discussions table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS discussions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          tags TEXT, -- JSON array of tags
          images TEXT, -- JSON array of image URLs
          author_id INTEGER NOT NULL,
          views INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating discussions table:", err.message);
            reject(err);
            return;
          }
          console.log("Discussions table ready");
        }
      );

      // Create discussion_answers table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS discussion_answers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          discussion_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          images TEXT, -- JSON array of image URLs
          author_id INTEGER NOT NULL,
          is_best_answer INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (discussion_id) REFERENCES discussions (id),
          FOREIGN KEY (author_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error(
              "Error creating discussion_answers table:",
              err.message
            );
            reject(err);
            return;
          }
          console.log("Discussion answers table ready");
        }
      );

      // Create discussion_replies table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS discussion_replies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          answer_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          images TEXT, -- JSON array of image URLs
          author_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (answer_id) REFERENCES discussion_answers (id),
          FOREIGN KEY (author_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error(
              "Error creating discussion_replies table:",
              err.message
            );
            reject(err);
            return;
          }
          console.log("Discussion replies table ready");
        }
      );

      // Create discussion_votes table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS discussion_votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          discussion_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(discussion_id, user_id),
          FOREIGN KEY (discussion_id) REFERENCES discussions (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error(
              "Error creating discussion_votes table:",
              err.message
            );
            reject(err);
            return;
          }
          console.log("Discussion votes table ready");
        }
      );

      // Create answer_votes table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS answer_votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          answer_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(answer_id, user_id),
          FOREIGN KEY (answer_id) REFERENCES discussion_answers (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating answer_votes table:", err.message);
            reject(err);
            return;
          }
          console.log("Answer votes table ready");
        }
      );

      // Create reply_votes table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS reply_votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reply_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(reply_id, user_id),
          FOREIGN KEY (reply_id) REFERENCES discussion_replies (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating reply_votes table:", err.message);
            reject(err);
            return;
          }
          console.log("Reply votes table ready");
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
        }
      );

      // Create notifications table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'new_answer', 'mention', 'best_answer', 'reply'
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          related_id INTEGER, -- discussion_id or answer_id
          related_type TEXT, -- 'discussion' or 'answer'
          from_user_id INTEGER,
          from_username TEXT,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (from_user_id) REFERENCES users (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating notifications table:", err.message);
            reject(err);
            return;
          }
          console.log("Notifications table ready");
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
