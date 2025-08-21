import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();
// Create Turso client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL, // e.g. "libsql://your-db.turso.io"
  authToken: process.env.TURSO_AUTH_TOKEN, // from dashboard
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Users table
    await db.execute(`
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
    `);

    // OTPs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        otp_type TEXT NOT NULL, -- 'signup' or 'reset'
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PDFs table
    await db.execute(`
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
    `);

    // Discussions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS discussions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT,
        images TEXT,
        author_id INTEGER NOT NULL,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users (id)
      )
    `);

    // Discussion answers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS discussion_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discussion_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        images TEXT,
        author_id INTEGER NOT NULL,
        is_best_answer INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (discussion_id) REFERENCES discussions (id),
        FOREIGN KEY (author_id) REFERENCES users (id)
      )
    `);

    // Discussion replies table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS discussion_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        answer_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        images TEXT,
        author_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (answer_id) REFERENCES discussion_answers (id),
        FOREIGN KEY (author_id) REFERENCES users (id)
      )
    `);

    // Discussion votes table
    await db.execute(`
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
    `);

    // Answer votes table
    await db.execute(`
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
    `);

    // Reply votes table
    await db.execute(`
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
    `);

    // E-books table
    await db.execute(`
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
    `);

    // Notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        related_type TEXT,
        from_user_id INTEGER,
        from_username TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (from_user_id) REFERENCES users (id)
      )
    `);

    console.log("✅ All tables initialized on Turso");
  } catch (err) {
    console.error("Error initializing Turso DB:", err.message);
  }
};

// Query helpers
export const dbGet = async (sql, params = []) => {
  // Filter out undefined/null values and replace with appropriate defaults
  const cleanParams = params.map((param) => {
    if (param === undefined || param === null) {
      return null;
    }
    return param;
  });

  const result = await db.execute({ sql, args: cleanParams });
  return result.rows[0];
};

export const dbAll = async (sql, params = []) => {
  // Filter out undefined/null values and replace with appropriate defaults
  const cleanParams = params.map((param) => {
    if (param === undefined || param === null) {
      return null;
    }
    return param;
  });

  const result = await db.execute({ sql, args: cleanParams });
  return result.rows;
};

export const dbRun = async (sql, params = []) => {
  // Filter out undefined/null values and replace with appropriate defaults
  const cleanParams = params.map((param) => {
    if (param === undefined || param === null) {
      return null;
    }
    return param;
  });

  const result = await db.execute({ sql, args: cleanParams });
  return result;
};

// Initialize database on import
initializeDatabase();

export default db;
